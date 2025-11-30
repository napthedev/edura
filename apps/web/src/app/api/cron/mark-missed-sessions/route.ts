import { NextResponse } from "next/server";
import { db } from "@edura/db";
import {
  attendanceLogs,
  classSchedules,
  classes,
} from "@edura/db/schema/education";
import { eq, and, sql } from "drizzle-orm";

// Vercel Cron configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This endpoint is called by Vercel Cron daily at 11 PM to mark missed sessions
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/mark-missed-sessions", "schedule": "0 23 * * *" }] }
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

    const now = new Date();
    const today = now.toISOString().split("T")[0]!;
    const currentDayOfWeek = now.getDay();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    // Get all schedules for today
    const schedules = await db
      .select({
        schedule: classSchedules,
        class: classes,
      })
      .from(classSchedules)
      .innerJoin(classes, eq(classSchedules.classId, classes.classId))
      .where(eq(classSchedules.dayOfWeek, currentDayOfWeek));

    let markedCount = 0;

    for (const { schedule, class: cls } of schedules) {
      const [endHours, endMinutes] = schedule.endTime.split(":").map(Number);
      const endTimeMinutes = endHours! * 60 + endMinutes!;

      // Skip if session hasn't ended yet (with 5 min buffer)
      if (currentTimeMinutes < endTimeMinutes + 5) {
        continue;
      }

      // Check if there's already a log for this schedule today
      const existingLog = await db
        .select()
        .from(attendanceLogs)
        .where(
          and(
            eq(attendanceLogs.scheduleId, schedule.scheduleId),
            eq(attendanceLogs.sessionDate, today)
          )
        );

      // If no log exists, mark as missed
      if (existingLog.length === 0) {
        await db.insert(attendanceLogs).values({
          logId: crypto.randomUUID(),
          scheduleId: schedule.scheduleId,
          classId: cls.classId,
          teacherId: cls.teacherId,
          sessionDate: today,
          status: "missed",
        });
        markedCount++;
      }
    }

    console.log(`[Cron] Marked ${markedCount} missed sessions for ${today}`);

    return NextResponse.json({
      success: true,
      date: today,
      markedCount,
      totalSchedulesChecked: schedules.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error marking missed sessions:", error);
    return NextResponse.json(
      { error: "Failed to mark missed sessions", details: String(error) },
      { status: 500 }
    );
  }
}
