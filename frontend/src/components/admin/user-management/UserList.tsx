import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    MoreHorizontal,
    UserPlus,
    Shield,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import type { User } from "@/types";
import { getRoleBadgeVariant } from "./utils";

interface UserListProps {
    users: User[];
    loading: boolean;
    onCreateUser: () => void;
    onEditUser: (user: User) => void;
    onDeleteUser: (user: User) => void;
    onViewActivity: (user: User) => void;
}

export default function UserList({
    users,
    loading,
    onCreateUser,
    onEditUser,
    onDeleteUser,
    onViewActivity,
}: UserListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Filter users based on search term and filters
    const filteredUsers = users.filter((user) => {
        // Apply search filter
        if (
            searchTerm &&
            !user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
            return false;
        }

        // Apply role filter
        if (roleFilter && user.role !== roleFilter) {
            return false;
        }

        // Apply status filter
        if (statusFilter) {
            const isActive = statusFilter === "active";
            if (user.isActive !== isActive) {
                return false;
            }
        }

        return true;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = filteredUsers.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    return (
        <Card>
            <CardHeader className="space-y-1">
                <div className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0">
                    <div>
                        <CardTitle className="text-2xl font-bold">Users</CardTitle>
                        <CardDescription>
                            Manage user accounts and permissions
                        </CardDescription>
                    </div>
                    <Button onClick={onCreateUser} className="md:self-end">
                        <UserPlus className="w-4 h-4 mr-2" />
                        New User
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search users..."
                                className="pl-8 w-full"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1); // Reset to first page on search
                                }}
                            />
                        </div>
                        <Select
                            value={roleFilter || "all"}
                            onValueChange={(value) => {
                                setRoleFilter(value === "all" ? null : value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="All roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={statusFilter || "all"}
                            onValueChange={(value) => {
                                setStatusFilter(value === "all" ? null : value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">User</TableHead>
                                    <TableHead className="w-[100px]">Role</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[150px]">Last Active</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    Loading users...
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10">
                                            <div className="flex flex-col items-center justify-center">
                                                <UserPlus className="h-8 w-8 text-muted-foreground mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    No users found
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={onCreateUser}
                                                >
                                                    Add your first user
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center space-x-3">
                                                    <Avatar>
                                                        <AvatarImage
                                                            src={user.avatar || undefined}
                                                            alt={user.name}
                                                        />
                                                        <AvatarFallback className="uppercase">
                                                            {user.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                                                    {user.role === "admin" && (
                                                        <Shield className="h-3.5 w-3.5 mr-1 inline" />
                                                    )}
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.isActive ? "default" : "secondary"}
                                                    className={
                                                        user.isActive
                                                            ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800"
                                                            : "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800"
                                                    }
                                                >
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center text-sm text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5 mr-1 shrink-0" />
                                                    {user.lastLogin
                                                        ? format(new Date(user.lastLogin), "MMM d, yyyy")
                                                        : "Never"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => onEditUser(user)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => onViewActivity(user)}>
                                                            <Clock className="mr-2 h-4 w-4" />
                                                            View Activity
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onSelect={() => onDeleteUser(user)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {filteredUsers.length > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {(page - 1) * pageSize + 1} to{" "}
                                {Math.min(page * pageSize, filteredUsers.length)} of{" "}
                                {filteredUsers.length} users
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 