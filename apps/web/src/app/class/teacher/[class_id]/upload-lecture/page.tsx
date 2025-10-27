"use client";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

const fileUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  lectureDate: z.string().min(1, "Lecture date is required"),
});

const youtubeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Please enter a valid URL"),
  lectureDate: z.string().min(1, "Lecture date is required"),
});

type FileUploadForm = z.infer<typeof fileUploadSchema>;
type YoutubeForm = z.infer<typeof youtubeSchema>;

export default function UploadLecturePage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileForm = useForm<FileUploadForm>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      lectureDate: new Date().toISOString().split("T")[0],
    },
  });

  const youtubeForm = useForm<YoutubeForm>({
    resolver: zodResolver(youtubeSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      lectureDate: new Date().toISOString().split("T")[0],
    },
  });

  const createLectureMutation = useMutation({
    mutationFn: async (data: YoutubeForm) => {
      return await trpcClient.education.createLecture.mutate({
        classId,
        title: data.title,
        description: data.description,
        type: "youtube",
        url: data.url,
        lectureDate: data.lectureDate,
      });
    },
    onSuccess: () => {
      toast.success("YouTube lecture created successfully");
      router.push(`/class/teacher/${classId}`);
    },
    onError: (error) => {
      toast.error(`Failed to create lecture: ${error.message}`);
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (data: FileUploadForm) => {
      if (!selectedFile) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("classId", classId);
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("lectureDate", data.lectureDate);

      const response = await fetch("/api/upload/lecture", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      router.push(`/class/teacher/${classId}`);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const onFileSubmit = (data: FileUploadForm) => {
    uploadFileMutation.mutate(data);
  };

  const onYoutubeSubmit = (data: YoutubeForm) => {
    createLectureMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Only PDFs and images are allowed.");
        return;
      }
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Upload Lecture</h1>
            <p className="text-muted-foreground mt-2">
              Upload a file or add a YouTube video link
            </p>
          </div>

          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                YouTube Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload File</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...fileForm}>
                    <form
                      onSubmit={fileForm.handleSubmit(onFileSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={fileForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter lecture title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fileForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter lecture description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fileForm.control}
                        name="lectureDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lecture Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <FormLabel>File</FormLabel>
                        <Input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleFileChange}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 h-[50px] file:h-10"
                        />
                        {selectedFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {selectedFile.name} (
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.push(`/class/teacher/${classId}`)
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            uploadFileMutation.isPending || !selectedFile
                          }
                        >
                          {uploadFileMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {uploadFileMutation.isPending ? "" : "Upload Lecture"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="youtube" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add YouTube Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...youtubeForm}>
                    <form
                      onSubmit={youtubeForm.handleSubmit(onYoutubeSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={youtubeForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter lecture title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={youtubeForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter lecture description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={youtubeForm.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>YouTube URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://www.youtube.com/watch?v=..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={youtubeForm.control}
                        name="lectureDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lecture Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.push(`/class/teacher/${classId}`)
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createLectureMutation.isPending}
                        >
                          {createLectureMutation.isPending
                            ? "Creating..."
                            : "Add Lecture"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
