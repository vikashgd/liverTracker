"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SessionTimeoutWarningProps {
  warningMinutes?: number;
  onExtendSession?: () => void;
  onSignOut?: () => void;
}

export default function SessionTimeoutWarning({
  warningMinutes = 5,
  onExtendSession,
  onSignOut
}: SessionTimeoutWarningProps) {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      // In a real implementation, you'd get the actual session expiry time
      // For now, we'll simulate it with a 30-minute session
      const sessionDuration = 30 * 60 * 1000; // 30 minutes
      const warningTime = warningMinutes * 60 * 1000; // Warning time in ms
      
      // This is a simplified example - in reality you'd track the actual session time
      const now = Date.now();
      const sessionStart = new Date(session.expires).getTime() - sessionDuration;
      const timeElapsed = now - sessionStart;
      const timeRemaining = sessionDuration - timeElapsed;
      
      if (timeRemaining <= warningTime && timeRemaining > 0) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(timeRemaining / 1000 / 60)); // Convert to minutes
      } else {
        setShowWarning(false);
      }
    };

    const interval = setInterval(checkSessionExpiry, 60000); // Check every minute
    checkSessionExpiry(); // Check immediately

    return () => clearInterval(interval);
  }, [session, warningMinutes]);

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 shadow-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''}.</p>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowWarning(false);
                  if (onExtendSession) onExtendSession();
                }}
                className="text-sm font-medium text-yellow-800 bg-yellow-100 px-3 py-1 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Extend Session
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWarning(false);
                  if (onSignOut) onSignOut();
                }}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
              >
                Sign Out
              </button>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              className="text-yellow-400 hover:text-yellow-500"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}