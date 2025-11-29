"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FileAttachment } from "@/lib/assignment-types";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

interface FileUploaderProps {
  uploadedFiles: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  uploadEndpoint: "/api/upload/assignment" | "/api/upload/submission";
  disabled?: boolean;
}

interface PendingFile {
  file: File;
  progress: number;
  error?: string;
}

export function FileUploader({
  uploadedFiles,
  onFilesChange,
  uploadEndpoint,
  disabled = false,
}: FileUploaderProps) {
  const t = useTranslations("WrittenAssignment");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTotalSize = useCallback(() => {
    const uploadedSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const pendingSize = pendingFiles.reduce((sum, f) => sum + f.file.size, 0);
    return uploadedSize + pendingSize;
  }, [uploadedFiles, pendingFiles]);

  const getTotalCount = useCallback(() => {
    return uploadedFiles.length + pendingFiles.length;
  }, [uploadedFiles, pendingFiles]);

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const errors: string[] = [];
      const valid: File[] = [];

      const currentCount = getTotalCount();
      const currentSize = getTotalSize();

      let addedCount = 0;
      let addedSize = 0;

      for (const file of files) {
        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(t("invalidFileType", { name: file.name }));
          continue;
        }

        // Check individual file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(t("fileTooLarge", { name: file.name }));
          continue;
        }

        // Check total count
        if (currentCount + addedCount >= MAX_FILES) {
          errors.push(t("maxFilesReached"));
          break;
        }

        // Check total size
        if (currentSize + addedSize + file.size > MAX_TOTAL_SIZE) {
          errors.push(t("maxTotalSizeReached"));
          break;
        }

        valid.push(file);
        addedCount++;
        addedSize += file.size;
      }

      return { valid, errors };
    },
    [getTotalCount, getTotalSize, t]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const { valid, errors } = validateFiles(files);

      if (errors.length > 0) {
        setError(errors.join(". "));
        return;
      }

      if (valid.length === 0) return;

      setError(null);

      // Add files to pending with 0 progress
      const newPending: PendingFile[] = valid.map((file) => ({
        file,
        progress: 0,
      }));
      setPendingFiles((prev) => [...prev, ...newPending]);

      // Upload each file
      const formData = new FormData();
      valid.forEach((file) => formData.append("files", file));

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setPendingFiles((prev) =>
            prev.map((p) => ({
              ...p,
              progress: Math.min(p.progress + 10, 90),
            }))
          );
        }, 200);

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await response.json();

        // Set progress to 100 briefly before removing
        setPendingFiles((prev) => prev.map((p) => ({ ...p, progress: 100 })));

        // Add uploaded files and clear pending
        setTimeout(() => {
          onFilesChange([...uploadedFiles, ...data.files]);
          setPendingFiles([]);
        }, 300);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPendingFiles([]);
      }
    },
    [uploadedFiles, onFilesChange, uploadEndpoint, validateFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      uploadFiles(files);
    },
    [disabled, uploadFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      uploadFiles(files);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [uploadedFiles, onFilesChange]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") {
      return <FileText className="size-5 text-red-500" />;
    }
    return <ImageIcon className="size-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <Upload className="size-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          {t("dragDropFiles")}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          {t("browseFiles")}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          {t("fileConstraints", {
            maxFiles: MAX_FILES,
            maxSize: "30MB",
          })}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
          <AlertCircle className="size-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Pending Files (uploading) */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((pending, index) => (
            <Card key={`pending-${index}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(pending.file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pending.file.name}
                    </p>
                    <Progress value={pending.progress} className="h-1 mt-1" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {pending.progress}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {t("uploadedFiles")} ({uploadedFiles.length}/{MAX_FILES})
          </p>
          {uploadedFiles.map((file, index) => (
            <Card key={file.url}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="size-8"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-muted-foreground">
            {t("totalSize")}: {formatFileSize(getTotalSize())} / 30MB
          </p>
        </div>
      )}
    </div>
  );
}
