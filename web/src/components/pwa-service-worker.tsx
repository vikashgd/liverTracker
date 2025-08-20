'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isInstallable: boolean;
  updateAvailable: boolean;
}

export function PWAServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isInstallable: false,
    updateAvailable: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      setStatus(prev => ({ ...prev, isSupported: true }));
      registerServiceWorker();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setStatus(prev => ({ ...prev, isInstallable: true }));
      
      // Show install prompt after a delay (not immediately)
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000); // Show after 10 seconds
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('🎉 PWA: App installed successfully');
      setDeferredPrompt(null);
      setStatus(prev => ({ ...prev, isInstallable: false }));
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('🔧 Service Worker registered:', registration);
      setStatus(prev => ({ ...prev, isRegistered: true }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
        setStatus(prev => ({ ...prev, updateAvailable: true }));
        
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('💬 Message from Service Worker:', event.data);
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted PWA install');
      } else {
        console.log('❌ User dismissed PWA install');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('❌ PWA install error:', error);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show install prompt if recently dismissed
  const recentlyDismissed = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return false;
    
    const dismissedTime = parseInt(dismissed);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    return dismissedTime > oneDayAgo;
  };

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && !recentlyDismissed() && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                📱
              </div>
              <div>
                <h3 className="font-semibold">Install LiverTracker App</h3>
                <p className="text-sm opacity-90">
                  Get the best experience with offline access and notifications
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleInstallApp}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismissInstall}
                className="text-white/80 hover:text-white px-2 py-2"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Development Status Indicator (only in dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-40 bg-black/80 text-white p-3 rounded-lg text-xs max-w-xs">
          <div className="font-medium mb-2">PWA Status</div>
          <div className="space-y-1">
            <div className={`flex items-center space-x-2 ${status.isSupported ? 'text-green-400' : 'text-red-400'}`}>
              <span>{status.isSupported ? '✅' : '❌'}</span>
              <span>Service Worker Support</span>
            </div>
            <div className={`flex items-center space-x-2 ${status.isRegistered ? 'text-green-400' : 'text-yellow-400'}`}>
              <span>{status.isRegistered ? '✅' : '⏳'}</span>
              <span>Service Worker Registered</span>
            </div>
            <div className={`flex items-center space-x-2 ${status.isInstallable ? 'text-green-400' : 'text-gray-400'}`}>
              <span>{status.isInstallable ? '✅' : '➖'}</span>
              <span>App Installable</span>
            </div>
            {status.updateAvailable && (
              <div className="flex items-center space-x-2 text-blue-400">
                <span>🔄</span>
                <span>Update Available</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Hook for PWA functionality
export function usePWA() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(false); // Start as false to prevent hydration mismatch

  useEffect(() => {
    // Check if running as installed PWA
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Initialize after component mounts (client-side only)
    checkStandalone();
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return {
    isStandalone,
    isOnline,
  };
}
