import React from "react";
import Link from "next/link";

interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText?: string;
  footerLink?: {
    text: string;
    href: string;
  };
  showLogo?: boolean;
}

export default function AuthFormWrapper({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  showLogo = true
}: AuthFormWrapperProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {showLogo && (
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.707 6.293a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
          </p>
        </div>
        
        {children}
        
        {footerText && footerLink && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {footerText}{' '}
              <Link href={footerLink.href} className="font-medium text-blue-600 hover:text-blue-500">
                {footerLink.text}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}