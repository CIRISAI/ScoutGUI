// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Completing authentication...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Please wait</p>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const params = new URLSearchParams(window.location.search);
              const accessToken = params.get('access_token');
              const tokenType = params.get('token_type');
              const role = params.get('role');
              const userId = params.get('user_id');
              const expiresIn = params.get('expires_in');

              if (accessToken && tokenType && role && userId) {
                // Store auth data in localStorage
                const authData = {
                  access_token: accessToken,
                  token_type: tokenType,
                  expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
                  user_id: userId,
                  role: role,
                  created_at: Date.now()
                };

                const user = {
                  user_id: userId,
                  username: userId,
                  role: role,
                  api_role: role,
                  wa_role: undefined,
                  permissions: [],
                  created_at: new Date().toISOString(),
                  last_login: new Date().toISOString()
                };

                localStorage.setItem('ciris_auth_token', JSON.stringify(authData));
                localStorage.setItem('ciris_user', JSON.stringify(user));

                // Store agent info
                const pathParts = window.location.pathname.split('/');
                const agentId = pathParts[2]; // /oauth/[agent]/[provider]/callback
                const provider = pathParts[3];
                const agentName = agentId.charAt(0).toUpperCase() + agentId.slice(1);

                localStorage.setItem('selectedAgentId', agentId);
                localStorage.setItem('selectedAgentName', agentName);
                localStorage.setItem('authProvider', provider);

                // Redirect to home
                const returnUrl = localStorage.getItem('authReturnUrl') || '/';
                localStorage.removeItem('authReturnUrl');
                window.location.href = returnUrl;
              } else {
                // Redirect to login with error
                window.location.href = '/login?error=oauth_failed';
              }
            })();
          `
        }} />
      </div>
    </div>
  );
}
