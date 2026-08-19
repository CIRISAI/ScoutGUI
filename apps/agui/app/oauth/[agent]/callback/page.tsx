'use client';

export const runtime = 'edge';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { cirisClient } from '../../../../lib/ciris-sdk';
import { getApiBaseUrl, detectDeploymentMode } from '../../../../lib/api-utils';
import { sdkConfigManager } from '../../../../lib/sdk-config-manager';
import { AuthStore } from '../../../../lib/ciris-sdk/auth-store';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { setUser, setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    handleOAuthCallback();
  }, [searchParams, params]);

  const handleOAuthCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const agentId = params.agent as string;

    // Check if we have direct token parameters (from API redirect)
    const accessToken = searchParams.get('access_token');
    const tokenType = searchParams.get('token_type');
    const role = searchParams.get('role');
    const userId = searchParams.get('user_id');

    if (error) {
      setError(`OAuth error: ${error} - ${errorDescription || 'Unknown error'}`);
      setProcessing(false);
      return;
    }

    // ONE PLACE THAT ESTABLISHES A SESSION, whichever route produced it.
    // Both the single-use-code exchange and the legacy query-string response end
    // up here, so SDK configuration, AuthStore writes and auth-context updates
    // cannot drift apart between them.
    const establishSession = (s: {
      access_token: string;
      token_type?: string;
      role: string;
      user_id: string;
      expires_in?: number;
      email?: string;
    }) => {
      const user = {
        user_id: s.user_id,
        username: s.email || s.user_id,
        role: s.role as any, // Role comes as a string over the wire
        api_role: s.role as any, // For the required api_role field
        wa_role: undefined, // OAuth users don't have WA role initially
        permissions: [],
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      // CRITICAL: Configure SDK before setting auth state, so every subsequent
      // API call uses the right configuration.
      sdkConfigManager.configureForOAuthCallback(agentId, s.access_token);

      AuthStore.saveToken({
        access_token: s.access_token,
        token_type: s.token_type || 'Bearer',
        expires_in: s.expires_in || 3600,
        user_id: s.user_id,
        role: s.role,
        created_at: Date.now()
      });
      AuthStore.saveUser(user);

      setToken(s.access_token);
      setUser(user);
      localStorage.setItem('selectedAgentId', agentId);

      const { mode } = detectDeploymentMode();
      const dest = mode === 'managed' ? `/agent/${agentId}` : '/';
      console.log('[OAuth Callback] session established, redirecting to', dest);
      router.push(dest);
    };

    // THE SINGLE-USE CODE (CIRISServer#439).
    //
    // The node stopped echoing a live bearer back in the URL — that put a 24h
    // credential into browser history, into the Referer of every subsequent
    // request, and into every proxy log on the path. It parks the session and
    // hands back a one-time `ciris_code`, redeemed in a POST response BODY.
    //
    // This route had no idea. It checked only for `access_token`, so a node on
    // the exchange flow would have fallen through to "Missing OAuth callback
    // parameters" — reporting a malformed callback for a sign-in that had
    // entirely succeeded. That is precisely what oauth-complete.html did to
    // Scout users until it was fixed; this is the same landmine sitting in the
    // route nothing happens to redirect to today. "Nothing routes here yet" is
    // not a property worth depending on.
    const cirisCode = searchParams.get('ciris_code');
    if (!accessToken && cirisCode) {
      try {
        const baseURL = getApiBaseUrl(agentId);
        console.log('[OAuth Callback] redeeming ciris_code at', `${baseURL}/v1/auth/oauth/exchange`);
        const res = await fetch(`${baseURL}/v1/auth/oauth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cirisCode })
        });
        const body: any = await res.json().catch(() => ({}));
        console.log('[OAuth Callback] exchange ->', res.status, res.ok ? 'ok' : (body?.reason_id || 'refused'));
        if (res.ok && body?.access_token) {
          establishSession(body);
        } else {
          // Carry the node's OWN reason through. An expired code needs a retry
          // and a refused identity does not, and collapsing those is how this
          // class of bug starts.
          setError(`Sign-in completed, but no session reached this browser (${body?.reason_id || `exchange_http_${res.status}`}).`);
          setProcessing(false);
        }
      } catch (err) {
        console.error('[OAuth Callback] exchange unreachable:', err);
        setError('Sign-in completed, but this browser could not reach the agent to redeem it.');
        setProcessing(false);
      }
      return;
    }

    // Pre-exchange nodes still hand the session back in the query string.
    if (accessToken && tokenType && role && userId) {
      try {
        console.log('[OAuth Callback] Processing direct token response:', { agentId, userId, role });
        establishSession({
          access_token: accessToken,
          token_type: tokenType,
          role,
          user_id: userId,
          email: searchParams.get('email') || undefined
        });
        return;
      } catch (err) {
        console.error('[OAuth Callback] Error:', err);
        setError(err instanceof Error ? err.message : 'OAuth authentication failed');
        setProcessing(false);
        return;
      }
    }

    // Original OAuth code flow (if needed in future)
    if (!code || !state) {
      setError('Missing OAuth callback parameters');
      setProcessing(false);
      return;
    }

    try {
      // Update the SDK to use the correct agent URL based on deployment mode
      const baseURL = getApiBaseUrl(agentId);
      cirisClient.setConfig({ baseURL });

      // Extract provider from state (we'll encode it in the state parameter)
      const provider = state.split(':')[0];

      const user = await cirisClient.auth.handleOAuthCallback(provider, code, state);

      // Set the authentication state
      setUser(user);

      // Store the selected agent for future use
      localStorage.setItem('selectedAgentId', agentId);

      // Redirect to main page or managed agent page based on mode
      const { mode } = detectDeploymentMode();
      if (mode === 'managed') {
        router.push(`/agent/${agentId}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth authentication failed');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            OAuth Authentication
          </h2>

          {processing ? (
            <div className="mt-8">
              <div className="inline-flex items-center">
                <svg className="animate-spin h-8 w-8 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600">Processing authentication...</span>
              </div>
            </div>
          ) : error ? (
            <div className="mt-8">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Login
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Loading...</h2>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
