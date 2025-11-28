"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface CreateAnnouncementFormProps {
  classId: string;
  onSuccess?: () => void;
}

export default function CreateAnnouncementForm({
  classId,
  onSuccess,
}: CreateAnnouncementFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations("CreateAnnouncement");

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      content?: string;
      attachedImage?: string;
    }) =>
      trpcClient.education.createAnnouncement.mutate({
        classId,
        ...data,
      }),
    onSuccess: () => {
      toast.success(t("announcementCreated"));
      setIsOpen(false);
      setTitle("");
      setContent("");
      setAttachedImage(null);
      // Invalidate announcements query
      queryClient.invalidateQueries({
        queryKey: ["class-announcements", classId],
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`${t("failedToCreateAnnouncement")}: ${error.message}`);
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("onlyImageFilesAllowed"));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("fileSizeTooLarge"));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/announcement", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setAttachedImage(result.url);
        toast.success(t("imageUploaded"));
      } else {
        toast.error(result.error || t("failedToUploadImage"));
      }
    } catch (error) {
      toast.error(t("failedToUploadImage"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      content: content.trim() || undefined,
      attachedImage: attachedImage || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("createAnnouncement")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {t("createAnnouncement")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("titleLabel")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("enterAnnouncementTitle")}
              required
            />
          </div>

          <div>
            <Label htmlFor="content">{t("description")}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("enterAnnouncementDescription")}
              rows={4}
            />
          </div>

          <div>
            <Label>{t("attachedImageOptional")}</Label>
            <div className="mt-2">
              {attachedImage ? (
                <div className="relative">
                  <img
                    src={attachedImage}
                    alt={t("attachedImage")}
                    className="w-full max-h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setAttachedImage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("uploadImageDescription")}
                  </p>
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {isUploading ? "" : t("chooseImage")}
                      </span>
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || isUploading}
            >
              {createMutation.isPending
                ? t("creating")
                : t("createAnnouncementButton")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
