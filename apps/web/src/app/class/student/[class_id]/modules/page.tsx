"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import Loader from "@/components/loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Video } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function StudentModulesPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("Modules");

  const modulesQuery = useQuery({
    queryKey: [["education", "getClassModules"], { classId }],
    queryFn: async () => {
      return await trpcClient.education.getClassModules.query({ classId });
    },
  });

  if (modulesQuery.isLoading) {
    return <Loader />;
  }

  const modules = modulesQuery.data || [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <p>{t("noModulesAvailable")}</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {modules.map((module) => (
            <Card key={module.moduleId}>
              <AccordionItem value={module.moduleId} className="border-none">
                <CardHeader className="p-4">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <div className="flex flex-col items-start text-left">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      {module.description && (
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2 mt-4">
                    {module.assignments.length === 0 &&
                      module.lectures.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          {t("noContentInModule")}
                        </p>
                      )}

                    {module.lectures.map((lecture: any) => (
                      <Link
                        key={lecture.lectureId}
                        href={`/lecture/${lecture.lectureId}`}
                        className="flex items-center p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Video className="w-5 h-5 mr-3 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium">{lecture.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("lecture")} •{" "}
                            {format(new Date(lecture.lectureDate), "PPP")}
                          </p>
                        </div>
                      </Link>
                    ))}

                    {module.assignments.map((assignment: any) => (
                      <Link
                        key={assignment.assignmentId}
                        href={`/do-assignment/${assignment.assignmentId}`}
                        className="flex items-center p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
                      >
                        <FileText className="w-5 h-5 mr-3 text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("assignment")} • {t("due")}{" "}
                            {assignment.dueDate
                              ? format(new Date(assignment.dueDate), "PPP")
                              : t("noDueDate")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      )}
    </div>
  );
}
