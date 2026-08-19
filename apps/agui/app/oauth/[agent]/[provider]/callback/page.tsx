// OAuth callback — the page the provider redirects back to.
//
// TWO BUGS LIVED HERE.
//
// 1. THIS PAGE RENDERED ITS OWN <html>/<head>/<body>. In the App Router those
//    belong to app/layout.tsx, which already renders <html lang="en">. A page
//    nested inside it emitting a second <html> is invalid, SSR threw, and the
//    Cloudflare Workers runtime returned its unhandled-exception response —
//    `content-type: text/plain`, body exactly "Internal Server Error". That is
//    why THIS route 500'd while /oauth/callback and /oauth/[agent]/callback,
//    which render no <html>, both returned 200.
//
// 2. IT READ THE SESSION FROM THE QUERY STRING. ciris-server 0.5.180 no longer
//    puts a bearer in the redirect: a live 24h credential in a URL lands in
//    browser history, in the Referer of every later request, and in every proxy
//    log on the path. The destination now carries a SINGLE-USE `ciris_code`
//    redeemed at POST /v1/auth/oauth/exchange, session in the response body.
//    Without that exchange, every sign-in fell through to the failure branch and
//    told the user Google had refused them — when Google had not.
//
// The legacy query-param path is kept deliberately: a node that has not adopted
// 0.5.180 yet still signs users in that way, and this page serves both.

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// wrangler.toml sets this without a trailing /v1; .env.example sets it WITH one.
// Normalise so the exchange URL is right either way.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '')
  .replace(/\/v1\/?$/, '')
  .replace(/\/$/, '');

export default function OAuthCallbackPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ciris-oauth-callback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }
        .ciris-oauth-callback .spinner {
          border: 4px solid #e5e7eb;
          border-top: 4px solid #111827;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          animation: ciris-oauth-spin 1s linear infinite;
        }
        @keyframes ciris-oauth-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      ` }} />
      <div className="ciris-oauth-callback">
        <div className="spinner" />
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        (function () {
          var API_BASE = ` + JSON.stringify(API_BASE) + `;
          var params = new URLSearchParams(window.location.search);
          var parts = window.location.pathname.split('/');
          var agentId = parts[2] || '';
          var provider = parts[3] || '';

          // Narrate the decision. When this page redirects, whatever it knew is
          // gone unless the destination renders it — so leave a trace here too.
          console.log('[ciris-oauth] callback', {
            agentId: agentId,
            provider: provider,
            apiBase: API_BASE,
            query: Object.fromEntries(params.entries()),
            hasCode: !!params.get('ciris_code'),
            hasLegacyToken: !!params.get('access_token'),
            providerError: params.get('error') || null
          });

          function go(url) { console.log('[ciris-oauth] ->', url); window.location.href = url; }

          function fail(code, reason) {
            go('/login?error=' + encodeURIComponent(code)
               + '&provider=' + encodeURIComponent(provider)
               + (reason ? '&reason=' + encodeURIComponent(reason) : ''));
          }

          function store(s) {
            localStorage.setItem('ciris_auth_token', JSON.stringify({
              access_token: s.access_token,
              token_type: s.token_type || 'Bearer',
              expires_in: s.expires_in ? parseInt(s.expires_in, 10) : 3600,
              user_id: s.user_id,
              role: s.role,
              created_at: Date.now()
            }));
            localStorage.setItem('ciris_user', JSON.stringify({
              user_id: s.user_id,
              username: s.email || s.user_id,
              email: s.email || '',
              role: s.role,
              api_role: s.role,
              permissions: [],
              marketing_opt_in: s.marketing_opt_in === true || s.marketing_opt_in === 'true',
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            }));
            localStorage.setItem('selectedAgentId', agentId);
            localStorage.setItem('selectedAgentName',
              agentId ? agentId.charAt(0).toUpperCase() + agentId.slice(1) : '');
            localStorage.setItem('authProvider', provider);

            var back = localStorage.getItem('authReturnUrl') || '/';
            localStorage.removeItem('authReturnUrl');
            go(back);
          }

          // The provider itself refused. This is the ONLY case that is honestly
          // "oauth_failed" — everything else below is us not getting a session.
          if (params.get('error')) {
            fail('oauth_failed', params.get('error_description') || params.get('error'));
            return;
          }

          // 0.5.180+: redeem the single-use code. One redemption, 60s TTL.
          var code = params.get('ciris_code');
          if (code) {
            fetch(API_BASE + '/v1/auth/oauth/exchange', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: code })
            }).then(function (r) {
              return r.json().catch(function () { return {}; })
                .then(function (b) { return { ok: r.ok, body: b }; });
            }).then(function (res) {
              if (res.ok && res.body && res.body.access_token) {
                store(res.body);
              } else {
                // Surface reason_id: an expired code needs a retry and a refused
                // identity does not, and collapsing those is how this class of
                // bug starts.
                fail('no_session', (res.body && res.body.reason_id) || 'exchange_failed');
              }
            }).catch(function () {
              fail('no_session', 'exchange_unreachable');
            });
            return;
          }

          // Pre-0.5.180 nodes still hand the session back in the query string.
          var accessToken = params.get('access_token');
          if (accessToken && params.get('token_type') && params.get('role') && params.get('user_id')) {
            store({
              access_token: accessToken,
              token_type: params.get('token_type'),
              expires_in: params.get('expires_in'),
              role: params.get('role'),
              user_id: params.get('user_id'),
              email: params.get('email'),
              marketing_opt_in: params.get('marketing_opt_in')
            });
            return;
          }

          // Authentication may well have succeeded; no session reached this
          // browser. Do not report that as a rejection by the provider.
          fail('no_session', 'no_code_in_callback');
        })();
      ` }} />
    </>
  );
}
