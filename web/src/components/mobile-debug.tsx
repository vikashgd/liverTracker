"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function MobileDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isClient, setIsClient] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const info = {
      // Environment Info
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      
      // URL Info
      currentURL: window.location.href,
      origin: window.location.origin,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      
      // NextAuth Info
      authStatus: status,
      hasSession: !!session,
      sessionUser: session?.user?.email,
      
      // Network Info
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      isSecureContext: window.isSecureContext,
      
      // Storage Info
      localStorageAvailable: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      
      // Cookie Info
      cookiesEnabled: (() => {
        try {
          document.cookie = "test=test; SameSite=Lax";
          const result = document.cookie.indexOf("test=test") !== -1;
          document.cookie = "test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          return result;
        } catch {
          return false;
        }
      })(),
      
      // API Endpoint Test
      apiBaseURL: `${window.location.origin}/api`,
      
      // Timestamp
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(info);
  }, [session, status, isClient]);

  // Don't render anything on server side
  if (!isClient) {
    return null;
  }

  // Only show debug info when there are issues
  if (status === 'loading') {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs max-w-xs">
        <div className="text-blue-800 font-medium">Loading auth...</div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Hide debug when everything works
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs max-w-xs max-h-96 overflow-y-auto z-50">
      <div className="text-red-800 font-medium mb-2">🐛 Mobile Debug Info</div>
      
      <div className="space-y-2 text-red-700">
        <div>
          <strong>Auth Status:</strong> {debugInfo.authStatus}
        </div>
        
        <div>
          <strong>URL:</strong> {debugInfo.currentURL}
        </div>
        
        <div>
          <strong>Origin:</strong> {debugInfo.origin}
        </div>
        
        <div>
          <strong>Platform:</strong> {debugInfo.platform}
        </div>
        
        <div>
          <strong>Online:</strong> {debugInfo.onLine ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>Cookies:</strong> {debugInfo.cookiesEnabled ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>Storage:</strong> {debugInfo.localStorageAvailable ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>Secure:</strong> {debugInfo.isSecureContext ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>Connection:</strong> {debugInfo.connectionType}
        </div>
        
        <div className="mt-2 pt-2 border-t border-red-200">
          <strong>API Base:</strong>
          <div className="break-words">{debugInfo.apiBaseURL}</div>
        </div>
        
        <button 
          onClick={async () => {
            try {
              const response = await fetch('/api/auth/session');
              const data = await response.json();
              console.log('Session API Response:', data);
              alert(`Session API: ${response.status} - ${JSON.stringify(data)}`);
            } catch (error) {
              console.error('Session API Error:', error);
              alert(`Session API Error: ${error}`);
            }
          }}
          className="mt-2 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs"
        >
          Test Session API
        </button>
        
        <button 
          onClick={() => {
            const info = JSON.stringify(debugInfo, null, 2);
            console.log('Debug Info:', info);
            navigator.clipboard?.writeText(info);
            alert('Debug info copied to clipboard and console');
          }}
          className="mt-1 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs"
        >
          Copy Debug Info
        </button>
      </div>
    </div>
  );
}
