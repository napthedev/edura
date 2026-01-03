-- Make email nullable for students
ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;

-- Drop existing unique constraint on email
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_email_unique";

-- Add partial unique constraint (unique only when email is not null)
CREATE UNIQUE INDEX "user_email_unique" ON "user" ("email") WHERE "email" IS NOT NULL;

-- Add check constraint to ensure managers and teachers have email
ALTER TABLE "user" ADD CONSTRAINT "user_role_email_check" 
  CHECK (
    (role IN ('manager', 'teacher') AND email IS NOT NULL) OR
    (role = 'student')
  );
