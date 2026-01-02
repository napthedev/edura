CREATE TYPE "public"."user_role" AS ENUM('teacher', 'student', 'manager');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('checked_in', 'completed', 'missed');--> statement-breakpoint
CREATE TYPE "public"."billing_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."expense_category_type" AS ENUM('facility', 'marketing', 'operational');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer', 'momo', 'vnpay');--> statement-breakpoint
CREATE TYPE "public"."recurring_interval" AS ENUM('monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."schedule_color" AS ENUM('blue', 'green', 'purple', 'orange', 'pink', 'teal');--> statement-breakpoint
CREATE TYPE "public"."teacher_rate_type" AS ENUM('HOURLY', 'PER_STUDENT', 'MONTHLY_FIXED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"manager_id" text,
	"generated_password" text,
	"has_changed_password" boolean DEFAULT false NOT NULL,
	"date_of_birth" timestamp,
	"address" text,
	"grade" text,
	"school_name" text,
	"parent_email" text,
	"parent_phone" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_emails" (
	"email_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_phones" (
	"phone_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"phone_number" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"announcement_id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"attached_image" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"assignment_id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"module_id" text,
	"title" text NOT NULL,
	"description" text,
	"assignment_type" text DEFAULT 'quiz' NOT NULL,
	"assignment_content" text,
	"due_date" timestamp,
	"testing_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"log_id" text PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"class_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"session_date" text NOT NULL,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"actual_duration_minutes" integer,
	"status" "attendance_status" DEFAULT 'checked_in' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"log_id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_join_requests" (
	"request_id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "class_join_requests_student_id_class_id_unique" UNIQUE("student_id","class_id")
);
--> statement-breakpoint
CREATE TABLE "class_modules" (
	"module_id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_schedules" (
	"schedule_id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"title" text NOT NULL,
	"color" "schedule_color" DEFAULT 'blue' NOT NULL,
	"location" text,
	"meeting_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"class_id" text PRIMARY KEY NOT NULL,
	"class_name" text NOT NULL,
	"class_code" text NOT NULL,
	"subject" text,
	"schedule" text,
	"tuition_rate" integer,
	"teacher_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classes_class_code_unique" UNIQUE("class_code")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"enrollment_id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_student_id_class_id_unique" UNIQUE("student_id","class_id")
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"category_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "expense_category_type" NOT NULL,
	"manager_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"expense_id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"expense_date" timestamp NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_interval" "recurring_interval",
	"manager_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lectures" (
	"lecture_id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"module_id" text,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"lecture_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"notification_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"link_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_consent" (
	"consent_id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"enable_weekly" boolean DEFAULT true NOT NULL,
	"enable_monthly" boolean DEFAULT true NOT NULL,
	"enable_urgent_alerts" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parent_consent_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"question_id" text PRIMARY KEY NOT NULL,
	"subject" text,
	"difficulty_level" text,
	"question_text" text NOT NULL,
	"correct_answer" text,
	"options" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"resource_id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"description" text,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_attendance_logs" (
	"log_id" text PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"session_date" text NOT NULL,
	"checked_in_at" timestamp,
	"checked_in_by_teacher_id" text,
	"is_present" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_attendance_logs_student_id_schedule_id_session_date_unique" UNIQUE("student_id","schedule_id","session_date")
);
--> statement-breakpoint
CREATE TABLE "submission_answers" (
	"answer_id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"question_id" text NOT NULL,
	"student_answer" jsonb,
	"is_correct" boolean,
	"points_awarded" integer
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"submission_id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"submission_content" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"grade" integer,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE "teacher_rates" (
	"rate_id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"rate_type" "teacher_rate_type" NOT NULL,
	"amount" integer NOT NULL,
	"effective_date" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "tuition_billing" (
	"billing_id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text,
	"amount" integer NOT NULL,
	"billing_month" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" "billing_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"payment_method" "payment_method",
	"invoice_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_payments" (
	"payment_id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"amount" integer NOT NULL,
	"payment_month" text NOT NULL,
	"sessions_count" integer DEFAULT 0,
	"students_count" integer DEFAULT 0,
	"rate_id" text,
	"status" "billing_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"payment_method" "payment_method",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_emails" ADD CONSTRAINT "user_emails_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_phones" ADD CONSTRAINT "user_phones_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_module_id_class_modules_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."class_modules"("module_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_schedule_id_class_schedules_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."class_schedules"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_join_requests" ADD CONSTRAINT "class_join_requests_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_join_requests" ADD CONSTRAINT "class_join_requests_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_modules" ADD CONSTRAINT "class_modules_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_manager_id_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_manager_id_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_module_id_class_modules_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."class_modules"("module_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_consent" ADD CONSTRAINT "parent_consent_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance_logs" ADD CONSTRAINT "student_attendance_logs_schedule_id_class_schedules_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."class_schedules"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance_logs" ADD CONSTRAINT "student_attendance_logs_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance_logs" ADD CONSTRAINT "student_attendance_logs_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance_logs" ADD CONSTRAINT "student_attendance_logs_checked_in_by_teacher_id_user_id_fk" FOREIGN KEY ("checked_in_by_teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_submission_id_submissions_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("submission_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("assignment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_rates" ADD CONSTRAINT "teacher_rates_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_billing" ADD CONSTRAINT "tuition_billing_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_billing" ADD CONSTRAINT "tuition_billing_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_payments" ADD CONSTRAINT "tutor_payments_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_payments" ADD CONSTRAINT "tutor_payments_rate_id_teacher_rates_rate_id_fk" FOREIGN KEY ("rate_id") REFERENCES "public"."teacher_rates"("rate_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollments_enrolled_at_idx" ON "enrollments" USING btree ("enrolled_at");--> statement-breakpoint
CREATE INDEX "student_attendance_session_date_idx" ON "student_attendance_logs" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "submissions_submitted_at_idx" ON "submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "tuition_billing_month_idx" ON "tuition_billing" USING btree ("billing_month");