"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { OfflineStatusBadge } from '@/components/offline-indicator';

export function MedicalHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Upload Report', href: '/', icon: '📄' },
    { name: 'Manual Entry', href: '/manual-entry', icon: '✍️' },
    { name: 'Reports Library', href: '/reports', icon: '🗂️' },
    { name: 'Timeline', href: '/timeline', icon: '📅' },
    { name: 'Debug Data', href: '/debug-data', icon: '🔍' },
    { name: 'Data Fix', href: '/admin/data-fix', icon: '🔧' },
  ];

  const isCurrentPage = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="bg-white border-b border-medical-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="medical-layout-container">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-medical-primary-500 to-medical-primary-600 rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow">
                <span className="text-white font-bold text-lg">🩺</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-medical-neutral-900">LiverTracker</h1>
                <p className="text-xs text-medical-neutral-500 hidden sm:block">Medical Data Intelligence</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link flex items-center space-x-2 ${
                  isCurrentPage(item.href) ? 'nav-link-active' : ''
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <OfflineStatusBadge />
            {session ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-medical-neutral-900">
                    {session.user?.name || session.user?.email}
                  </p>
                  <p className="text-xs text-medical-neutral-500">Patient</p>
                </div>
                <div className="w-8 h-8 bg-medical-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-medical-primary-600 font-medium text-sm">
                    {(session.user?.name?.[0] || session.user?.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/signin" className="btn-primary">
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden btn-secondary p-2"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-medical-neutral-200 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`nav-link flex items-center space-x-3 w-full ${
                    isCurrentPage(item.href) ? 'nav-link-active' : ''
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
