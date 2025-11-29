"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/assignment/rich-text-editor";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface EditAnnouncementFormProps {
  announcementId: string;
  classId: string;
  initialTitle: string;
  initialContent: string | null;
  initialAttachedImage: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditAnnouncementForm({
  announcementId,
  classId,
  initialTitle,
  initialContent,
  initialAttachedImage,
  isOpen,
  onClose,
  onSuccess,
}: EditAnnouncementFormProps) {
  const t = useTranslations("CreateAnnouncement");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent || "");
  const [attachedImage, setAttachedImage] = useState<string | null>(
    initialAttachedImage
  );
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Update form when props change
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent || "");
    setAttachedImage(initialAttachedImage);
  }, [initialTitle, initialContent, initialAttachedImage]);

  const updateMutation = useMutation({
    mutationFn: (data: {
      title: string;
      content?: string;
      attachedImage?: string;
    }) =>
      trpcClient.education.updateAnnouncement.mutate({
        announcementId,
        ...data,
      }),
    onSuccess: () => {
      toast.success(t("announcementUpdated"));
      onClose();
      // Invalidate announcements query
      queryClient.invalidateQueries({
        queryKey: ["class-announcements", classId],
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`${t("failedToUpdateAnnouncement")}: ${error.message}`);
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

    updateMutation.mutate({
      title: title.trim(),
      content: content.trim() || undefined,
      attachedImage: attachedImage || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("editAnnouncement")}</DialogTitle>
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
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder={t("enterAnnouncementDescription")}
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
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || isUploading}
            >
              {updateMutation.isPending
                ? t("updating")
                : t("updateAnnouncement")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
