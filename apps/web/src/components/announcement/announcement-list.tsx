"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Megaphone, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import EditAnnouncementForm from "./edit-announcement-form";
import { useTranslations } from "next-intl";
import { RichTextDisplay } from "@/components/assignment/rich-text-editor";

interface Announcement {
  announcement: {
    announcementId: string;
    title: string;
    content: string | null;
    attachedImage: string | null;
    createdAt: string;
  };
  creator: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface AnnouncementListProps {
  classId: string;
  isTeacher?: boolean;
}

export default function AnnouncementList({
  classId,
  isTeacher = false,
}: AnnouncementListProps) {
  const t = useTranslations("AnnouncementList");
  const queryClient = useQueryClient();
  const [editingAnnouncement, setEditingAnnouncement] = useState<{
    id: string;
    title: string;
    content: string | null;
    attachedImage: string | null;
  } | null>(null);

  const {
    data: announcements,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["class-announcements", classId],
    queryFn: () =>
      trpcClient.education.getClassAnnouncements.query({ classId }),
  });

  const deleteMutation = useMutation({
    mutationFn: (announcementId: string) =>
      trpcClient.education.deleteAnnouncement.mutate({ announcementId }),
    onSuccess: () => {
      toast.success(t("announcementDeleted"));
      queryClient.invalidateQueries({
        queryKey: ["class-announcements", classId],
      });
    },
    onError: (error) => {
      toast.error(`${t("failedToDeleteAnnouncement")}: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>{t("failedToLoadAnnouncements")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>{t("noAnnouncementsYet")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {announcements.map(({ announcement, creator }: Announcement) => (
        <Card
          key={announcement.announcementId}
          className="overflow-hidden h-fit"
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={creator.image || undefined}
                  alt={creator.name}
                />
                <AvatarFallback>
                  {creator.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-lg">
                    {announcement.title}
                  </h3>
                  {isTeacher && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingAnnouncement({
                            id: announcement.announcementId,
                            title: announcement.title,
                            content: announcement.content,
                            attachedImage: announcement.attachedImage,
                          })
                        }
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("deleteAnnouncement")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("deleteAnnouncementDescription")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMutation.mutate(
                                  announcement.announcementId
                                )
                              }
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              {deleteMutation.isPending
                                ? t("deleting")
                                : t("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs mb-2">
                  {formatDistanceToNow(new Date(announcement.createdAt), {
                    addSuffix: true,
                  })}
                </Badge>

                <p className="text-sm text-muted-foreground mb-3">
                  {t("postedBy")} {creator.name}
                </p>

                {announcement.content && (
                  <div className="mb-4">
                    <RichTextDisplay content={announcement.content} />
                  </div>
                )}

                {announcement.attachedImage && (
                  <div className="mt-4">
                    <img
                      src={announcement.attachedImage}
                      alt="Announcement attachment"
                      className="w-full max-h-96 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingAnnouncement && (
        <EditAnnouncementForm
          announcementId={editingAnnouncement.id}
          classId={classId}
          initialTitle={editingAnnouncement.title}
          initialContent={editingAnnouncement.content}
          initialAttachedImage={editingAnnouncement.attachedImage}
          isOpen={true}
          onClose={() => setEditingAnnouncement(null)}
          onSuccess={() => setEditingAnnouncement(null)}
        />
      )}
    </div>
  );
}
