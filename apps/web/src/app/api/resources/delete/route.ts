import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@edura/db";
import { resources } from "@edura/db/schema/education";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/server-auth";

const deleteSchema = z.object({
  resourceId: z.string(),
});

export async function DELETE(request: NextRequest) {
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
        { error: "Forbidden. Only managers can delete resources." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = deleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { resourceId } = validation.data;

    // Find the resource and verify ownership
    const resource = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.resourceId, resourceId),
          eq(resources.uploadedBy, session.user.id)
        )
      );

    if (resource.length === 0) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(resource[0].fileUrl);
    } catch (blobError) {
      console.error("Error deleting from Vercel Blob:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await db.delete(resources).where(eq(resources.resourceId, resourceId));

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
