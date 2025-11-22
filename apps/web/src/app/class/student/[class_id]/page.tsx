"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClassPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();

  useEffect(() => {
    router.replace(`/class/student/${classId}/announcement`);
  }, [classId, router]);

  return null;
}
