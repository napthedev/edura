"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FileAttachment } from "@/lib/assignment-types";

interface FilePreviewProps {
  files: FileAttachment[];
  showDownloadLinks?: boolean;
}

export function FilePreview({
  files,
  showDownloadLinks = true,
}: FilePreviewProps) {
  const t = useTranslations("WrittenAssignment");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) => type.startsWith("image/");
  const isPdf = (type: string) => type === "application/pdf";

  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("noFilesAttached")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file, index) => (
        <Card key={file.url} className="overflow-hidden">
          <CardContent className="p-0">
            {/* File Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                {isPdf(file.type) ? (
                  <FileText className="size-4 text-red-500 flex-shrink-0" />
                ) : (
                  <ImageIcon className="size-4 text-blue-500 flex-shrink-0" />
                )}
                <span className="text-sm font-medium truncate">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              {showDownloadLinks && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    asChild
                  >
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("openInNewTab")}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    asChild
                  >
                    <a
                      href={file.url}
                      download={file.name}
                      title={t("downloadFile")}
                    >
                      <Download className="size-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* File Preview */}
            <div className="p-3">
              {isImage(file.type) ? (
                <div className="relative">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="max-w-full h-auto rounded-md mx-auto max-h-[500px] object-contain"
                  />
                </div>
              ) : isPdf(file.type) ? (
                <div className="relative">
                  <iframe
                    src={`${file.url}#toolbar=0`}
                    title={file.name}
                    className="w-full h-[600px] rounded-md border"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("previewNotAvailable")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
