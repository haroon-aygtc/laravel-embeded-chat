import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Settings, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import notificationService, { Notification } from "@/services/notificationService";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch of notifications
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // Get notifications
        const fetchedNotifications = await notificationService.fetchNotifications(user.id);
        setNotifications(fetchedNotifications);

        // Get unread count
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        // Add the new notification to the list
        setNotifications((prev) => [newNotification, ...prev]);

        // Update unread count
        if (!newNotification.read) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    );

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const handleNotificationClick = async (notification: Notification) => {
    // If notification has a link, navigate to it
    if (notification.link) {
      navigate(notification.link);
    }

    // Mark notification as read if not already read
    if (!notification.read) {
      const success = await notificationService.markNotificationsAsRead([notification.id]);

      if (success) {
        // Update local state to mark as read
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );

        // Decrement unread count
        setUnreadCount((prev) => prev - 1);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    const success = await notificationService.markAllNotificationsAsRead(user.id);

    if (success) {
      // Update all notifications to be read
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, read: true }))
      );

      // Reset unread count
      setUnreadCount(0);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="border-b bg-white dark:bg-gray-950">
      <div className="flex h-16 items-center px-4 gap-4 sm:gap-8">
        <div className="flex items-center gap-2 font-semibold">
          <span>Admin Dashboard</span>
        </div>
        <div className="relative hidden md:flex flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
          />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative rounded-full"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex flex-col items-start p-4 cursor-pointer",
                        !notification.read && "bg-muted/50"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex w-full justify-between">
                        <span className="font-medium">{notification.title}</span>
                        {!notification.read && (
                          <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-center text-center"
                onClick={() => navigate("/notifications")}
              >
                View all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-none"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.avatar || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback>
                    {user?.name
                      ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.name || "User"}
                <p className="text-xs font-normal text-muted-foreground">
                  {user?.email || ""}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
