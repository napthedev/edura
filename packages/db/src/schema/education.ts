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
  assignmentContent: text("assignment_content"),
  dueDate: timestamp("due_date"),
  testingDuration: integer("testing_duration"), // Duration in minutes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Submissions table
export const submissions = pgTable("submissions", {
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
});

// Announcements table
export const announcements = pgTable("announcements", {
  announcementId: text("announcement_id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.classId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schedules table
export const schedules = pgTable("schedules", {
  scheduleId: text("schedule_id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.classId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Lectures table
export const lectures = pgTable("lectures", {
  lectureId: text("lecture_id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.classId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'file' or 'youtube'
  url: text("url").notNull(),
  lectureDate: timestamp("lecture_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
