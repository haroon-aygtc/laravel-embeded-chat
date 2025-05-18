import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const authService = AuthService.getInstance();

  // Check authentication on route change
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);

      // First check if we have a token in localStorage or cookies
      const hasToken = !!authService.getToken();

      // If we have a token but not authenticated, try to refresh the user
      if (hasToken && !isAuthenticated) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user profile:', error);
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [location.pathname, isAuthenticated, refreshUser]);

  // Show loading screen while checking authentication
  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Store the current location so we can redirect back after login
    const currentPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem('redirectAfterLogin', currentPath);

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
