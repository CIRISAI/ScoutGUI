"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { SDK_VERSION } from "../../lib/ciris-sdk/version";
import LogoIcon from "../../components/ui/floating/LogoIcon";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [betaAcknowledged, setBetaAcknowledged] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // OAuth providers
  const oauthProviders = [
    { provider: "google", name: "Google" }
  ];

  const handleBasicLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      // Login successful - AuthContext will handle the redirect
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    try {
      // Clear any leftover OAuth linking state
      localStorage.removeItem('oauthIntention');
      localStorage.removeItem('oauthProvider');
      localStorage.removeItem('oauthReturnUrl');

      const apiBaseUrl = process.env.NEXT_PUBLIC_SCOUT_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      // Use static HTML callback page
      const callbackUrl = `${window.location.origin}/oauth-complete.html?marketing_opt_in=${marketingOptIn}`;
      const redirectUri = encodeURIComponent(callbackUrl);
      // apiBaseUrl does NOT include /v1, so we need to add it
      const oauthUrl = `${apiBaseUrl}/v1/auth/oauth/${provider}/login`;

      window.location.href = `${oauthUrl}?redirect_uri=${redirectUri}`;
    } catch (error) {
      console.error("OAuth login error:", error);
      setError(error instanceof Error ? error : new Error('OAuth login failed'));
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case "discord":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        );
      default:
        return "🔑";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 px-4">
        <div>
          <LogoIcon className="mx-auto h-12 w-auto text-brand-primary fill-brand-primary" />
          <h2 className="mt-6 text-center text-3xl text-brand-primary font-extrabold">
            Sign in to Scout
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your Scout AI agent
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error.message}</p>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6">
          {/* Terms and Consent Checkboxes */}
          <div className="space-y-4">
            {/* Beta Acknowledgment - Required */}
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="beta-acknowledgment"
                  name="beta-acknowledgment"
                  type="checkbox"
                  checked={betaAcknowledged}
                  onChange={(e) => setBetaAcknowledged(e.target.checked)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="beta-acknowledgment" className="font-medium text-gray-700 cursor-pointer">
                  <span className="text-red-600">*</span> Beta System Acknowledgment
                </label>
                <p className="text-gray-500 text-xs mt-1">
                  By checking this box you recognize this is a beta system being provided for evaluation purposes only. No sensitive or private data should be entered. All local and international laws apply. Usage restricted to adults and prohibited in countries sanctioned by the USA.
                </p>
              </div>
            </div>

            {/* Marketing Opt-In - Optional */}
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="marketing-opt-in"
                  name="marketing-opt-in"
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="marketing-opt-in" className="font-medium text-gray-700 cursor-pointer">
                  Marketing Communications
                </label>
                <p className="text-gray-500 text-xs mt-1">
                  Check this box to opt in to receiving marketing materials from Scout.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Auth Login Form - For development */}
          {process.env.NODE_ENV === 'development' && (
            <form onSubmit={handleBasicLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !username || !password || !betaAcknowledged}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>
            </form>
          )}

          {/* OAuth Login Options */}
          <div className="mt-6">
            {process.env.NODE_ENV !== 'development' && (
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">
                    Sign in with
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {oauthProviders.map((provider) => (
                <button
                  key={provider.provider}
                  type="button"
                  onClick={() => handleOAuthLogin(provider.provider)}
                  disabled={!betaAcknowledged}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="mr-2">
                    {getProviderIcon(provider.provider)}
                  </span>
                  {provider.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Version indicator */}
        <div className="mt-4 text-center text-xs text-gray-400">
          v{SDK_VERSION.version} • {SDK_VERSION.gitHash?.substring(0, 7) || 'dev'}
        </div>
      </div>
    </div>
  );
}
