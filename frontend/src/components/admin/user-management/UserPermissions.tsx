import React from 'react';
import { usePermissions } from '@/context/PermissionContext';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function UserPermissions() {
    const { permissions, role, isAdmin, loading } = usePermissions();

    // Group permissions by their prefix
    const groupedPermissions = Object.entries(permissions).reduce(
        (acc, [key, value]) => {
            const group = key.split('_')[0];
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push({ key, value });
            return acc;
        },
        {} as Record<string, { key: string; value: boolean }[]>
    );

    // Get a human-readable name for a permission
    const getPermissionName = (permission: string) => {
        return permission
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Get a human-readable name for a permission group
    const getGroupName = (group: string) => {
        switch (group) {
            case 'view':
                return 'Viewing Permissions';
            case 'create':
                return 'Creation Permissions';
            case 'edit':
                return 'Editing Permissions';
            case 'delete':
                return 'Deletion Permissions';
            case 'manage':
                return 'Management Permissions';
            default:
                return group.charAt(0).toUpperCase() + group.slice(1) + ' Permissions';
        }
    };

    // Determine badge variant based on role
    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'admin':
                return 'default';
            case 'editor':
                return 'secondary';
            case 'viewer':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-5 w-40" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3, 4, 5, 6].map(j => (
                                        <Skeleton key={j} className="h-10 w-full" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Your Permissions</CardTitle>
                    <Badge variant={getRoleBadgeVariant(role)} className="text-sm">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                </div>
                <CardDescription>
                    {isAdmin
                        ? 'As an administrator, you have full access to all system features.'
                        : `Your current role (${role}) grants you the following permissions:`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isAdmin ? (
                    <div className="p-4 bg-muted rounded-md flex items-center space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>You have unlimited access to all system features and settings.</span>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {Object.entries(groupedPermissions).map(([group, perms]) => (
                            <div key={group} className="space-y-4">
                                <h3 className="text-md font-semibold">{getGroupName(group)}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {perms.map(({ key, value }) => (
                                        <div
                                            key={key}
                                            className={`flex items-center space-x-2 p-2 rounded-md ${value ? 'bg-primary/10' : 'bg-muted'
                                                }`}
                                        >
                                            {value ? (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className={value ? 'font-medium' : 'text-muted-foreground'}>
                                                {getPermissionName(key)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 