'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { LandingPage } from '@/components/landing/landing-page';

function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If authenticated, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading LiverTracker...</h2>
          <p className="text-gray-500">Checking your authentication status</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}

// Fallback component for any loading issues
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <img 
          src="/logo150x150.png" 
          alt="LiverTracker Logo" 
          className="w-16 h-16 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">LiverTracker</h1>
        <p className="text-xl text-gray-600 mb-8">Track Your Liver. Extend Your Life.</p>
        <div className="animate-pulse bg-gray-200 h-4 w-48 mx-auto rounded"></div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePage />
    </Suspense>
  );
}