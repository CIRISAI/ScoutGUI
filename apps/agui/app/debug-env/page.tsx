"use client";

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SCOUT_API_URL: process.env.NEXT_PUBLIC_SCOUT_API_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(envVars, null, 2)}
      </pre>
      <div className="mt-4">
        <p className="font-semibold">Window location:</p>
        <pre className="bg-gray-100 p-4 rounded mt-2">
          {typeof window !== 'undefined' ? window.location.hostname : 'server-side'}
        </pre>
      </div>
    </div>
  );
}
