"use client";

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function useSessionDebug() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🔍 Session Debug:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
      sessionObject: session
    });
  }, [session, status]);

  return { session, status };
}

export function SessionDebugComponent() {
  const { session, status } = useSessionDebug();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">Session Debug</div>
      <div>Status: {status}</div>
      <div>Has Session: {!!session ? 'Yes' : 'No'}</div>
      <div>User ID: {(session?.user as any)?.id || 'None'}</div>
      <div>Email: {session?.user?.email || 'None'}</div>
    </div>
  );
}