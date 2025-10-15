// Client-side OAuth callback page
// Receives auth tokens from scoutapi.ciris.ai and stores them in localStorage

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function OAuthCallbackPage() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Completing Authentication...</title>
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            margin: 0;
            font-family: system-ui, sans-serif;
            background: #f9fafb;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .spinner {
            border: 4px solid #e5e7eb;
            border-top: 4px solid #111827;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        ` }} />
      </head>
      <body>
        <div className="spinner"></div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const params = new URLSearchParams(window.location.search);
            const accessToken = params.get('access_token');
            const tokenType = params.get('token_type');
            const role = params.get('role');
            const userId = params.get('user_id');
            const expiresIn = params.get('expires_in');
            const email = params.get('email');
            const marketingOptIn = params.get('marketing_opt_in') === 'true';

            if (accessToken && tokenType && role && userId) {
              localStorage.setItem('ciris_auth_token', JSON.stringify({
                access_token: accessToken,
                token_type: tokenType,
                expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
                user_id: userId,
                role: role,
                created_at: Date.now()
              }));

              localStorage.setItem('ciris_user', JSON.stringify({
                user_id: userId,
                username: email || userId,
                email: email || '',
                role: role,
                api_role: role,
                permissions: [],
                marketing_opt_in: marketingOptIn,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
              }));

              const pathParts = window.location.pathname.split('/');
              localStorage.setItem('selectedAgentId', pathParts[2]);
              localStorage.setItem('selectedAgentName', pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1));
              localStorage.setItem('authProvider', pathParts[3]);

              window.location.href = localStorage.getItem('authReturnUrl') || '/';
              localStorage.removeItem('authReturnUrl');
            } else {
              window.location.href = '/login?error=oauth_failed';
            }
          })();
        ` }} />
      </body>
    </html>
  );
}
