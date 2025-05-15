import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { getUserActivity } from "@/services/userService";
import { useToast } from "@/components/ui/use-toast";

interface UserActivityProps {
    userId: string;
    userName: string;
    onBack: () => void;
}

export default function UserActivity({ userId, userName, onBack }: UserActivityProps) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchActivity();
    }, [userId]);

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const activityData = await getUserActivity(userId);
            setActivities(activityData);
        } catch (error) {
            console.error("Error fetching user activity:", error);
            toast({
                title: "Error loading activity",
                description: "Could not retrieve user activity logs. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to get the appropriate badge variant based on action type
    const getActionBadgeVariant = (action: string): BadgeProps["variant"] => {
        if (action.includes("login")) return "default";
        if (action.includes("create") || action.includes("add")) return "default"; // Using default since success isn't in BadgeProps
        if (action.includes("update") || action.includes("edit")) return "secondary";
        if (action.includes("delete") || action.includes("remove")) return "destructive";
        if (action.includes("failed") || action.includes("error")) return "destructive";
        return "outline";
    };

    // Helper function to format the timestamp
    const formatTimestamp = (timestamp: string) => {
        try {
            return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
        } catch (error) {
            return "Invalid date";
        }
    };

    return (
        <Card>
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="h-8 w-8"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle>Activity Log: {userName}</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchActivity}>
                        Refresh
                    </Button>
                </div>
                <CardDescription>View recent user activity and system events</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Loading activity logs...
                            </p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No activity logs found</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                New activities will appear here when they occur
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[180px]">Date & Time</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.map((activity, index) => (
                                        <TableRow key={activity.id || index}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatTimestamp(activity.timestamp || activity.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getActionBadgeVariant(activity.action)}
                                                    className="whitespace-nowrap"
                                                >
                                                    {activity.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {activity.ipAddress || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {activity.metadata ? (
                                                    <pre className="text-xs p-2 bg-muted rounded overflow-x-auto max-w-[300px]">
                                                        {JSON.stringify(activity.metadata, null, 2)}
                                                    </pre>
                                                ) : (
                                                    <span className="text-muted-foreground">No additional details</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 