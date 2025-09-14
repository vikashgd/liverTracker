/**
 * Enhanced Medical Header with Improved Authentication State Management
 */

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { OfflineStatusBadge } from '@/components/offline-indicator';
import { 
  BarChart3, 
  Upload, 
  FileText, 
  FolderOpen, 
  Calculator, 
  Scan, 
  User, 
  Settings, 
  Search, 
  Wrench,
  ChevronDown,
  Menu,
  X,
  Activity,
  Heart,
  Shield,
  Bell,
  LogOut
} from 'lucide-react';

export function EnhancedMedicalHeader() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Client-side only state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging to see what's happening with session
  useEffect(() => {
    if (isClient) {
      console.log('🔍 Enhanced Header Debug:', { 
        status, 
        hasSession: !!session, 
        userEmail: session?.user?.email,
        userName: session?.user?.name,
        isClient 
      });
    }
  }, [status, session, isClient]);

  // Enhanced logout handler with proper state management
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    try {
      setIsLoggingOut(true);
      setOpenDropdown(null);
      setIsMobileMenuOpen(false);
      
      // Clear any local state immediately for instant UI feedback
      
      // Perform the actual logout
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Reset logout state on error
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Reset logout state when session changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsLoggingOut(false);
    }
  }, [status]);

  const navigationGroups = [
    {
      name: 'Liver Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      type: 'single'
    },
    {
      name: 'Upload',
      icon: Upload,
      type: 'dropdown',
      items: [
        { name: 'Upload Report', href: '/upload-enhanced', icon: FileText },
        { name: 'Manual Entry', href: '/manual-entry', icon: Upload },
      ]
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FolderOpen,
      type: 'single'
    },
    {
      name: 'Analysis',
      icon: Calculator,
      type: 'dropdown',
      items: [
        { name: 'AI Intelligence', href: '/ai-intelligence', icon: Activity },
        { name: 'Medical Scoring', href: '/scoring', icon: Calculator },
        { name: 'Imaging Analysis', href: '/imaging', icon: Scan },
      ]
    },
    {
      name: 'Admin',
      icon: Wrench,
      type: 'dropdown',
      items: [
        { name: 'Debug Data', href: '/debug-data', icon: Search },
        { name: 'Data Fix', href: '/admin/data-fix', icon: Wrench },
      ]
    },
  ];

  // Flattened navigation for mobile menu
  const navigation = [
    { name: 'Liver Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Upload Report', href: '/upload-enhanced', icon: FileText },
    { name: 'Manual Entry', href: '/manual-entry', icon: Upload },
    { name: 'Reports Library', href: '/reports', icon: FolderOpen },
    { name: 'AI Intelligence', href: '/ai-intelligence', icon: Activity },
    { name: 'Medical Scoring', href: '/scoring', icon: Calculator },
    { name: 'Imaging Analysis', href: '/imaging', icon: Scan },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Debug Data', href: '/debug-data', icon: Search },
    { name: 'Data Fix', href: '/admin/data-fix', icon: Wrench },
  ];

  const isCurrentPage = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  // Enhanced user display with proper loading states and hydration safety
  const renderUserSection = () => {
    // Prevent hydration mismatch by showing loading state until client-side
    if (!isClient || status === 'loading') {
      return (
        <div className="flex items-center space-x-2 px-4 py-2 text-slate-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
          <span className="text-sm">Loading...</span>
        </div>
      );
    }

    if (isLoggingOut) {
      return (
        <div className="flex items-center space-x-2 px-4 py-2 text-slate-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
          <span className="text-sm">Signing out...</span>
        </div>
      );
    }

    if (status === 'authenticated' && session?.user) {
      return (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {session.user.name || session.user.email}
                </p>
                <div className="flex items-center justify-end space-x-1">
                  <Shield className="w-3 h-3 text-green-500" />
                  <p className="text-xs text-slate-500 font-medium">Patient Portal</p>
                </div>
              </div>
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                openDropdown === 'user' ? 'rotate-180' : ''
              }`} />
            </button>
            
            {openDropdown === 'user' && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200/60 py-2 z-50 backdrop-blur-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Patient Portal Access</p>
                </div>
                
                <Link
                  href="/profile"
                  onClick={() => setOpenDropdown(null)}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                    isCurrentPage('/profile') 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">Profile</span>
                </Link>
                
                <Link
                  href="/settings"
                  onClick={() => setOpenDropdown(null)}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                    isCurrentPage('/settings') 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Settings</span>
                </Link>
                
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Unauthenticated state
    return (
      <Link 
        href="/auth/signin" 
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
      >
        <User className="w-4 h-4" />
        <span>Sign In</span>
      </Link>
    );
  };

  return (
    <header ref={headerRef} className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <img 
                src="/logo150x150.png" 
                alt="LiverTracker Logo" 
                className="w-10 h-10 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  LiverTracker
                </h1>
                <p className="text-xs text-slate-500 font-medium">Track Your Liver. Extend Your Life.</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Only show if authenticated and client-side */}
          {isClient && status === 'authenticated' && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationGroups.map((group) => {
                const IconComponent = group.icon;
                return (
                  <div key={group.name} className="relative">
                    {group.type === 'single' ? (
                      <Link
                        href={group.href!}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isCurrentPage(group.href!) 
                            ? 'bg-blue-50 text-blue-700 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{group.name}</span>
                      </Link>
                    ) : (
                      <div>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === group.name ? null : group.name)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            group.items?.some(item => isCurrentPage(item.href)) 
                              ? 'bg-blue-50 text-blue-700 shadow-sm' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{group.name}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                            openDropdown === group.name ? 'rotate-180' : ''
                          }`} />
                        </button>
                        
                        {openDropdown === group.name && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200/60 py-2 z-50 backdrop-blur-sm">
                            <div className="px-3 py-2 border-b border-slate-100">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{group.name}</p>
                            </div>
                            {group.items?.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  onClick={() => setOpenDropdown(null)}
                                  className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                                    isCurrentPage(item.href) 
                                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  <ItemIcon className="w-4 h-4" />
                                  <span className="font-medium">{item.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <OfflineStatusBadge />
            
            {/* Notifications - Only show if authenticated and client-side */}
            {isClient && status === 'authenticated' && (
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* User section with enhanced state management */}
            {renderUserSection()}

            {/* Mobile menu button - Only show if authenticated and client-side */}
            {isClient && status === 'authenticated' && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation - Only show if authenticated and client-side */}
        {isClient && status === 'authenticated' && isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-6 space-y-1">
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">Navigation</p>
              </div>
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isCurrentPage(item.href) 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {session?.user && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</p>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {session.user.name || session.user.email}
                      </p>
                      <p className="text-xs text-slate-500">Patient Portal</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center space-x-3 px-3 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left rounded-lg mx-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}