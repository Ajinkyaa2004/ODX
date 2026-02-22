'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard on load
    router.push('/dashboard');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <div className="animate-pulse">
          <h1 className="text-4xl font-bold text-center text-gray-900">
            Loading ODX Dashboard...
          </h1>
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-xl text-gray-700">NIFTY & BANKNIFTY Options Analysis</p>
          <p className="text-gray-500">
            Real-time scoring • Option chain analysis • Risk management
          </p>
        </div>

        <div className="mt-4">
          <a 
            href="/dashboard" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Go to Dashboard
          </a>
        </div>

        <p className="text-xs text-gray-500 text-center mt-8">
          Deterministic • Explainable • Risk-Aware
        </p>
      </div>
    </main>
  )
}
