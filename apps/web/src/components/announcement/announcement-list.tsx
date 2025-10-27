"use client";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

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
}

export default function AnnouncementList({ classId }: AnnouncementListProps) {
  const {
    data: announcements,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["class-announcements", classId],
    queryFn: () =>
      trpcClient.education.getClassAnnouncements.query({ classId }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
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
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Failed to load announcements
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No announcements yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map(({ announcement, creator }: Announcement) => (
        <Card key={announcement.announcementId} className="overflow-hidden">
          <CardContent className="p-6">
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
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-lg">
                    {announcement.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {formatDistanceToNow(new Date(announcement.createdAt), {
                      addSuffix: true,
                    })}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  Posted by {creator.name}
                </p>

                {announcement.content && (
                  <div className="prose prose-sm max-w-none mb-4">
                    <p className="whitespace-pre-wrap">
                      {announcement.content}
                    </p>
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
    </div>
  );
}
