import { User } from "@/types";
import { z } from "zod";

// Define user form schema
export const userFormSchema = z.object({
    name: z.string()
        .min(2, { message: "Name must be at least 2 characters" })
        .max(100, { message: "Name must be less than 100 characters" }),
    email: z.string()
        .email({ message: "Please enter a valid email address" })
        .min(5, { message: "Email must be at least 5 characters" }),
    role: z.enum(["admin", "editor", "viewer", "user"], {
        message: "Please select a valid role"
    }),
    isActive: z.boolean().default(true),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .optional()
        .or(z.literal(''))
}).refine((data) => {
    // Password is required only for create operation
    // We'll check this in the component based on the mode
    return true;
}, {
    message: "Password is required",
    path: ["password"]
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export interface UserActivityItem {
    id: string;
    userId: string;
    action: string;
    timestamp?: string;
    createdAt: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

export interface UserFormProps {
    mode: 'create' | 'edit';
    onSuccess: () => void;
    onCancel: () => void;
    user?: User | null;
}

export interface UserListProps {
    users: User[];
    loading: boolean;
    onCreateUser: () => void;
    onEditUser: (user: User) => void;
    onDeleteUser: (user: User) => void;
    onViewActivity: (user: User) => void;
}

export interface UserActivityProps {
    userId: string;
    userName: string;
    onBack: () => void;
}

export interface UserDeleteProps {
    user: User;
    onSuccess: () => void;
    onCancel: () => void;
} 