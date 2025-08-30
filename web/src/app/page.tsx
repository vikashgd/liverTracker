"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import the dashboard with no SSR for faster initial load
const FastDashboard = dynamic(() => import("@/components/fast-dashboard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading LiverTracker...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading LiverTracker...</p>
        </div>
      </div>
    }>
      <FastDashboard />
    </Suspense>
  );
}