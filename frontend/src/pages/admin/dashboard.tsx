import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  Code,
  BarChart3,
  FileText,
  Database,
  BookOpen,
  History,
  Cpu,
  User,
} from "lucide-react";

import WidgetConfigurator from "@/components/admin/WidgetConfigurator";
import ContextRulesEditor from "@/components/admin/ContextRulesEditor";
import PromptTemplates from "@/components/admin/PromptTemplates";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import EmbedCodeGenerator from "@/components/admin/EmbedCodeGenerator";
import KnowledgeBaseManager from "@/components/admin/KnowledgeBaseManager";
import AIInteractionLogs from "@/components/admin/AIInteractionLogs";
import SystemSettings from "@/components/admin/SystemSettings";
import UserManagement from "@/components/admin/user-management";
import AIConfiguration from "@/components/admin/AIConfiguration";
import { useAdmin } from "@/context/AdminContext";
import { useNavigate, useLocation } from "react-router-dom";

const Dashboard = () => {
  const { activeSection, setActiveSection } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync with URL if needed
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'dashboard') {
      setActiveSection('overview');
    }
  }, [location.pathname, setActiveSection]);

  return (
    <div className="w-full">
      <Tabs
        value={activeSection}
        onValueChange={setActiveSection}
        className="w-full"
      >
        <TabsList className="flex flex-wrap mb-6 gap-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="widget" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Widget Config</span>
          </TabsTrigger>
          <TabsTrigger value="context" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Context Rules</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Knowledge Base</span>
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span>Embed Code</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>AI Logs</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="aiconfig" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>AI Config</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,248</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">324</div>
                <p className="text-xs text-muted-foreground">
                  +7% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Response Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">96.3%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-muted-foreground">
                  -0.1s from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  className="h-24 flex flex-col items-center justify-center gap-2 border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setActiveSection("widget")}
                >
                  <Settings className="h-6 w-6" />
                  <span>Configure Widget</span>
                </button>
                <button
                  className="h-24 flex flex-col items-center justify-center gap-2 border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setActiveSection("context")}
                >
                  <MessageSquare className="h-6 w-6" />
                  <span>Edit Context Rules</span>
                </button>
                <button
                  className="h-24 flex flex-col items-center justify-center gap-2 border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setActiveSection("embed")}
                >
                  <Code className="h-6 w-6" />
                  <span>Get Embed Code</span>
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Status</span>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gemini API</span>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Hugging Face API</span>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database</span>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="widget">
          <WidgetConfigurator />
        </TabsContent>

        <TabsContent value="context">
          <ContextRulesEditor />
        </TabsContent>

        <TabsContent value="templates">
          <PromptTemplates />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeBaseManager />
        </TabsContent>

        <TabsContent value="embed">
          <EmbedCodeGenerator />
        </TabsContent>

        <TabsContent value="logs">
          <AIInteractionLogs />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="aiconfig">
          <AIConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
