"use client";

import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification
} from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 border-gray-200',
  NORMAL: 'bg-blue-50 border-blue-200', 
  HIGH: 'bg-orange-50 border-orange-200',
  URGENT: 'bg-red-50 border-red-200'
};

const TYPE_ICONS = {
  ANALYSIS_COMPLETE: '📊',
  CREDIT_LOW: '⚠️',
  CREDIT_DEPLETED: '🚨',
  MARKET_ALERT: '📈',
  SYSTEM_UPDATE: '🔄',
  PORTFOLIO_ALERT: '💼',
  RECOMMENDATION_READY: '💡'
};

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead = useMarkNotificationRead();
  
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ptBR
  });

  return (
    <div 
      className={`p-3 border-l-4 rounded-r-lg transition-all hover:bg-muted/50 ${
        notification.read ? 'opacity-60' : ''
      } ${PRIORITY_COLORS[notification.priority]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">
              {TYPE_ICONS[notification.type as keyof typeof TYPE_ICONS] || '📋'}
            </span>
            <h4 className="font-medium text-sm truncate">
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {timeAgo}
            </span>
            {!notification.read && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAsRead}
                className="h-6 px-2 text-xs"
                disabled={markAsRead.isPending}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { data: notificationsData, isLoading } = useNotifications({
    limit: 10,
    enabled: isOpen
  });
  const markAllAsRead = useMarkAllNotificationsRead();

  const notifications = notificationsData?.notifications || [];
  const hasUnread = Number(unreadCount) > 0;

  const handleMarkAllAsRead = () => {
    if (hasUnread) {
      markAllAsRead.mutate();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px]"
            >
              {Number(unreadCount) > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {hasUnread && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="text-xs h-7"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
          {hasUnread && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} nova{Number(unreadCount) !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-full mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && notificationsData?.hasMore && (
          <div className="p-3 border-t bg-muted/30">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}