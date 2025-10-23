'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Fetch user session to check if logged in
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.isLoggedIn === 'boolean') {
          setIsLoggedIn(data.isLoggedIn);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch session:', err);
        // Default to logged in on error
        setIsLoggedIn(true);
      });
  }, []);

  useEffect(() => {
    // Check if in development mode
    const isDev = process.env.NEXTJS_ENV === 'development' || process.env.NODE_ENV === 'development';

    // Always allow in dev, otherwise check auth
    if (!isDev && !isLoggedIn) {
      // Redirect to login
      window.location.href = '/api/auth/login';
      return;
    }

    // Wait for Pylon to load and then open it
    const checkPylon = setInterval(() => {
      if (typeof window.Pylon === 'function') {
        clearInterval(checkPylon);
        try {
          window.Pylon('show');
          // Redirect back to previous page or home
          router.back();
        } catch (error) {
          console.error('Error opening Pylon:', error);
          router.push('/');
        }
      }
    }, 100);

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkPylon);
      console.error('Pylon failed to load');
      router.push('/');
    }, 5000);

    return () => {
      clearInterval(checkPylon);
      clearTimeout(timeout);
    };
  }, [router, isLoggedIn]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Opening support chat...</p>
      </div>
    </div>
  );
}
