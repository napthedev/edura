-- Ensure students always have a manager assigned (multi-tenancy requirement)
-- This constraint enforces that students must belong to a learning center

ALTER TABLE "user" ADD CONSTRAINT "student_manager_required" 
CHECK (role != 'student' OR manager_id IS NOT NULL);
