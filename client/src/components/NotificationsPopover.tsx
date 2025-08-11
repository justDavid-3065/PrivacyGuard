
import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Z_INDEX } from '@/lib/zIndex';

export function NotificationsPopover() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-5 w-5" />
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-gray-300 rounded-full animate-pulse" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end" 
        style={{ zIndex: Z_INDEX.DROPDOWN }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-8 px-2"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50 dark:bg-blue-950/20"
                    )}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      notification.type === 'error' && "bg-red-500",
                      notification.type === 'warning' && "bg-yellow-500",
                      notification.type === 'success' && "bg-green-500",
                      notification.type === 'info' && "bg-blue-500",
                      notification.read && "bg-gray-300"
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
