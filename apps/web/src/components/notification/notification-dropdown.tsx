"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./notification-item";
import { useTranslations } from "next-intl";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations("Notifications");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => trpcClient.notification.get.query(),
    enabled: open,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => trpcClient.notification.getUnreadCount.query(),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => trpcClient.notification.markAllRead.mutate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h4 className="font-semibold">{t("title")}</h4>
          {unreadCount && unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-blue-500 hover:text-primary hover:bg-transparent"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {t("markAllAsRead")}
            </Button>
          ) : null}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {t("loading")}
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {t("noNotifications")}
            </div>
          ) : (
            notifications?.map((notification) => (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                onClose={() => setOpen(false)}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
