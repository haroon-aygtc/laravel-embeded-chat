import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ui/error-boundary";

// Context Providers
import { AuthProvider } from '@/context/AuthContext';
import { AdminProvider } from '@/context/AdminContext';
import { PermissionProvider } from '@/context/PermissionContext';

// Routes
import AppRoutes from '@/routes';

// This component handles scrolling to top on route changes
const RouteChangeHandler = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <PermissionProvider>
            <AdminProvider>
              <RouteChangeHandler />
              <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
                <AppRoutes />
                <Toaster />
              </Suspense>
            </AdminProvider>
          </PermissionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
