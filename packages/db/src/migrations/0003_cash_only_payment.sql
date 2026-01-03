-- Migration: Simplify payment method to cash only
-- Update all existing non-cash payment methods to cash
UPDATE "tuition_billing" 
SET "payment_method" = 'cash' 
WHERE "payment_method" IN ('bank_transfer', 'momo', 'vnpay');

UPDATE "tutor_payments" 
SET "payment_method" = 'cash' 
WHERE "payment_method" IN ('bank_transfer', 'momo', 'vnpay');

-- Drop and recreate the payment_method enum with only 'cash'
ALTER TYPE "payment_method" RENAME TO "payment_method_old";

CREATE TYPE "payment_method" AS ENUM ('cash');

ALTER TABLE "tuition_billing" 
  ALTER COLUMN "payment_method" TYPE "payment_method" 
  USING "payment_method"::text::"payment_method";

ALTER TABLE "tutor_payments" 
  ALTER COLUMN "payment_method" TYPE "payment_method" 
  USING "payment_method"::text::"payment_method";

DROP TYPE "payment_method_old";
