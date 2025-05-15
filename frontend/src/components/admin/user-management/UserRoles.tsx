import React, { useState, useEffect } from 'react';
import { roleApi, Role } from '@/services/api/features/roleManagement';
import { userApi } from '@/services/api/features/user';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, Users as UsersIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/context/PermissionContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    lastLogin?: string;
}

export function UserRoles() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState<Record<string, boolean>>({});
    const { refreshPermissions } = usePermissions();

    // Load users and roles data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const [usersResponse, rolesResponse] = await Promise.all([
                    userApi.getUsers(),
                    roleApi.getRoles()
                ]);

                if (usersResponse.success && usersResponse.data) {
                    setUsers(usersResponse.data.users);
                }

                if (rolesResponse.success && rolesResponse.data) {
                    setRoles(rolesResponse.data);
                }
            } catch (error) {
                console.error('Error loading user roles data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load users or roles.',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Filter users based on search query
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate role statistics
    const roleStats = users.reduce((stats, user) => {
        stats[user.role] = (stats[user.role] || 0) + 1;
        return stats;
    }, {} as Record<string, number>);

    // Update a user's role
    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            setUpdating(prev => ({ ...prev, [userId]: true }));

            const response = await roleApi.updateUserRole(userId, newRole as any);

            if (response.success) {
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                ));

                toast({
                    title: 'Role Updated',
                    description: `User role successfully changed to ${newRole}.`,
                });

                // Refresh permissions if the user updated their own role
                await refreshPermissions();
            } else {
                toast({
                    title: 'Update Failed',
                    description: response.error?.message || 'Failed to update user role.',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred while updating the role.',
                variant: 'destructive'
            });
        } finally {
            setUpdating(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Get role badge color based on role
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

    return (
        <PermissionGate permissions="manage_users">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>User Role Management</CardTitle>
                    <CardDescription>
                        Manage user roles and permissions in the system.
                        Changes take effect immediately.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Role Statistics */}
                    {!loading && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card className="bg-muted/40">
                                <CardContent className="pt-6">
                                    <div className="flex items-center">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mr-3">
                                            <UsersIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Total Users</p>
                                            <p className="text-2xl font-bold">{users.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            {roles.slice(0, 3).map(role => (
                                <Card key={role.id} className="bg-muted/40">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mr-3">
                                                <Badge variant={getRoleBadgeVariant(role.id)}>
                                                    {role.id.charAt(0).toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{role.name}</p>
                                                <p className="text-2xl font-bold">{roleStats[role.id] || 0}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search users by name, email or role..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Current Role</TableHead>
                                        <TableHead>Change Role</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                No users found matching the search criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getRoleBadgeVariant(user.role)}>
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            value={user.role}
                                                            onValueChange={(value) => handleRoleChange(user.id, value)}
                                                            disabled={updating[user.id]}
                                                        >
                                                            <SelectTrigger className="w-[140px]">
                                                                <SelectValue placeholder="Select role" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {roles.map(role => (
                                                                    <SelectItem
                                                                        key={role.id}
                                                                        value={role.id}
                                                                    >
                                                                        {role.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {updating[user.id] && (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </PermissionGate>
    );
} 