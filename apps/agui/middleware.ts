import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/oauth/:agent/:provider/callback',
    '/_next/data/:build/oauth/:agent/:provider/callback.json'
  ],
};

export function middleware(request: NextRequest) {
  const url = request.url;

  // Check for malformed query string with double ?
  // Handle both raw ? and URL-encoded %3F
  // Example 1: ?marketing_opt_in=false?access_token=...
  // Example 2: ?marketing_opt_in=false%3Faccess_token=...
  let fixedUrl = url;
  let needsRedirect = false;

  // Check for double ? (raw)
  if (url.match(/\?([^?]+)\?(.+)/)) {
    fixedUrl = url.replace(/\?([^?]+)\?/, '?$1&');
    needsRedirect = true;
  }
  // Check for URL-encoded ? (%3F) in query string
  else if (url.includes('%3F')) {
    // Find the query string part
    const [baseUrl, queryString] = url.split('?');
    if (queryString) {
      // Replace %3F with & in the query string (only after the first real ?)
      const fixedQuery = queryString.replace(/%3F/g, '&');
      fixedUrl = `${baseUrl}?${fixedQuery}`;
      needsRedirect = true;
    }
  }

  if (needsRedirect) {
    console.log('[OAuth Middleware] Fixed malformed URL');
    console.log('[OAuth Middleware] Original:', url);
    console.log('[OAuth Middleware] Fixed:', fixedUrl);

    // Redirect to the fixed URL
    return NextResponse.redirect(new URL(fixedUrl));
  }

  // URL is fine, continue normally
  return NextResponse.next();
}
