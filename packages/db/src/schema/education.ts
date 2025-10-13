import { pgTable, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Classes table
export const classes = pgTable("classes", {
  classId: text("class_id").primaryKey(),
  className: text("class_name").notNull(),
  classCode: text("class_code").notNull().unique(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Enrollments table (join table for many-to-many relationship between students and classes)
export const enrollments = pgTable(
  "enrollments",
  {
    enrollmentId: text("enrollment_id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.classId, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint to prevent a student from enrolling in the same class more than once
    uniqueStudentClass: unique().on(table.studentId, table.classId),
  })
);

// Assignments table
export const assignments = pgTable("assignments", {
  assignmentId: text("assignment_id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.classId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Submissions table
export const submissions = pgTable(
  "submissions",
  {
    submissionId: text("submission_id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.assignmentId, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    submissionContent: text("submission_content"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    grade: integer("grade"), // Can be NULL until graded
  },
  (table) => ({
    // Unique constraint to prevent multiple submissions from the same student for the same assignment
    uniqueStudentAssignment: unique().on(table.studentId, table.assignmentId),
  })
);
