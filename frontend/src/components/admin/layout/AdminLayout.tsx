import React, { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import { DashboardHeader } from "../DashboardHeader";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useAdmin } from "@/context/AdminContext";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title = "Dashboard", subtitle = "" }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { activeSection, currentView } = useAdmin();

  // Map sections to titles
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'overview': return 'Dashboard';
      case 'widgets': return 'Widget Management';
      case 'context': return 'Context Rules';
      case 'templates': return 'Prompt Templates';
      case 'knowledge': return 'Knowledge Base';
      case 'embed': return 'Embed Code';
      case 'logs': return 'AI Logs';
      case 'analytics': return 'Analytics';
      case 'settings': return 'System Settings';
      case 'users': return 'User Management';
      case 'aiconfig': return 'AI Configuration';
      default: return title;
    }
  };

  // Map sections to descriptions
  const getSectionDescription = () => {
    switch (activeSection) {
      case 'overview': return 'Overview of your system';
      case 'widgets': return 'Create, configure and manage your chat widgets';
      case 'context': return 'Configure context rules for your AI';
      case 'templates': return 'Manage prompt templates';
      case 'knowledge': return 'Manage your knowledge base';
      case 'embed': return 'Get embed code for your widgets';
      case 'logs': return 'View AI interaction logs';
      case 'analytics': return 'View analytics and statistics';
      case 'settings': return 'Configure system settings';
      case 'users': return 'Manage users and permissions';
      case 'aiconfig': return 'Configure AI providers and models';
      default: return subtitle;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader title={getSectionTitle()} description={getSectionDescription()} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default AdminLayout;
