import { Suspense, useEffect, useRef } from "react";
import AppRoutes from "@/routes";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import { BrowserRouter } from "react-router-dom";
import { getCsrfToken } from "@/utils/auth";
import logger from "@/utils/logger";

function App(): JSX.Element {
  const csrfInitializedRef = useRef(false);

  useEffect(() => {
    // Fetch CSRF token when app loads - only do this once
    const fetchCSRFToken = async () => {
      // Prevent multiple initialization attempts
      if (csrfInitializedRef.current) {
        logger.info('CSRF token already initialized, skipping');
        return;
      }

      csrfInitializedRef.current = true;

      try {
        logger.info('Fetching CSRF token on app initialization');
        await getCsrfToken();
        logger.info('CSRF token fetched successfully');
      } catch (err) {
        logger.error("Failed to fetch CSRF token:", err);
        // Try again after a short delay, but only once
        setTimeout(() => {
          if (!document.cookie.includes('XSRF-TOKEN')) {
            getCsrfToken().catch(e =>
              logger.error("Second attempt to fetch CSRF token failed:", e)
            );
          } else {
            logger.info('CSRF token exists, no retry needed');
          }
        }, 2000);
      }
    };

    fetchCSRFToken();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AdminProvider>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              }
            >
              <AppRoutes />
            </Suspense>
            <Toaster />
          </AdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
