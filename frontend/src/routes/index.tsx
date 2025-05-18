import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionContext';

// Import widget components
import WidgetListPage from '@/pages/admin/widgets/index';
import CreateWidgetPage from '@/pages/admin/widgets/create';
import EditWidgetPage from '@/pages/admin/widgets/edit';
import EmbedCodeGenerator from '@/components/admin/EmbedCodeGenerator';

// Placeholder component for pages that don't exist yet
const PlaceholderPage = ({ pageName }: { pageName: string }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">{pageName} Page</h1>
        <p className="text-muted-foreground text-center max-w-md">
            This page is a placeholder. The actual component file is not available yet.
        </p>
    </div>
);

// Public pages
const LoginPage = React.lazy(() => import('@/pages/auth/login'));
// Use placeholders for missing pages
const RegisterPage = () => <PlaceholderPage pageName="Register" />;
const ForgotPasswordPage = () => <PlaceholderPage pageName="Forgot Password" />;
const ResetPasswordPage = () => <PlaceholderPage pageName="Reset Password" />;
const ErrorPage = () => <PlaceholderPage pageName="Error" />;

// Main app pages
const DashboardPage = () => <PlaceholderPage pageName="Dashboard" />;
const ProfilePage = () => <PlaceholderPage pageName="Profile" />;
const ChatPage = React.lazy(() => import('@/pages/chat/index'));

// Admin routes
const AdminDashboardPage = () => <PlaceholderPage pageName="Admin Dashboard" />;
const AdminUsersPage = () => <PlaceholderPage pageName="User Management" />;
const AdminUserRolesPage = () => <PlaceholderPage pageName="User Roles Management" />;
const AdminAiProvidersPage = () => <PlaceholderPage pageName="AI Providers Management" />;
const AdminWidgetsTestPage = () => <PlaceholderPage pageName="Widgets Test" />;
const AdminKnowledgeBasePage = () => <PlaceholderPage pageName="Knowledge Base Management" />;
const AdminContextRulesPage = () => <PlaceholderPage pageName="Context Rules Management" />;
const AdminPromptTemplatesPage = () => <PlaceholderPage pageName="Prompt Templates Management" />;
const AdminModerationQueuePage = () => <PlaceholderPage pageName="Moderation Queue Management" />;
const AdminModerationRulesPage = () => <PlaceholderPage pageName="Moderation Rules Management" />;
const AdminModerationLogsPage = () => <PlaceholderPage pageName="Moderation Logs Management" />;
const AdminFollowUpsPage = () => <PlaceholderPage pageName="Follow Ups Management" />;
const AdminResponseFormattingPage = () => <PlaceholderPage pageName="Response Formatting Management" />;
const AdminResponseTemplatesPage = () => <PlaceholderPage pageName="Response Templates Management" />;
const AdminGuestUserPage = () => <PlaceholderPage pageName="Guest User Management" />;
const AdminGuestUserLogsPage = () => <PlaceholderPage pageName="Guest User Logs Management" />;
const AdminAIConfigPage = () => <PlaceholderPage pageName="AI Config Management" />;
const AdminSettingsPage = () => <PlaceholderPage pageName="Admin Settings" />;
const AdminEmbedCodePage = () => <div className="p-6"><EmbedCodeGenerator /></div>;

// Route Guards
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    if (isLoading || permissionsLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Check for admin permissions
    if (!hasPermission('manage_users')) {
        return <Navigate to="/unauthorized" />;
    }

    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <PageLoader />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

                {/* Error pages */}
                <Route path="/error" element={<ErrorPage />} />
                <Route path="/unauthorized" element={<ErrorPage />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
                <Route path="/chat/:id" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

                {/* Admin routes */}
                <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
                <Route path="/admin/users/roles" element={<AdminRoute><AdminUserRolesPage /></AdminRoute>} />
                <Route path="/admin/ai-providers" element={<AdminRoute><AdminAiProvidersPage /></AdminRoute>} />

                {/* Widget management routes */}
                <Route path="/admin/widgets" element={<AdminRoute><WidgetListPage /></AdminRoute>} />
                <Route path="/admin/widgets/create" element={<AdminRoute><CreateWidgetPage /></AdminRoute>} />
                <Route path="/admin/widgets/edit/:id" element={<AdminRoute><EditWidgetPage /></AdminRoute>} />
                <Route path="/admin/embed-code" element={<AdminRoute><AdminEmbedCodePage /></AdminRoute>} />
                <Route path="/admin/widgets/test" element={<AdminRoute><AdminWidgetsTestPage /></AdminRoute>} />

                <Route path="/admin/knowledge-base" element={<AdminRoute><AdminKnowledgeBasePage /></AdminRoute>} />
                <Route path="/admin/context-rules" element={<AdminRoute><AdminContextRulesPage /></AdminRoute>} />
                <Route path="/admin/prompt-templates" element={<AdminRoute><AdminPromptTemplatesPage /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
                <Route path="/admin/moderation-queue" element={<AdminRoute><AdminModerationQueuePage /></AdminRoute>} />
                <Route path="/admin/moderation-rules" element={<AdminRoute><AdminModerationRulesPage /></AdminRoute>} />
                <Route path="/admin/moderation-logs" element={<AdminRoute><AdminModerationLogsPage /></AdminRoute>} />
                <Route path="/admin/follow-ups" element={<AdminRoute><AdminFollowUpsPage /></AdminRoute>} />
                <Route path="/admin/response-formatting" element={<AdminRoute><AdminResponseFormattingPage /></AdminRoute>} />
                <Route path="/admin/response-templates" element={<AdminRoute><AdminResponseTemplatesPage /></AdminRoute>} />
                <Route path="/admin/guest-user" element={<AdminRoute><AdminGuestUserPage /></AdminRoute>} />
                <Route path="/admin/guest-user-logs" element={<AdminRoute><AdminGuestUserLogsPage /></AdminRoute>} />
                <Route path="/admin/ai-config" element={<AdminRoute><AdminAIConfigPage /></AdminRoute>} />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/error" />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes; 