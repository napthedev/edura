"use client";

import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Archive,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface Resource {
  resourceId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  description: string | null;
  createdAt: Date;
}

interface FileListProps {
  resources: Resource[];
  onRefresh: () => void;
}

export function FileList({ resources, onRefresh }: FileListProps) {
  const t = useTranslations("Resources");
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [deleteResource, setDeleteResource] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return ImageIcon;
    if (fileType.startsWith("video/")) return Video;
    if (fileType.includes("pdf")) return FileText;
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("archive")
    )
      return Archive;
    return FileText;
  };

  const isPreviewable = (fileType: string) => {
    return (
      fileType.startsWith("image/") ||
      fileType.startsWith("video/") ||
      fileType.includes("pdf")
    );
  };

  const handleDownload = (resource: Resource) => {
    window.open(resource.fileUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!deleteResource) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/resources/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId: deleteResource.resourceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      toast.success(t("deleteSuccess"));
      setDeleteResource(null);
      onRefresh();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || t("deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
        <p>{t("noResources")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fileName")}</TableHead>
              <TableHead>{t("fileType")}</TableHead>
              <TableHead>{t("fileSize")}</TableHead>
              <TableHead>{t("uploadDate")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => {
              const Icon = getFileIcon(resource.fileType);
              return (
                <TableRow key={resource.resourceId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{resource.fileName}</p>
                        {resource.description && (
                          <p className="text-xs text-gray-500">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {resource.fileType}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatFileSize(resource.fileSize)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(resource.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isPreviewable(resource.fileType) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewResource(resource)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(resource)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteResource(resource)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewResource}
        onOpenChange={() => setPreviewResource(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewResource?.fileName}</DialogTitle>
            {previewResource?.description && (
              <DialogDescription>
                {previewResource.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="overflow-auto">
            {previewResource?.fileType.startsWith("image/") && (
              <img
                src={previewResource.fileUrl}
                alt={previewResource.fileName}
                className="w-full h-auto"
              />
            )}
            {previewResource?.fileType.startsWith("video/") && (
              <video controls className="w-full h-auto">
                <source
                  src={previewResource.fileUrl}
                  type={previewResource.fileType}
                />
                {t("videoNotSupported")}
              </video>
            )}
            {previewResource?.fileType.includes("pdf") && (
              <iframe
                src={previewResource.fileUrl}
                className="w-full h-[70vh]"
                title={previewResource.fileName}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteResource}
        onOpenChange={() => setDeleteResource(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription", {
                fileName: deleteResource?.fileName ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
