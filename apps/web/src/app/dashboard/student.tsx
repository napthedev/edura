"use client";
import Header from "@/components/header";
import { JoinClassForm } from "@/components/join-class-form";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Loader from "@/components/loader";

export default function StudentDashboard() {
  const studentClassesQuery = useQuery({
    queryKey: ["student-classes"],
    queryFn: () => trpcClient.education.getStudentClasses.query(),
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold my-8">Student Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <JoinClassForm
              onClassJoined={() => studentClassesQuery.refetch()}
            />
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>My Classes</CardTitle>
              </CardHeader>
              <CardContent>
                {studentClassesQuery.isLoading ? (
                  <Loader />
                ) : studentClassesQuery.data &&
                  studentClassesQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    {studentClassesQuery.data.map((enrollment) => (
                      <Link
                        href={`/class/student/${enrollment.classId}`}
                        key={enrollment.classId}
                        className="block"
                      >
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold text-lg">
                            {enrollment.className}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Code: {enrollment.classCode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Joined:{" "}
                            {new Date(
                              enrollment.enrolledAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No classes joined yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
