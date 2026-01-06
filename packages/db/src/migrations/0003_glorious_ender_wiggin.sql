ALTER TABLE "session_reports" ADD COLUMN "is_valid" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "student_attendance_logs" ADD COLUMN "minutes_late" integer;