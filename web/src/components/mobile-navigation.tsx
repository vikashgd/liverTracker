'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePWA } from './pwa-service-worker';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  shortLabel?: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: '🏠'
  },
  {
    href: '/reports',
    label: 'Reports',
    shortLabel: 'Reports',
    icon: '📄'
  },
  {
    href: '/manual-entry',
    label: 'Manual Entry',
    shortLabel: 'Entry',
    icon: '✍️'
  },
  {
    href: '/timeline',
    label: 'Timeline',
    shortLabel: 'Time',
    icon: '📅'
  }
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { isStandalone, isOnline } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navigation on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past header
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Mobile Bottom Navigation - Only show on mobile */}
      <nav 
        className={`
          fixed bottom-0 left-0 right-0 z-40 
          bg-white/95 backdrop-blur-lg border-t border-gray-200
          transition-transform duration-300 ease-in-out
          md:hidden
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          ${isStandalone ? 'pb-safe-area-inset-bottom' : 'pb-2'}
        `}
        style={{
          paddingBottom: isStandalone ? 'env(safe-area-inset-bottom)' : '8px'
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href === '/dashboard' && pathname === '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center
                  min-w-0 flex-1 py-2 px-1
                  rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }
                  active:scale-95
                `}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.shortLabel || item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-blue-600 rounded-full mt-1" />
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Online/Offline Indicator */}
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-1">
            <span className="text-xs">🔴 Offline Mode</span>
          </div>
        )}
      </nav>

      {/* Desktop Sidebar Navigation - Hidden on mobile */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-30">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h2>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                             (item.href === '/dashboard' && pathname === '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Online Status for Desktop */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg text-sm
            ${isOnline 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
            }
          `}>
            <span>{isOnline ? '🟢' : '🔴'}</span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      {/* Content Spacer for Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0" />

      {/* Bottom Spacer for Mobile Navigation */}
      <div className="md:hidden h-16 flex-shrink-0" />
    </>
  );
}

// Hook for mobile navigation awareness
export function useMobileNavigation() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
}
