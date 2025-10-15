'use client';

import dynamic from 'next/dynamic';

export const runtime = 'edge';

// Disable SSR for the OAuth callback to prevent server-side errors
// This page needs to run entirely in the browser to access window, localStorage, etc.
const OAuthCallbackContent = dynamic(() => import('./callback-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loading...</h2>
      </div>
    </div>
  ),
});

export default function OAuthCallbackPage() {
  return <OAuthCallbackContent />;
}
