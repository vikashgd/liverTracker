'use client';

import Link from 'next/link';
import { useState } from 'react';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/logo150x150.png" 
                alt="LiverTracker Logo" 
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-gray-900">LiverTracker</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors font-semibold">
              Features
            </a>
            <a href="#why-us" className="text-gray-700 hover:text-gray-900 transition-colors font-semibold">
              Why Us
            </a>
            <a href="#faqs" className="text-gray-700 hover:text-gray-900 transition-colors font-semibold">
              FAQs
            </a>
            <a href="#contact" className="text-gray-700 hover:text-gray-900 transition-colors font-semibold">
              Contact
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/auth/signin"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors font-semibold">
                Features
              </a>
              <a href="#why-us" className="text-gray-700 hover:text-gray-900 transition-colors font-semibold">
                Why Us
              </a>
              <a href="#faqs" className="text-gray-700 hover:text-gray-900 transition-colors font-semibold">
                FAQs
              </a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900 transition-colors font-semibold">
                Contact
              </a>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}