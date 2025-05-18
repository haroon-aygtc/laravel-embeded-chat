import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/authService";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const authService = AuthService.getInstance();

  // Check authentication and admin role on route change
  useEffect(() => {
    const checkAuthAndRole = async () => {
      setIsCheckingAuth(true);

      // First check if we have a token in localStorage or cookies
      const hasToken = !!authService.getToken();

      // If we have a token but not authenticated or no user, try to refresh the user
      if (hasToken && (!isAuthenticated || !user)) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user profile:', error);
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuthAndRole();
  }, [location.pathname, isAuthenticated, user, refreshUser]);

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

  // If not admin, redirect to unauthorized
  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and admin, render children
  return <>{children}</>;
};

export default AdminRoute;
