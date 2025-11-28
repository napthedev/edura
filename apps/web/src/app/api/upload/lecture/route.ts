import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@edura/db";
import { classes, lectures } from "@edura/db/schema/education";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/server-auth";

const uploadSchema = z.object({
  classId: z.string(),
  moduleId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  lectureDate: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const classId = formData.get("classId") as string;
    const moduleId = formData.get("moduleId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const lectureDate = formData.get("lectureDate") as string;

    // Validate input
    const validation = uploadSchema.safeParse({
      classId,
      moduleId: moduleId || undefined,
      title,
      description: description || undefined,
      lectureDate,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if file is PDF or image
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDFs and images are allowed." },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB." },
        { status: 400 }
      );
    }

    // Check if class belongs to teacher
    const classData = await db
      .select()
      .from(classes)
      .where(
        eq(classes.classId, classId) && eq(classes.teacherId, session.user.id)
      );

    if (classData.length === 0) {
      return NextResponse.json(
        { error: "Class not found or access denied" },
        { status: 403 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    });

    // Create lecture record
    const lectureId = crypto.randomUUID();
    const newLecture = await db
      .insert(lectures)
      .values({
        lectureId,
        classId,
        moduleId: moduleId || null,
        title,
        description: description || "",
        type: "file",
        url: blob.url,
        lectureDate: new Date(lectureDate),
      })
      .returning();

    return NextResponse.json({
      success: true,
      lecture: newLecture[0],
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
