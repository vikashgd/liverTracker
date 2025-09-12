'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in with this account.',
          details: 'This could be because your Google OAuth app is in testing mode and your email is not added to the test users list.'
        };
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the server configuration.',
          details: 'Please contact the administrator.'
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          message: 'The verification token has expired or is invalid.',
          details: 'Please try signing in again.'
        };
      case 'Callback':
        return {
          title: 'OAuth Callback Error',
          message: 'There was an issue processing the OAuth response.',
          details: 'This is usually temporary. Please try signing in again, or use email/password authentication.'
        };
      case 'OAuthCallback':
        return {
          title: 'OAuth Processing Error',
          message: 'The OAuth provider response could not be processed.',
          details: 'Please try again or use email/password authentication as an alternative.'
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An error occurred during authentication.',
          details: error ? `Error: ${error}` : 'Please try again.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorInfo.message}
          </p>
          {errorInfo.details && (
            <p className="mt-2 text-xs text-gray-500">
              {errorInfo.details}
            </p>
          )}
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go Home
          </Link>
        </div>

        {(error === 'AccessDenied' || error === 'Callback' || error === 'OAuthCallback') && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="text-sm font-medium text-yellow-800">Google OAuth Issue</h3>
              <p className="mt-2 text-sm text-yellow-700">
                Your Google account exists but OAuth is not configured for public access.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-800">Quick Solution:</h3>
              <p className="mt-2 text-sm text-blue-700">
                Use email/password login instead:
              </p>
              <div className="mt-3">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Email/Password Login
                </Link>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-medium text-gray-800">For Developers:</h3>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Add your email to Google OAuth test users</li>
                <li>Or publish the OAuth app for public access</li>
                <li>Check Google Cloud Console &gt; APIs &amp; Services &gt; OAuth consent screen</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}