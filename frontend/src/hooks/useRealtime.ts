import { useState, useEffect } from "react";
import notificationService, { Notification } from "@/services/notificationService";

/**
 * This hook provides a way to subscribe to real-time notifications
 * for the current user
 */
export function useNotifications(userId: string | undefined, enabled = true) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId || !enabled) return;

    let unsubscribe: (() => void) | null = null;

    const loadInitialData = async () => {
      try {
        // Load notifications
        const fetchedNotifications = await notificationService.fetchNotifications(userId);
        setNotifications(fetchedNotifications);

        // Load unread count
        const count = await notificationService.getUnreadCount(userId);
        setUnreadCount(count);

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Subscribe to new notifications
    unsubscribe = notificationService.subscribeToNotifications(userId, (notification) => {
      setNotifications((prev) => {
        // Avoid duplicate notifications
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });

      if (!notification.read) {
        setUnreadCount((count) => count + 1);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, enabled]);

  // Function to mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const success = await notificationService.markNotificationsAsRead([notificationId]);

      if (success) {
        // Update notification in the list
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return false;

    try {
      const success = await notificationService.markAllNotificationsAsRead(userId);

      if (success) {
        // Update all notifications to be read
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        // Reset unread count
        setUnreadCount(0);
      }

      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    error,
    isLoading,
    markAsRead,
    markAllAsRead
  };
}

// NOTE: The following hooks need to be reimplemented with a proper WebSocket solution
// as they rely on the broader real-time functionalities of the previous realtimeService.
// For now, they are left as placeholders with appropriate error messages.

/**
 * @deprecated Use a proper WebSocket solution for real-time table changes
 */
export function useRealtime<T = any>(
  tableName: string,
  events: string[] = ["INSERT", "UPDATE", "DELETE"],
  filter?: string,
  enabled = true,
) {
  const [error, setError] = useState<Error | null>(
    new Error("This hook has been deprecated. Please use a proper WebSocket solution.")
  );

  return {
    data: null as T | null,
    payload: null,
    error,
    isLoading: false
  };
}

/**
 * @deprecated Use a proper WebSocket solution for chat messages
 */
export function useChatMessages(sessionId: string, enabled = true) {
  const [error, setError] = useState<Error | null>(
    new Error("This hook has been deprecated. Please use a proper WebSocket solution for chat messages.")
  );

  return {
    messages: [],
    error,
    isLoading: false
  };
}

/**
 * @deprecated Use a proper WebSocket solution for chat sessions
 */
export function useChatSession(sessionId: string, enabled = true) {
  const [error, setError] = useState<Error | null>(
    new Error("This hook has been deprecated. Please use a proper WebSocket solution for chat sessions.")
  );

  return {
    session: null,
    error,
    isLoading: false
  };
}

/**
 * @deprecated Use a proper WebSocket solution for widget configs
 */
export function useWidgetConfigs(userId: string, enabled = true) {
  const [error, setError] = useState<Error | null>(
    new Error("This hook has been deprecated. Please use a proper WebSocket solution for widget configs.")
  );

  return {
    configs: [],
    error,
    isLoading: false
  };
}
