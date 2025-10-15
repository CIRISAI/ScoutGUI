// Route handler for OAuth callback - returns raw HTML Response
// This bypasses all React rendering and works perfectly with Cloudflare Pages

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('TEST OK', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
