"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      toast.success("Announcement updated successfully");
      onClose();
      // Invalidate announcements query
      queryClient.invalidateQueries({
        queryKey: ["class-announcements", classId],
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update announcement: ${error.message}`);
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image files are allowed");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
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
        toast.success("Image uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
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
          <DialogTitle>Edit Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Description</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement description"
              rows={4}
            />
          </div>

          <div>
            <Label>Attached Image (Optional)</Label>
            <div className="mt-2">
              {attachedImage ? (
                <div className="relative">
                  <img
                    src={attachedImage}
                    alt="Attached image"
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
                    Upload an image to attach to your announcement
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
                        {isUploading ? "" : "Choose Image"}
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || isUploading}
            >
              {updateMutation.isPending ? "Updating..." : "Update Announcement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
