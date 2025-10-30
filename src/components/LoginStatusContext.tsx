'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

// Context for sharing login status across components
const LoginStatusContext = createContext<{
  isLoggedIn: boolean | null;
  isLoading: boolean;
}>({
  isLoggedIn: null,
  isLoading: true,
});

// Provider component that checks login status once
export function LoginStatusProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session', { 
          credentials: 'include' 
        });
        
        if (response && response.ok) {
          try {
            const session = await response.json();
            setIsLoggedIn(!!(session && session.isLoggedIn));
          } catch (_e) {
            console.error('Failed to parse session data', _e);
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (_err) {
        // On error, assume not logged in
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  return (
    <LoginStatusContext.Provider value={{ isLoggedIn, isLoading }}>
      {children}
    </LoginStatusContext.Provider>
  );
}

// Hook to use login status context
function useLoginStatus() {
  return useContext(LoginStatusContext);
}

// Loading component
function LoadingState() {
  return (
    <p className="flex items-center gap-2 text-fd-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      Loading...
    </p>
  );
}

// Helper components for MDX children syntax - these handle their own conditional rendering
export function LoggedIn({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useLoginStatus();
  
  if (isLoading || !isLoggedIn) {
    return null;
  }
  
  return <>{children}</>;
}
LoggedIn.displayName = 'LoggedIn';

export function LoggedOut({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useLoginStatus();
  
  if (isLoading || isLoggedIn) {
    return null;
  }
  
  return <>{children}</>;
}
LoggedOut.displayName = 'LoggedOut';

// General-purpose component that conditionally renders content based on auth status
interface BasedOnAuthProps {
  loggedIn?: React.ReactNode;
  loggedOut?: React.ReactNode;
  children?: React.ReactNode; // For MDX children syntax
}

export function BasedOnAuth({ loggedIn, loggedOut, children }: BasedOnAuthProps) {
  const { isLoading } = useLoginStatus();

  // Show loading state while checking
  if (isLoading) {
    return <LoadingState />;
  }

  // If children are provided, render them (LoggedIn/LoggedOut will handle their own conditional rendering)
  if (children) {
    return <>{children}</>;
  }

  // Fall back to props-based approach
  const { isLoggedIn } = useLoginStatus();
  return <>{isLoggedIn ? loggedIn : loggedOut}</>;
}

// Component for logged-in users (for use with children syntax)
export function WhenLoggedIn({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useLoginStatus();
  
  if (isLoading || !isLoggedIn) {
    return null;
  }
  
  return <>{children}</>;
}

// Component for logged-out users (for use with children syntax)
export function WhenLoggedOut({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useLoginStatus();
  
  if (isLoading || isLoggedIn) {
    return null;
  }
  
  return <>{children}</>;
}
