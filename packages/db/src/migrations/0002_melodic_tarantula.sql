CREATE TYPE "public"."teacher_type" AS ENUM('NATIVE', 'FOREIGN', 'TEACHING_ASSISTANT');--> statement-breakpoint
CREATE TABLE "session_reports" (
	"report_id" text PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"class_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"session_date" text NOT NULL,
	"report_content" text NOT NULL,
	"recording_link" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_reports_schedule_id_session_date_unique" UNIQUE("schedule_id","session_date")
);
--> statement-breakpoint
CREATE TABLE "teacher_rate_presets" (
	"preset_id" text PRIMARY KEY NOT NULL,
	"manager_id" text NOT NULL,
	"preset_name" text NOT NULL,
	"teacher_type" "teacher_type",
	"custom_type_name" text,
	"rate_type" "teacher_rate_type" NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tuition_billing" ALTER COLUMN "payment_method" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tutor_payments" ALTER COLUMN "payment_method" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash');--> statement-breakpoint
ALTER TABLE "tuition_billing" ALTER COLUMN "payment_method" SET DATA TYPE "public"."payment_method" USING "payment_method"::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "tutor_payments" ALTER COLUMN "payment_method" SET DATA TYPE "public"."payment_method" USING "payment_method"::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "teacher_rates" ADD COLUMN "preset_id" text;--> statement-breakpoint
ALTER TABLE "session_reports" ADD CONSTRAINT "session_reports_schedule_id_class_schedules_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."class_schedules"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_reports" ADD CONSTRAINT "session_reports_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_reports" ADD CONSTRAINT "session_reports_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_rate_presets" ADD CONSTRAINT "teacher_rate_presets_manager_id_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_reports_session_date_idx" ON "session_reports" USING btree ("session_date");--> statement-breakpoint
ALTER TABLE "teacher_rates" ADD CONSTRAINT "teacher_rates_preset_id_teacher_rate_presets_preset_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."teacher_rate_presets"("preset_id") ON DELETE set null ON UPDATE no action;