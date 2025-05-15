import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Edit, UserPlus, Shield } from "lucide-react";
import { User, CreateUserDTO } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { createUser, updateUser } from "@/services/userService";
import { handleApiValidationErrors, mapRoleToApiRole, mapUserProfileToUser } from "./utils";
import { UserFormProps, UserFormValues, userFormSchema } from './types';

export default function UserForm({ mode, onSuccess, onCancel, user }: UserFormProps) {
    const { toast } = useToast();

    // Create a form resolver based on the mode
    const formResolver = zodResolver(
        mode === 'create'
            ? userFormSchema.refine(
                (data) => !!data.password,
                {
                    message: "Password is required for new users",
                    path: ["password"],
                }
            )
            : userFormSchema
    );

    const form = useForm<UserFormValues>({
        resolver: formResolver,
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            role: (user?.role as any) || "user",
            isActive: user?.isActive ?? true,
            password: "",
        },
    });

    const handleSubmit = async (data: UserFormValues) => {
        try {
            if (mode === 'create') {
                const newUser: CreateUserDTO = {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    isActive: data.isActive,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
                    bio: null,
                    updatedAt: new Date().toISOString(),
                    password: data.password
                };

                const createdUser = await createUser(newUser);

                if (createdUser) {
                    toast({
                        title: "User created successfully",
                        description: `${data.name} (${data.role}) has been added to the system.`,
                        variant: "default",
                        className: "bg-green-500 text-white font-medium",
                    });
                    onSuccess();
                } else {
                    throw new Error("Failed to create user");
                }
            } else if (mode === 'edit' && user) {
                const updatedUser = await updateUser(user.id, {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    isActive: data.isActive,
                });

                if (updatedUser) {
                    toast({
                        title: "User updated successfully",
                        description: `${data.name}'s information has been updated.`,
                        variant: "default",
                        className: "bg-green-500 text-white font-medium",
                    });
                    onSuccess();
                } else {
                    throw new Error("Failed to update user");
                }
            }
        } catch (error: any) {
            console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} user:`, error);

            // Use the helper function to handle validation errors
            const errorMessage = handleApiValidationErrors(error, form);

            toast({
                title: `Error ${mode === 'create' ? 'creating' : 'updating'} user`,
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                    {mode === 'create' ? (
                        <>
                            <UserPlus className="h-5 w-5 mr-2 text-primary" />
                            Create New User
                        </>
                    ) : (
                        <>
                            <Edit className="h-5 w-5 mr-2 text-primary" />
                            Edit User: {user?.name}
                        </>
                    )}
                </CardTitle>
                <CardDescription>
                    {mode === 'create'
                        ? "Add a new user to the system. All fields marked with * are required."
                        : "Update user information and permissions. All fields marked with * are required."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Full Name <span className="text-red-500 ml-1">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                {...field}
                                                className={`${form.formState.errors.name ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium text-red-500" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Email Address <span className="text-red-500 ml-1">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="john.doe@example.com"
                                                type="email"
                                                {...field}
                                                className={`${form.formState.errors.email ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium text-red-500" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {mode === 'create' && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Password <span className="text-red-500 ml-1">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="password"
                                                    placeholder="Enter a strong password"
                                                    {...field}
                                                    className={`${form.formState.errors.password ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-xs text-muted-foreground">
                                            At least 8 characters with uppercase, lowercase, and numbers.
                                        </FormDescription>
                                        <FormMessage className="text-xs font-medium text-red-500" />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            User Role <span className="text-red-500 ml-1">*</span>
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={`${form.formState.errors.role ? 'border-red-300 focus-visible:ring-red-500' : ''}`}>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="editor">Editor</SelectItem>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                                <SelectItem value="user">User</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {field.value && (
                                            <div className="flex items-center mt-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs bg-muted"
                                                >
                                                    {field.value === "admin" && (
                                                        <>
                                                            <Shield className="h-3 w-3 mr-1 text-destructive" />
                                                            Full system access and permissions
                                                        </>
                                                    )}
                                                    {field.value === "editor" && "Can create and modify content"}
                                                    {field.value === "viewer" && "Read-only access to content"}
                                                    {field.value === "user" && "Standard user permissions"}
                                                </Badge>
                                            </div>
                                        )}
                                        <FormMessage className="text-xs font-medium text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                User Status
                                            </FormLabel>
                                            <FormDescription>
                                                {field.value
                                                    ? "User can access the system"
                                                    : "User is currently disabled"}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {mode === 'create' ? 'Create User' : 'Update User'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
} 