import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server-auth";

const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can upload submission files
    if ((session.user as any).role !== "student") {
      return NextResponse.json(
        { error: "Only students can upload submission files" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Validate total size and individual file types/sizes
    let totalSize = 0;
    for (const file of files) {
      totalSize += file.size;

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${file.name}. Only PDFs and images are allowed.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit.` },
          { status: 400 }
        );
      }
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Total file size exceeds 30MB limit." },
        { status: 400 }
      );
    }

    // Upload all files to Vercel Blob
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const blob = await put(`submission-${Date.now()}-${file.name}`, file, {
          access: "public",
        });

        return {
          name: file.name,
          url: blob.url,
          type: file.type,
          size: file.size,
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
