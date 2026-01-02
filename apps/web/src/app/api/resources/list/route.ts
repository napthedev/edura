import { NextRequest, NextResponse } from "next/server";
import { db } from "@edura/db";
import { resources } from "@edura/db/schema/education";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
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
        { error: "Forbidden. Only managers can access resources." },
        { status: 403 }
      );
    }

    // Get all resources uploaded by this manager
    const allResources = await db
      .select()
      .from(resources)
      .where(eq(resources.uploadedBy, session.user.id))
      .orderBy(desc(resources.createdAt));

    return NextResponse.json({
      success: true,
      resources: allResources,
    });
  } catch (error) {
    console.error("List resources error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
