import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { User } from "@/types";
import { getUsers } from "@/services/userService";
import { Users, UserPlus, UserCog, Activity, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import UserList from "./UserList";
import UserForm from "./UserForm";
import UserActivity from "./UserActivity";
import UserDelete from "./UserDelete";

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>("list");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formOperation, setFormOperation] = useState<"create" | "edit">("create");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const allUsers = await getUsers();
            setUsers(allUsers);
        } catch (error) {
            console.error("Error fetching users:", error);

            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to fetch users. Please check your connection and try again.";

            toast({
                title: "Error loading users",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUserClick = () => {
        setSelectedUser(null);
        setFormOperation("create");
        setActiveTab("form");
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setFormOperation("edit");
        setActiveTab("form");
    };

    const handleFormSuccess = () => {
        fetchUsers();
        setActiveTab("list");
    };

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        setActiveTab("delete");
    };

    const handleViewActivity = (user: User) => {
        setSelectedUser(user);
        setActiveTab("activity");
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-6 shadow-md border">
                <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            User Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage user accounts, roles, and permissions
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search users..."
                                className="pl-9 w-full bg-background/80 backdrop-blur-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Tabs
                        defaultValue="list"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
                        <TabsList variant="pills" className="bg-background/50 backdrop-blur-sm w-full md:w-auto justify-start mb-4">
                            <TabsTrigger value="list" variant="pills" className="flex gap-2 items-center">
                                <Users size={16} />
                                <span>All Users</span>
                                <Badge variant="outline" className="ml-1.5 rounded-full px-2 py-0 bg-background/80 text-xs">
                                    {users.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="form" variant="pills" className="flex gap-2 items-center">
                                {formOperation === "create" ? (
                                    <>
                                        <UserPlus size={16} />
                                        <span>Add User</span>
                                    </>
                                ) : (
                                    <>
                                        <UserCog size={16} />
                                        <span>Edit User</span>
                                    </>
                                )}
                            </TabsTrigger>
                            {selectedUser && (
                                <>
                                    <TabsTrigger value="activity" variant="pills" className="flex gap-2 items-center">
                                        <Activity size={16} />
                                        <span>Activity</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="delete" variant="pills" className="flex gap-2 items-center">
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                    </TabsTrigger>
                                </>
                            )}
                        </TabsList>

                        <TabsContent value="list" className="space-y-4">
                            <UserList
                                users={users.filter(user =>
                                    searchQuery ?
                                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        user.email.toLowerCase().includes(searchQuery.toLowerCase())
                                        : true
                                )}
                                loading={loading}
                                onCreateUser={handleCreateUserClick}
                                onEditUser={handleEditUser}
                                onDeleteUser={handleDeleteUser}
                                onViewActivity={handleViewActivity}
                            />
                        </TabsContent>

                        <TabsContent value="form">
                            <div className="p-6 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm border">
                                <UserForm
                                    mode={formOperation}
                                    user={selectedUser}
                                    onSuccess={handleFormSuccess}
                                    onCancel={() => setActiveTab("list")}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="activity">
                            {selectedUser && (
                                <div className="p-6 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm border">
                                    <UserActivity
                                        userId={selectedUser.id}
                                        userName={selectedUser.name}
                                        onBack={() => setActiveTab("list")}
                                    />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="delete">
                            {selectedUser && (
                                <div className="p-6 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm border">
                                    <UserDelete
                                        user={selectedUser}
                                        onSuccess={() => {
                                            fetchUsers();
                                            setActiveTab("list");
                                        }}
                                        onCancel={() => setActiveTab("list")}
                                    />
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
} 