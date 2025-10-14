'use client';

export const runtime = 'edge';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { cirisClient } from '../../../../../lib/ciris-sdk';
import { AuthStore } from '../../../../../lib/ciris-sdk/auth-store';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { setUser, setToken } = useAuth();
  
  // Extract dynamic route parameters
  const agentId = params.agent as string;
  const provider = params.provider as string;

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Configure SDK with agent-specific base URL
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_SCOUT_API_URL || `${window.location.origin}/api/${agentId}/v1`;
        console.log('[OAuth Callback] Configuring SDK with baseURL:', baseURL);
        cirisClient.setConfig({ baseURL });

      // Handle the OAuth token response from API
      const accessToken = searchParams.get('access_token');
      const tokenType = searchParams.get('token_type');
      const role = searchParams.get('role');
      const userId = searchParams.get('user_id');
      const expiresIn = searchParams.get('expires_in');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('[OAuth Callback] Received params:', { accessToken: !!accessToken, tokenType, role, userId, expiresIn });

      // Set the token in the SDK BEFORE making any API calls
      if (accessToken && tokenType && role && userId) {
        AuthStore.saveToken({
          access_token: accessToken,
          token_type: tokenType,
          expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
          user_id: userId,
          role: role,
          created_at: Date.now()
        });
        console.log('[OAuth Callback] Token saved to AuthStore');
      }

      // Check if this is an account linking operation
      const oauthIntention = localStorage.getItem('oauthIntention');
      const isLinking = oauthIntention === 'link';

      // Handle OAuth errors
      if (error) {
        console.error(`OAuth error from ${provider}:`, error, errorDescription);
        const redirectUrl = isLinking
          ? `/account?error=oauth_failed&provider=${provider}&description=${encodeURIComponent(errorDescription || error)}`
          : `/login?error=oauth_failed&provider=${provider}&description=${encodeURIComponent(errorDescription || error)}`;
        router.push(redirectUrl);
        return;
      }

      if (accessToken && tokenType && role && userId) {
        if (isLinking) {
          // This is an account linking operation - actually link the account
          try {
            // Get current user to link the OAuth account
            const currentUser = await cirisClient.auth.getMe();

            // Extract OAuth account details from query params
            const accountName = searchParams.get('account_name') || userId;
            const email = searchParams.get('email');

            // Call API to link the OAuth account
            await cirisClient.users.linkOAuthAccount(currentUser.user_id, {
              provider: provider,
              external_id: userId,
              account_name: accountName,
              metadata: email ? { email } : {}
            });

            console.log(`Account linking successful for ${provider} (${accountName})`);

            // Clean up linking-specific localStorage items
            localStorage.removeItem('oauthIntention');
            localStorage.removeItem('oauthProvider');

            // Redirect back to account page with success message
            const returnUrl = localStorage.getItem('oauthReturnUrl') || '/account';
            localStorage.removeItem('oauthReturnUrl');
            router.push(`${returnUrl}?linked=${provider}&success=true`);
          } catch (linkError) {
            console.error(`Failed to link ${provider} account:`, linkError);
            const returnUrl = localStorage.getItem('oauthReturnUrl') || '/account';
            localStorage.removeItem('oauthReturnUrl');
            router.push(`${returnUrl}?error=link_failed&provider=${provider}&description=${encodeURIComponent(linkError instanceof Error ? linkError.message : 'Unknown error')}`);
          }
        } else {
          // This is a login operation - set authentication state
          console.log('[OAuth Callback] Processing login operation');
          const user = {
            user_id: userId,
            username: userId,
            role: role as any, // Role comes as string from query params
            api_role: role as any,
            wa_role: undefined,
            permissions: [],
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          };

          // Save user to AuthStore
          AuthStore.saveUser(user);
          console.log('[OAuth Callback] User saved to AuthStore:', user);

          // Set auth context
          setToken(accessToken);
          setUser(user);

          // Store agent info with proper formatting
          const agentName = agentId.charAt(0).toUpperCase() + agentId.slice(1);
          localStorage.setItem('selectedAgentId', agentId);
          localStorage.setItem('selectedAgentName', agentName);
          localStorage.setItem('authProvider', provider);

          console.log('[OAuth Callback] Redirecting to dashboard');

          // Redirect to dashboard or originally requested page
          const returnUrl = localStorage.getItem('authReturnUrl') || '/';
          localStorage.removeItem('authReturnUrl');
          router.push(returnUrl);
        }
      } else {
        // If no token, redirect with error
        const redirectUrl = isLinking
          ? `/account?error=oauth_failed&provider=${provider}&agent=${agentId}`
          : `/login?error=oauth_failed&provider=${provider}&agent=${agentId}`;
        router.push(redirectUrl);
      }
      } catch (error) {
        console.error('[OAuth Callback] Error:', error);
        router.push(`/login?error=callback_failed&description=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser, setToken, agentId, provider]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Completing {provider} authentication...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connecting to {agentId} agent
        </p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loading...</h2>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}