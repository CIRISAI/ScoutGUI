import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: '/oauth/:agent/:provider/callback',
};

export function middleware(request: NextRequest) {
  const url = request.url;

  // Check for malformed query string with double ?
  // Example: ?marketing_opt_in=false?access_token=...
  const doubleQuestionMark = url.match(/\?([^?]+)\?(.+)/);

  if (doubleQuestionMark) {
    // Fix the URL by replacing second ? with &
    const fixedUrl = url.replace(/\?([^?]+)\?/, '?$1&');

    console.log('[OAuth Middleware] Fixed malformed URL');
    console.log('[OAuth Middleware] Original:', url);
    console.log('[OAuth Middleware] Fixed:', fixedUrl);

    // Redirect to the fixed URL
    return NextResponse.redirect(new URL(fixedUrl));
  }

  // URL is fine, continue normally
  return NextResponse.next();
}
