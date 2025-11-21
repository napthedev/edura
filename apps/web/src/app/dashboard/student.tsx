"use client";
import { JoinClassForm } from "@/components/join-class-form";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Loader from "@/components/loader";
import { BookOpen, Clock } from "lucide-react";

export default function StudentDashboard() {
  const studentClassesQuery = useQuery({
    queryKey: ["student-classes"],
    queryFn: () => trpcClient.education.getStudentClasses.query(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Student Dashboard
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stats Cards - Inspiration from design */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enrolled Classes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentClassesQuery.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Assignments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {studentClassesQuery.isLoading ? (
                <Loader />
              ) : studentClassesQuery.data &&
                studentClassesQuery.data.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {studentClassesQuery.data.map((enrollment) => (
                    <Link
                      href={`/class/student/${enrollment.classId}`}
                      key={enrollment.classId}
                      className="block group"
                    >
                      <div className="border rounded-xl p-5 transition-all hover:shadow-md bg-white h-full flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                            {enrollment.className}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Code:{" "}
                            <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">
                              {enrollment.classCode}
                            </span>
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 mt-4 pt-4 border-t">
                          Joined:{" "}
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No classes joined yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <JoinClassForm onClassJoined={() => studentClassesQuery.refetch()} />
        </div>
      </div>
    </div>
  );
}
