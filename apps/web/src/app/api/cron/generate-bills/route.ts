import { NextResponse } from "next/server";
import { db } from "@edura/db";
import {
  tuitionBilling,
  classes,
  enrollments,
} from "@edura/db/schema/education";
import { user } from "@edura/db/schema/auth";
import { eq, inArray } from "drizzle-orm";

// Vercel Cron configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This endpoint is called by Vercel Cron on the 1st of each month
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/generate-bills", "schedule": "0 0 1 * *" }] }
export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron (in production)
    const authHeader = request.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // Set due date to 15th of the month
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 15);

    // Get all active enrollments with class and student info
    const enrollmentData = await db
      .select({
        enrollmentId: enrollments.enrollmentId,
        studentId: enrollments.studentId,
        classId: enrollments.classId,
        tuitionRate: classes.tuitionRate,
        className: classes.className,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.classId));

    // Check for existing billings for this month
    const existingBillings = await db
      .select({
        studentId: tuitionBilling.studentId,
        classId: tuitionBilling.classId,
      })
      .from(tuitionBilling)
      .where(eq(tuitionBilling.billingMonth, billingMonth));

    const existingKeys = new Set(
      existingBillings.map((b) => `${b.studentId}-${b.classId}`)
    );

    // Filter out enrollments that already have billings
    const newBillings = enrollmentData
      .filter((e) => !existingKeys.has(`${e.studentId}-${e.classId}`))
      .filter((e) => e.tuitionRate && e.tuitionRate > 0)
      .map((enrollment) => ({
        billingId: crypto.randomUUID(),
        studentId: enrollment.studentId,
        classId: enrollment.classId,
        amount: enrollment.tuitionRate!,
        billingMonth,
        dueDate,
        status: "pending" as const,
        invoiceNumber: `INV-${billingMonth.replace("-", "")}-${crypto
          .randomUUID()
          .slice(0, 8)
          .toUpperCase()}`,
      }));

    if (newBillings.length > 0) {
      await db.insert(tuitionBilling).values(newBillings);
    }

    console.log(
      `[Cron] Generated ${newBillings.length} bills for ${billingMonth}`
    );

    return NextResponse.json({
      success: true,
      billingMonth,
      created: newBillings.length,
      skipped: enrollmentData.length - newBillings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error generating bills:", error);
    return NextResponse.json(
      { error: "Failed to generate bills", details: String(error) },
      { status: 500 }
    );
  }
}
