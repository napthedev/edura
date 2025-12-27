"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, AlertCircle, DollarSign, Info } from "lucide-react";

interface NotificationItemProps {
  notification: {
    notificationId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean | null;
    linkUrl: string | null;
    createdAt: string | Date;
  };
  onClose?: () => void;
}

export function NotificationItem({
  notification,
  onClose,
}: NotificationItemProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const markReadMutation = useMutation({
    mutationFn: (input: { notificationId: string }) =>
      trpcClient.notification.markRead.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });

  const handleClick = () => {
    if (!notification.isRead) {
      markReadMutation.mutate({ notificationId: notification.notificationId });
    }

    if (notification.linkUrl) {
      router.push(notification.linkUrl as any);
      if (onClose) onClose();
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "grade":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-yellow-500" />;
      case "system":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex cursor-pointer items-start gap-3 border-b p-4 transition-colors hover:bg-slate-50",
        !notification.isRead && "bg-primary/10/50"
      )}
    >
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1 space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            !notification.isRead && "font-semibold"
          )}
        >
          {notification.title}
        </p>
        <p className="text-sm text-slate-500 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="h-2 w-2 rounded-full bg-primary/100 mt-2" />
      )}
    </div>
  );
}
