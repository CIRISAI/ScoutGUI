// Simple test route without dynamic segments
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('SIMPLE TEST OK', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
