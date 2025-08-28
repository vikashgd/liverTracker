"use client";

import React, { ReactNode } from 'react';
import { ClientOnly } from '@/lib/hydration-safe';

interface HydrationSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * A wrapper component that ensures its children are only rendered on the client
 * to prevent hydration mismatches
 */
export function HydrationSafeWrapper({ 
  children, 
  fallback = null, 
  className 
}: HydrationSafeWrapperProps) {
  return (
    <div className={className}>
      <ClientOnly fallback={fallback}>
        {children}
      </ClientOnly>
    </div>
  );
}

/**
 * Higher-order component to make any component hydration-safe
 */
export function withHydrationSafety<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function HydrationSafeComponent(props: P) {
    return (
      <ClientOnly fallback={fallback}>
        <Component {...props} />
      </ClientOnly>
    );
  };
}

/**
 * Hook to conditionally render content only on the client
 */
export function useClientOnlyRender<T>(
  clientContent: T,
  serverContent?: T
): T | undefined {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? clientContent : serverContent;
}