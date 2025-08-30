"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface MobileAuthWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText?: string;
  footerLink?: {
    text: string;
    href: string;
  };
  showLogo?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function MobileAuthWrapper({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  showLogo = true,
  showBackButton = false,
  onBack
}: MobileAuthWrapperProps) {
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    // Handle mobile viewport height issues
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return (
    <div 
      className="flex flex-col bg-gray-50"
      style={{ minHeight: viewportHeight || '100vh' }}
    >
      {/* Mobile Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          {showBackButton && (
            <button
              onClick={onBack || (() => window.history.back())}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {showLogo && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.707 6.293a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">LiverTrack</span>
            </div>
          )}
          
          <div className="w-10"> {/* Spacer for centering */}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-sm mx-auto space-y-6">
          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          </div>
          
          {/* Form Content */}
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      {footerText && footerLink && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4 text-center">
          <p className="text-sm text-gray-600">
            {footerText}{' '}
            <Link href={footerLink.href} className="font-medium text-blue-600 hover:text-blue-500">
              {footerLink.text}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}