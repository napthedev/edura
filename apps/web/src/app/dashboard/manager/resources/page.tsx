"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/dashboard/manager/file-upload";
import { FileList } from "@/components/dashboard/manager/file-list";
import { toast } from "sonner";

interface Resource {
  resourceId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  description: string | null;
  createdAt: Date;
}

export default function ResourcesPage() {
  const t = useTranslations("Resources");
  const { data: session, isPending: loading } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/resources/list");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch resources");
      }

      setResources(data.resources);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error(error.message || t("fetchFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && (session.user as any)?.role === "manager") {
      fetchResources();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;

  if (role !== "manager") {
    redirect(`/dashboard/${role}` as any);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchResources}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Upload Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{t("uploadSection")}</h2>
        <FileUpload onUploadSuccess={fetchResources} />
      </div>

      {/* File List Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{t("filesSection")}</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <FileList resources={resources} onRefresh={fetchResources} />
        )}
      </div>
    </div>
  );
}
