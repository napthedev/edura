import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@edura/db";
import { resources } from "@edura/db/schema/education";
import { getSession } from "@/lib/server-auth";

const uploadSchema = z.object({
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const role = (session.user as any)?.role;
    if (role !== "manager") {
      return NextResponse.json(
        { error: "Forbidden. Only managers can upload resources." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;

    // Validate input
    const validation = uploadSchema.safeParse({
      description: description || undefined,
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

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 50MB." },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    });

    // Create resource record
    const resourceId = crypto.randomUUID();
    const newResource = await db
      .insert(resources)
      .values({
        resourceId,
        fileName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        fileType: file.type,
        description: description || null,
        uploadedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      resource: newResource[0],
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
