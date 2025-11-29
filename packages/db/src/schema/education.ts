import {
  pgTable,
  text,
  timestamp,
  integer,
  unique,
  boolean,
  jsonb,
  pgEnum,
  smallint,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Schedule color enum
export const scheduleColorEnum = pgEnum("schedule_color", [
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
  "teal",
]);

// Billing status enum
export const billingStatusEnum = pgEnum("billing_status", [
  "pending",
  "paid",
  "overdue",
  "cancelled",
]);

// Payment method enum
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "momo",
  "vnpay",
]);

// Classes table
export const classes = pgTable("classes", {
  classId: text("class_id").primaryKey(),
  className: text("class_name").notNull(),
  classCode: text("class_code").notNull().unique(),
  subject: text("subject"),
  schedule: text("schedule"),
  tuitionRate: integer("tuition_rate"), // Monthly tuition rate in smallest currency unit (VND)
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
  moduleId: text("module_id").references(() => classModules.moduleId, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  assignmentType: text("assignment_type").notNull().default("quiz"), // "quiz" or "written"
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
  feedback: text("feedback"), // Rich text feedback for written assignments
});

// Announcements table
export const announcements = pgTable("announcements", {
  announcementId: text("announcement_id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.classId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  attachedImage: text("attached_image"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Class Schedules table (weekly recurring sessions)
export const classSchedules = pgTable("class_schedules", {
  scheduleId: text("schedule_id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.classId, { onDelete: "cascade" }),
  dayOfWeek: smallint("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: text("start_time").notNull(), // Format: "HH:mm" (e.g., "09:00")
  endTime: text("end_time").notNull(), // Format: "HH:mm" (e.g., "10:30")
  title: text("title").notNull(),
  color: scheduleColorEnum("color").notNull().default("blue"),
  location: text("location"), // Optional physical location
  meetingLink: text("meeting_link"), // Optional online meeting link
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Lectures table
export const lectures = pgTable("lectures", {
  lectureId: text("lecture_id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.classId, { onDelete: "cascade" }),
  moduleId: text("module_id").references(() => classModules.moduleId, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'file' or 'youtube'
  url: text("url").notNull(),
  lectureDate: timestamp("lecture_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Class Join Requests
export const classJoinRequests = pgTable(
  "class_join_requests",
  {
    requestId: text("request_id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.classId, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Ensure a student can't have multiple active requests for the same class
    // We might want to allow re-requesting if rejected, but for now let's keep it simple
    // and handle logic in the application layer or allow duplicates if status is different?
    // Actually, a unique constraint here makes sense to prevent spamming.
    // If rejected, they might need to contact teacher or we delete the request to allow new one.
    // Let's just add the table and handle logic in API.
    uniqueStudentClassRequest: unique().on(table.studentId, table.classId),
  })
);

// --- New Tables ---

// Class Modules
export const classModules = pgTable("class_modules", {
  moduleId: text("module_id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.classId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Questions (Question Bank)
export const questions = pgTable("questions", {
  questionId: text("question_id").primaryKey(),
  subject: text("subject"),
  difficultyLevel: text("difficulty_level"),
  questionText: text("question_text").notNull(),
  correctAnswer: text("correct_answer"),
  options: jsonb("options"), // JSON for multiple choice
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Submission Answers
export const submissionAnswers = pgTable("submission_answers", {
  answerId: text("answer_id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.submissionId, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.questionId, { onDelete: "cascade" }),
  studentAnswer: jsonb("student_answer"),
  isCorrect: boolean("is_correct"),
  pointsAwarded: integer("points_awarded"),
});

// Teacher Rates
export const teacherRateTypeEnum = pgEnum("teacher_rate_type", [
  "HOURLY",
  "PER_STUDENT",
  "MONTHLY_FIXED",
]);

export const teacherRates = pgTable("teacher_rates", {
  rateId: text("rate_id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  rateType: teacherRateTypeEnum("rate_type").notNull(),
  amount: integer("amount").notNull(), // Store in cents/smallest currency unit
  effectiveDate: timestamp("effective_date").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Notifications
export const notifications = pgTable("notifications", {
  notificationId: text("notification_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'system', 'grade', 'payment'
  isRead: boolean("is_read").default(false),
  linkUrl: text("link_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  logId: text("log_id").primaryKey(),
  actorUserId: text("actor_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Tuition Billing (monthly billing records per student per class)
export const tuitionBilling = pgTable("tuition_billing", {
  billingId: text("billing_id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.classId, {
    onDelete: "set null",
  }),
  amount: integer("amount").notNull(), // In smallest currency unit (VND)
  billingMonth: text("billing_month").notNull(), // Format: "YYYY-MM" (e.g., "2025-11")
  dueDate: timestamp("due_date").notNull(),
  status: billingStatusEnum("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  paymentMethod: paymentMethodEnum("payment_method"),
  invoiceNumber: text("invoice_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tutor Payments (monthly payment records per teacher)
export const tutorPayments = pgTable("tutor_payments", {
  paymentId: text("payment_id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // In smallest currency unit (VND)
  paymentMonth: text("payment_month").notNull(), // Format: "YYYY-MM" (e.g., "2025-11")
  sessionsCount: integer("sessions_count").default(0),
  studentsCount: integer("students_count").default(0),
  rateId: text("rate_id").references(() => teacherRates.rateId, {
    onDelete: "set null",
  }),
  status: billingStatusEnum("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  paymentMethod: paymentMethodEnum("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
