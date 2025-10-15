// Route handler for OAuth callback - returns raw HTML Response
// This bypasses all React rendering and works perfectly with Cloudflare Pages

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Completing Authentication...</title>
    <style>
      body {
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f9fafb;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      .container { text-align: center; }
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
      h2 { color: #111827; margin-top: 1rem; }
      p { color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="spinner"></div>
      <h2>Completing authentication...</h2>
      <p>Please wait</p>
    </div>
    <script>
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const tokenType = params.get('token_type');
      const role = params.get('role');
      const userId = params.get('user_id');
      const expiresIn = params.get('expires_in');

      if (accessToken && tokenType && role && userId) {
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
          wa_role: void 0,
          permissions: [],
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };

        localStorage.setItem('ciris_auth_token', JSON.stringify(authData));
        localStorage.setItem('ciris_user', JSON.stringify(user));

        const pathParts = window.location.pathname.split('/');
        const agentId = pathParts[2];
        const provider = pathParts[3];
        const agentName = agentId.charAt(0).toUpperCase() + agentId.slice(1);

        localStorage.setItem('selectedAgentId', agentId);
        localStorage.setItem('selectedAgentName', agentName);
        localStorage.setItem('authProvider', provider);

        const returnUrl = localStorage.getItem('authReturnUrl') || '/';
        localStorage.removeItem('authReturnUrl');
        window.location.href = returnUrl;
      } else {
        window.location.href = '/login?error=oauth_failed';
      }
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
