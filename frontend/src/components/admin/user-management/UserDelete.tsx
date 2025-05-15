import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { User } from "@/types";
import { deleteUser } from "@/services/userService";
import { useToast } from "@/components/ui/use-toast";

interface UserDeleteProps {
    user: User;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function UserDelete({
    user,
    onSuccess,
    onCancel
}: UserDeleteProps) {
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDeleteUser = async () => {
        if (confirmText !== user.email) return;

        setIsDeleting(true);
        try {
            const success = await deleteUser(user.id);

            if (success) {
                toast({
                    title: "User deleted",
                    description: `${user.name} has been permanently removed.`,
                    variant: "default",
                    className: "bg-slate-800 text-white font-medium",
                });
                onSuccess();
            } else {
                throw new Error("Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({
                title: "Error deleting user",
                description: error instanceof Error ? error.message : "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto border-destructive/30">
            <CardHeader className="border-b bg-muted/50">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <CardTitle className="flex items-center text-destructive">
                            <Trash2 className="h-5 w-5 mr-2" />
                            Delete User
                        </CardTitle>
                        <CardDescription>
                            This action is permanent and cannot be undone
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="bg-amber-50 text-amber-900 p-4 rounded-md flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                            <p className="font-medium">Warning: Permanent Action</p>
                            <p className="text-sm">
                                Deleting this user will permanently remove their account,
                                activity history, and all associated data from the system.
                            </p>
                            <p className="text-sm font-medium">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <Label>User Information</Label>
                        <div className="bg-muted p-3 rounded-md">
                            <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                                <div className="text-muted-foreground">Name:</div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-muted-foreground">Email:</div>
                                <div className="font-medium">{user.email}</div>
                                <div className="text-muted-foreground">Role:</div>
                                <div className="font-medium capitalize">{user.role}</div>
                                <div className="text-muted-foreground">Status:</div>
                                <div className="font-medium">
                                    {user.isActive ? "Active" : "Inactive"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <Label htmlFor="confirm" className="text-destructive font-medium">
                            Confirm deletion
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            To confirm, please type <span className="font-medium">{user.email}</span> in the box below:
                        </p>
                        <Input
                            id="confirm"
                            placeholder={user.email}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className={`border-muted-foreground/20 ${confirmText && confirmText !== user.email
                                ? "border-destructive"
                                : ""
                                }`}
                        />
                        {confirmText && confirmText !== user.email && (
                            <p className="text-xs text-destructive">
                                Email does not match. Please check and try again.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 flex justify-between gap-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    disabled={confirmText !== user.email || isDeleting}
                    onClick={handleDeleteUser}
                    className="gap-2"
                >
                    {isDeleting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            Deleting...
                        </>
                    ) : (
                        <>
                            <Trash2 className="h-4 w-4" />
                            Delete User
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
} 