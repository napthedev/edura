-- Migration: Remove overdue status from billing_status enum
-- This migration updates all 'overdue' records to 'pending' and removes the 'overdue' value from the enum

-- Step 1: Update all existing 'overdue' records to 'pending'
UPDATE tuition_billing SET status = 'pending' WHERE status = 'overdue';
UPDATE tutor_payments SET status = 'pending' WHERE status = 'overdue';

-- Step 2: Alter the enum type to remove 'overdue'
-- PostgreSQL doesn't support direct enum value removal, so we need to:
-- a) Create a new enum without 'overdue'
CREATE TYPE billing_status_new AS ENUM ('pending', 'paid', 'cancelled');

-- b) Alter the columns to use the new enum
ALTER TABLE tuition_billing 
  ALTER COLUMN status TYPE billing_status_new 
  USING status::text::billing_status_new;

ALTER TABLE tutor_payments 
  ALTER COLUMN status TYPE billing_status_new 
  USING status::text::billing_status_new;

-- c) Drop the old enum and rename the new one
DROP TYPE billing_status;
ALTER TYPE billing_status_new RENAME TO billing_status;
