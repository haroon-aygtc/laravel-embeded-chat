import React, { lazy, Suspense } from "react";
import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import Home from "@/components/home";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";
import ChatPage from "@/pages/chat";
import ChatEmbedPage from "@/pages/chat-embed";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import WebSocketTester from "@/components/websocket-demo/WebSocketTester";
import WebSocketTestPage from "@/pages/websocket-test";
import WebSocketTesterPage from "@/pages/websocket-tester";

// Lazy-loaded admin components
const Dashboard = lazy(() => import("@/pages/admin/dashboard"));
const ApiKeysPage = lazy(() => import("@/pages/admin/api-keys"));
const ScrapingPage = lazy(() => import("@/pages/admin/scraping"));
const ModerationQueue = lazy(
  () => import("@/components/admin/ModerationQueue"),
);
const ModerationRules = lazy(
  () => import("@/components/admin/ModerationRules"),
);
const UserManagement = lazy(() => import("@/components/admin/user-management"));
const ContextRulesEditor = lazy(
  () => import("@/components/admin/ContextRulesEditor"),
);
const PromptTemplates = lazy(
  () => import("@/components/admin/PromptTemplates"),
);
const EmbedCodeGenerator = lazy(
  () => import("@/components/admin/EmbedCodeGenerator"),
);
const SystemSettings = lazy(() => import("@/components/admin/SystemSettings"));

// Lazy-loaded user components
const ProfilePage = lazy(() => import("@/pages/user/profile"));

// Lazy-loaded tutorial components
const TutorialIntroduction = lazy(
  () => import("@/components/tutorial/TutorialIntroduction"),
);
const SetupGuide = lazy(() => import("@/components/tutorial/SetupGuide"));
const AdminDashboardTutorial = lazy(
  () => import("@/components/tutorial/AdminDashboardTutorial"),
);
const EmbeddingTutorial = lazy(
  () => import("@/components/tutorial/EmbeddingTutorial"),
);
const WebSocketClientDemo = lazy(
  () => import("@/components/tutorial/WebSocketClientDemo"),
);
const VideoTutorials = lazy(
  () => import("@/components/tutorial/VideoTutorials"),
);
const AnimationDemo = lazy(
  () => import("@/components/tutorial/AnimationDemo"),
);

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/reset-password/:resetToken"
        element={<ResetPasswordPage />}
      />

      {/* Chat routes */}
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat-embed" element={<ChatEmbedPage />} />

      {/* WebSocket test routes */}
      <Route path="/websocket-test" element={<WebSocketTestPage />} />
      <Route path="/websocket-tester" element={<WebSocketTesterPage />} />

      {/* User routes */}
      <Route
        path="/user/profile"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Admin routes with shared layout */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <Outlet />
            </AdminLayout>
          </AdminRoute>
        }
      >
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <UserManagement />
            </Suspense>
          }
        />
        <Route
          path="context-rules"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ContextRulesEditor />
            </Suspense>
          }
        />
        <Route
          path="templates"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PromptTemplates />
            </Suspense>
          }
        />
        <Route
          path="embed-code"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <EmbedCodeGenerator />
            </Suspense>
          }
        />
        <Route
          path="api-keys"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ApiKeysPage />
            </Suspense>
          }
        />
        <Route
          path="scraping"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ScrapingPage />
            </Suspense>
          }
        />
        <Route
          path="moderation/queue"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ModerationQueue />
            </Suspense>
          }
        />
        <Route
          path="moderation/rules"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ModerationRules />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SystemSettings />
            </Suspense>
          }
        />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Tutorial routes */}
      <Route path="/tutorial" element={<TutorialIntroduction />} />
      <Route path="/tutorial/setup" element={<SetupGuide />} />
      <Route path="/tutorial/admin-dashboard" element={<AdminDashboardTutorial />} />
      <Route path="/tutorial/embedding" element={<EmbeddingTutorial />} />
      <Route path="/tutorial/websocket" element={<WebSocketClientDemo />} />
      <Route
        path="/tutorial/videos"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <VideoTutorials />
          </Suspense>
        }
      />
      <Route
        path="/tutorial/animations"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <AnimationDemo />
          </Suspense>
        }
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;