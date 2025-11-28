"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

export default function LecturePage() {
  const params = useParams();
  const lectureId = params.lecture_id as string;
  const router = useRouter();
  const t = useTranslations("LecturePage");

  const lectureQuery = useQuery({
    queryKey: ["lecture", lectureId],
    queryFn: () => trpcClient.education.getLecture.query({ lectureId }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => trpcClient.education.deleteLecture.mutate({ lectureId }),
    onSuccess: () => {
      toast.success(t("lectureDeletedSuccess"));
      router.back();
    },
    onError: (error) => {
      toast.error(`${t("failedToDeleteLecture")}: ${error.message}`);
    },
  });

  const handleDownload = () => {
    if (lectureQuery.data?.lecture.type === "file") {
      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = lectureQuery.data.lecture.url;
      link.download = ""; // Let the browser determine the filename
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (lectureQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Loader />
        </div>
      </div>
    );
  }

  if (lectureQuery.error || !lectureQuery.data) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500">{t("lectureNotFound")}</div>
        </div>
      </div>
    );
  }

  const { lecture, class: classData } = lectureQuery.data;

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId =
    lecture.type === "youtube" ? getYouTubeVideoId(lecture.url) : null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("back")}
            </Button>
            <div className="flex gap-2">
              {lecture.type === "file" && (
                <Button
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t("download")}
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteLecture")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteLectureDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? t("deleting") : t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Separator />

          {/* Lecture Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{lecture.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {lecture.type === "file" ? t("file") : t("youtubeVideo")}
                    </Badge>
                    <span>
                      {t("class")}: {classData.className}
                    </span>
                    <span>
                      {t("date")}:{" "}
                      {new Date(lecture.lectureDate).toLocaleDateString()}
                    </span>
                    <span>
                      {t("uploaded")}:{" "}
                      {new Date(lecture.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            {lecture.description && (
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground">{lecture.description}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>{t("content")}</CardTitle>
            </CardHeader>
            <CardContent>
              {lecture.type === "file" ? (
                <div className="space-y-4">
                  {lecture.url.toLowerCase().endsWith(".pdf") ? (
                    <div className="w-full h-96 border rounded-lg overflow-hidden">
                      <iframe
                        src={lecture.url}
                        className="w-full h-full"
                        title={lecture.title}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <img
                        src={lecture.url}
                        alt={lecture.title}
                        className="max-w-full max-h-96 object-contain rounded-lg"
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      {t("downloadFile")}
                    </Button>
                  </div>
                </div>
              ) : videoId ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full rounded-lg"
                    title={lecture.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {t("unableToPreview")}
                  </p>
                  <Button asChild>
                    <a
                      href={lecture.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("openInYoutube")}
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
