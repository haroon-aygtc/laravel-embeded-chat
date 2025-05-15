import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { UserRoles } from '@/components/admin/user-management/UserRoles';
import { UserPermissions } from '@/components/admin/user-management/UserPermissions';
import { PageTitle } from '@/components/ui/page-title';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UserRoleManagementPage() {
    return (
        <AdminLayout>
            <PermissionGate permissions="manage_users" fallback={
                <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                    <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                    <p className="text-muted-foreground">
                        You don't have permission to access the role management page.
                    </p>
                </div>
            }>
                <div className="space-y-6">
                    <PageTitle
                        title="User Role Management"
                        description="Manage user roles and view your own permissions"
                    />

                    <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Role-Based Access Control</AlertTitle>
                        <AlertDescription>
                            This system includes four roles: Admin, Editor, Viewer, and User. Each role has specific permissions
                            that determine what actions users can perform. Admins have access to everything, while other roles
                            have limited permissions.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-6">
                        <UserRoles />
                        <UserPermissions />
                    </div>
                </div>
            </PermissionGate>
        </AdminLayout>
    );
} 