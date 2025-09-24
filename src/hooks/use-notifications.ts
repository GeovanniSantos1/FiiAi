import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
}

// Hook for fetching notifications
export function useNotifications(
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { limit = 10, offset = 0, unreadOnly = false, enabled = true } = options;
  
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', { limit, offset, unreadOnly }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(unreadOnly && { unread: 'true' })
      });
      
      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for unread count only
export function useUnreadNotificationsCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?unread=true&limit=0');
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      const data = await response.json();
      return data.unreadCount;
    },
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook for marking notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar notificação como lida');
      console.error('Error marking notification as read:', error);
    }
  });
}

// Hook for marking all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`${data.updatedCount} notificações marcadas como lidas`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar notificações como lidas');
      console.error('Error marking all notifications as read:', error);
    }
  });
}