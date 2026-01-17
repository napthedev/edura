ALTER TABLE "tuition_billing" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tuition_billing" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
ALTER TABLE "tutor_payments" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tutor_payments" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."billing_status";--> statement-breakpoint
CREATE TYPE "public"."billing_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
ALTER TABLE "tuition_billing" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."billing_status";--> statement-breakpoint
ALTER TABLE "tuition_billing" ALTER COLUMN "status" SET DATA TYPE "public"."billing_status" USING "status"::"public"."billing_status";--> statement-breakpoint
ALTER TABLE "tutor_payments" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."billing_status";--> statement-breakpoint
ALTER TABLE "tutor_payments" ALTER COLUMN "status" SET DATA TYPE "public"."billing_status" USING "status"::"public"."billing_status";