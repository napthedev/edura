import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
  classes,
  enrollments,
  assignments,
  submissions,
  lectures,
  announcements,
  classSchedules,
  classJoinRequests,
  notifications,
  classModules,
  tuitionBilling,
  tutorPayments,
  teacherRates,
  attendanceLogs,
  studentAttendanceLogs,
  expenseCategories,
  expenses,
  parentConsent,
} from "@edura/db/schema/education";
import { eq, and, sql } from "drizzle-orm";
import { desc, gte, lte, inArray } from "drizzle-orm";
import { user, account } from "@edura/db/schema/auth";
import {
  generateRandomPassword,
  sendWelcomeEmail,
  sendWeeklyPerformanceReport,
  sendMonthlyBillingReport,
  sendUrgentAlert,
} from "../utils/email";
import { getStudentPerformanceData } from "../utils/parent-reports";
import { Scrypt } from "lucia";

// Schedule color type
const scheduleColorSchema = z.enum([
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
  "teal",
]);

// Helper function to check time overlap
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours! * 60 + minutes!;
  };
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
}

// Grading function
function gradeSubmission(
  assignmentContent: string | null,
  submissionContent: string
): number | null {
  if (!assignmentContent) return null;

  try {
    const content = JSON.parse(assignmentContent) as { questions: any[] };
    const answers = JSON.parse(submissionContent) as Record<string, string>;

    const questions = content.questions;
    if (!questions || questions.length === 0) return null;

    let correct = 0;
    for (const question of questions) {
      const studentAnswer = answers[question.id]?.trim().toLowerCase();
      const correctAnswer = question.correctAnswer?.trim().toLowerCase();

      if (studentAnswer === correctAnswer) {
        correct++;
      }
    }

    return Math.round((correct / questions.length) * 100);
  } catch (error) {
    console.error("Error grading submission:", error);
    return null;
  }
}

export const educationRouter = router({
  createClass: protectedProcedure
    .input(
      z.object({
        className: z.string().min(1),
        subject: z.string().optional(),
        schedule: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate a unique classId, perhaps using a UUID or similar
      const classId = crypto.randomUUID();

      // Generate a unique 5-character uppercase class code
      let classCode: string;
      let isUnique = false;
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

      while (!isUnique) {
        classCode = "";
        for (let i = 0; i < 5; i++) {
          classCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if this code already exists
        const existingClass = await ctx.db
          .select()
          .from(classes)
          .where(eq(classes.classCode, classCode));

        if (existingClass.length === 0) {
          isUnique = true;
        }
      }

      const newClass = await ctx.db
        .insert(classes)
        .values({
          classId,
          className: input.className,
          classCode: classCode!,
          subject: input.subject || null,
          schedule: input.schedule || null,
          teacherId: ctx.session.user.id,
        })
        .returning();

      return newClass[0];
    }),
  getClasses: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        classId: classes.classId,
        className: classes.className,
        classCode: classes.classCode,
        subject: classes.subject,
        schedule: classes.schedule,
        createdAt: classes.createdAt,
        studentCount: sql<number>`count(${enrollments.enrollmentId})::int`,
      })
      .from(classes)
      .leftJoin(enrollments, eq(classes.classId, enrollments.classId))
      .where(eq(classes.teacherId, ctx.session.user.id))
      .groupBy(classes.classId);
  }),
  getClassById: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.classId, input.classId));

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      return classData[0];
    }),
  getClassStudents: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select({
          userId: user.id,
          name: user.name,
          email: user.email,
          enrolledAt: enrollments.enrolledAt,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          grade: user.grade,
          schoolName: user.schoolName,
          parentEmail: user.parentEmail,
          parentPhone: user.parentPhone,
        })
        .from(enrollments)
        .innerJoin(user, eq(enrollments.studentId, user.id))
        .where(eq(enrollments.classId, input.classId));
    }),
  getTeacherStudents: protectedProcedure.query(async ({ ctx }) => {
    // Get all students across all classes taught by this teacher
    const students = await ctx.db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        enrolledAt: enrollments.enrolledAt,
        classId: classes.classId,
        className: classes.className,
        classCode: classes.classCode,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        grade: user.grade,
        schoolName: user.schoolName,
        parentEmail: user.parentEmail,
        parentPhone: user.parentPhone,
      })
      .from(classes)
      .innerJoin(enrollments, eq(classes.classId, enrollments.classId))
      .innerJoin(user, eq(enrollments.studentId, user.id))
      .where(eq(classes.teacherId, ctx.session.user.id))
      .orderBy(user.name);

    return students;
  }),
  getTeacherAssignments: protectedProcedure.query(async ({ ctx }) => {
    // Get all assignments across all classes taught by this teacher, sorted by latest to oldest
    const teacherAssignments = await ctx.db
      .select({
        assignmentId: assignments.assignmentId,
        title: assignments.title,
        description: assignments.description,
        assignmentContent: assignments.assignmentContent,
        dueDate: assignments.dueDate,
        testingDuration: assignments.testingDuration,
        createdAt: assignments.createdAt,
        classId: classes.classId,
        className: classes.className,
        submissionCount: sql<number>`count(${submissions.submissionId})`,
      })
      .from(assignments)
      .innerJoin(classes, eq(assignments.classId, classes.classId))
      .leftJoin(
        submissions,
        eq(assignments.assignmentId, submissions.assignmentId)
      )
      .where(eq(classes.teacherId, ctx.session.user.id))
      .groupBy(assignments.assignmentId, classes.classId, classes.className)
      .orderBy(sql`${assignments.createdAt} DESC`);

    return teacherAssignments;
  }),
  getClassAssignments: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get assignments with submission count
      const assignmentsWithCount = await ctx.db
        .select({
          assignmentId: assignments.assignmentId,
          title: assignments.title,
          description: assignments.description,
          assignmentContent: assignments.assignmentContent,
          assignmentType: assignments.assignmentType,
          dueDate: assignments.dueDate,
          testingDuration: assignments.testingDuration,
          createdAt: assignments.createdAt,
          submissionCount: sql<number>`count(${submissions.submissionId})`,
        })
        .from(assignments)
        .leftJoin(
          submissions,
          eq(assignments.assignmentId, submissions.assignmentId)
        )
        .where(eq(assignments.classId, input.classId))
        .groupBy(assignments.assignmentId)
        .orderBy(assignments.createdAt);

      return assignmentsWithCount;
    }),
  renameClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        newName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the class belongs to the teacher
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      await ctx.db
        .update(classes)
        .set({ className: input.newName })
        .where(eq(classes.classId, input.classId));

      return { success: true };
    }),
  updateClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        className: z.string().min(1).optional(),
        subject: z.string().optional(),
        schedule: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the class belongs to the teacher
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      const updateData: {
        className?: string;
        subject?: string | null;
        schedule?: string | null;
      } = {};

      if (input.className !== undefined) {
        updateData.className = input.className;
      }
      if (input.subject !== undefined) {
        updateData.subject = input.subject || null;
      }
      if (input.schedule !== undefined) {
        updateData.schedule = input.schedule || null;
      }

      if (Object.keys(updateData).length > 0) {
        await ctx.db
          .update(classes)
          .set(updateData)
          .where(eq(classes.classId, input.classId));
      }

      return { success: true };
    }),
  deleteClass: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the class belongs to the teacher
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      await ctx.db.delete(classes).where(eq(classes.classId, input.classId));

      return { success: true };
    }),
  joinClass: protectedProcedure
    .input(
      z.object({
        classCode: z.string().length(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the class by code
      const classToJoin = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.classCode, input.classCode.toUpperCase()));

      if (classToJoin.length === 0) {
        throw new Error("Class not found");
      }

      const classData = classToJoin[0]!;

      // Check if student is already enrolled
      const existingEnrollment = await ctx.db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, ctx.session.user.id),
            eq(enrollments.classId, classData.classId)
          )
        );

      if (existingEnrollment.length > 0) {
        throw new Error("Already enrolled in this class");
      }

      // Create enrollment
      const enrollment = await ctx.db
        .insert(enrollments)
        .values({
          enrollmentId: crypto.randomUUID(),
          studentId: ctx.session.user.id,
          classId: classData.classId,
        })
        .returning();

      return { class: classData, enrollment: enrollment[0] };
    }),

  requestJoinClass: protectedProcedure
    .input(
      z.object({
        classCode: z.string().length(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the class by code
      const classToJoin = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.classCode, input.classCode.toUpperCase()));

      if (classToJoin.length === 0) {
        throw new Error("Class not found");
      }

      const classData = classToJoin[0]!;

      // Check if student is already enrolled
      const existingEnrollment = await ctx.db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, ctx.session.user.id),
            eq(enrollments.classId, classData.classId)
          )
        );

      if (existingEnrollment.length > 0) {
        throw new Error("Already enrolled in this class");
      }

      // Check if request already exists
      const existingRequest = await ctx.db
        .select()
        .from(classJoinRequests)
        .where(
          and(
            eq(classJoinRequests.studentId, ctx.session.user.id),
            eq(classJoinRequests.classId, classData.classId)
          )
        );

      if (existingRequest.length > 0) {
        const req = existingRequest[0]!;
        if (req.status === "pending") {
          throw new Error("Request already pending");
        } else if (req.status === "approved") {
          throw new Error("Request already approved (you should be enrolled)");
        }
        // If rejected, we might allow re-requesting by updating the existing request or deleting it.
        // Let's update it to pending.
        await ctx.db
          .update(classJoinRequests)
          .set({ status: "pending", updatedAt: new Date() })
          .where(eq(classJoinRequests.requestId, req.requestId));

        // Notify teacher
        await ctx.db.insert(notifications).values({
          notificationId: crypto.randomUUID(),
          userId: classData.teacherId,
          title: "New Class Join Request",
          message: `${ctx.session.user.name} requested to join ${classData.className}`,
          type: "class_request",
          linkUrl: `/class/teacher/${classData.classId}/requests`,
        });

        return { message: "Request sent" };
      }

      // Create request
      await ctx.db.insert(classJoinRequests).values({
        requestId: crypto.randomUUID(),
        studentId: ctx.session.user.id,
        classId: classData.classId,
        status: "pending",
      });

      // Notify teacher
      await ctx.db.insert(notifications).values({
        notificationId: crypto.randomUUID(),
        userId: classData.teacherId,
        title: "New Class Join Request",
        message: `${ctx.session.user.name} requested to join ${classData.className}`,
        type: "class_request",
        linkUrl: `/class/teacher/${classData.classId}/requests`,
      });

      return { message: "Request sent" };
    }),

  withdrawJoinRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db
        .select()
        .from(classJoinRequests)
        .where(eq(classJoinRequests.requestId, input.requestId));

      if (request.length === 0) {
        throw new Error("Request not found");
      }

      if (request[0]!.studentId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      if (request[0]!.status !== "pending") {
        throw new Error("Cannot withdraw processed request");
      }

      await ctx.db
        .delete(classJoinRequests)
        .where(eq(classJoinRequests.requestId, input.requestId));

      return { message: "Request withdrawn" };
    }),

  getJoinRequests: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify teacher ownership
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.classId, input.classId));

      if (
        classData.length === 0 ||
        classData[0]!.teacherId !== ctx.session.user.id
      ) {
        throw new Error("Unauthorized");
      }

      return await ctx.db
        .select({
          requestId: classJoinRequests.requestId,
          status: classJoinRequests.status,
          createdAt: classJoinRequests.createdAt,
          student: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        })
        .from(classJoinRequests)
        .innerJoin(user, eq(classJoinRequests.studentId, user.id))
        .where(
          and(
            eq(classJoinRequests.classId, input.classId),
            eq(classJoinRequests.status, "pending")
          )
        );
    }),

  getMyJoinRequests: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        requestId: classJoinRequests.requestId,
        status: classJoinRequests.status,
        createdAt: classJoinRequests.createdAt,
        class: {
          id: classes.classId,
          name: classes.className,
          code: classes.classCode,
        },
      })
      .from(classJoinRequests)
      .innerJoin(classes, eq(classJoinRequests.classId, classes.classId))
      .where(eq(classJoinRequests.studentId, ctx.session.user.id))
      .orderBy(classJoinRequests.createdAt);
  }),

  approveJoinRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db
        .select()
        .from(classJoinRequests)
        .where(eq(classJoinRequests.requestId, input.requestId));

      if (request.length === 0) {
        throw new Error("Request not found");
      }

      const req = request[0]!;

      // Verify teacher ownership
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.classId, req.classId));

      if (
        classData.length === 0 ||
        classData[0]!.teacherId !== ctx.session.user.id
      ) {
        throw new Error("Unauthorized");
      }

      if (req.status !== "pending") {
        throw new Error("Request already processed");
      }

      // Create enrollment
      await ctx.db.insert(enrollments).values({
        enrollmentId: crypto.randomUUID(),
        studentId: req.studentId,
        classId: req.classId,
      });

      // Update request status
      await ctx.db
        .update(classJoinRequests)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(classJoinRequests.requestId, input.requestId));

      // Notify student
      await ctx.db.insert(notifications).values({
        notificationId: crypto.randomUUID(),
        userId: req.studentId,
        title: "Class Request Approved",
        message: `Your request to join ${
          classData[0]!.className
        } has been approved.`,
        type: "class_approved",
        linkUrl: `/class/student/${req.classId}`,
      });

      return { message: "Request approved" };
    }),

  rejectJoinRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db
        .select()
        .from(classJoinRequests)
        .where(eq(classJoinRequests.requestId, input.requestId));

      if (request.length === 0) {
        throw new Error("Request not found");
      }

      const req = request[0]!;

      // Verify teacher ownership
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.classId, req.classId));

      if (
        classData.length === 0 ||
        classData[0]!.teacherId !== ctx.session.user.id
      ) {
        throw new Error("Unauthorized");
      }

      if (req.status !== "pending") {
        throw new Error("Request already processed");
      }

      // Update request status
      await ctx.db
        .update(classJoinRequests)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(classJoinRequests.requestId, input.requestId));

      // Notify student
      await ctx.db.insert(notifications).values({
        notificationId: crypto.randomUUID(),
        userId: req.studentId,
        title: "Class Request Rejected",
        message: `Your request to join ${
          classData[0]!.className
        } has been rejected.`,
        type: "class_rejected",
        linkUrl: `/dashboard/student`,
      });

      return { message: "Request rejected" };
    }),

  getStudentClasses: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        classId: classes.classId,
        className: classes.className,
        classCode: classes.classCode,
        subject: classes.subject,
        schedule: classes.schedule,
        teacherName: user.name,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.classId))
      .innerJoin(user, eq(classes.teacherId, user.id))
      .where(eq(enrollments.studentId, ctx.session.user.id))
      .orderBy(enrollments.enrolledAt);
  }),

  leaveClass: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(enrollments)
        .where(
          and(
            eq(enrollments.classId, input.classId),
            eq(enrollments.studentId, ctx.session.user.id)
          )
        );
      return { success: true };
    }),

  getClassTeacher: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          schoolName: user.schoolName,
        })
        .from(classes)
        .innerJoin(user, eq(classes.teacherId, user.id))
        .where(eq(classes.classId, input.classId));

      if (teacher.length === 0) {
        throw new Error("Teacher not found");
      }

      return teacher[0];
    }),

  createAssignment: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        moduleId: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        testingDuration: z.number().min(1).optional(),
        assignmentType: z.enum(["quiz", "written"]).default("quiz"),
        assignmentContent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the class belongs to the teacher
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      const assignmentId = crypto.randomUUID();

      const newAssignment = await ctx.db
        .insert(assignments)
        .values({
          assignmentId,
          classId: input.classId,
          moduleId: input.moduleId,
          title: input.title,
          description: input.description,
          assignmentType: input.assignmentType,
          assignmentContent: input.assignmentContent,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          testingDuration:
            input.assignmentType === "quiz" ? input.testingDuration : null,
        })
        .returning();

      return newAssignment[0];
    }),
  getAssignment: protectedProcedure
    .input(z.object({ assignmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assignment = await ctx.db
        .select()
        .from(assignments)
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .where(
          and(
            eq(assignments.assignmentId, input.assignmentId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (assignment.length === 0) {
        throw new Error("Assignment not found or access denied");
      }

      return assignment[0];
    }),
  updateAssignment: protectedProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        moduleId: z.string().nullable().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        assignmentType: z.enum(["quiz", "written"]).optional(),
        assignmentContent: z.string().optional(),
        testingDuration: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the assignment belongs to the teacher
      const assignmentData = await ctx.db
        .select()
        .from(assignments)
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .where(
          and(
            eq(assignments.assignmentId, input.assignmentId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (assignmentData.length === 0) {
        throw new Error("Assignment not found or access denied");
      }

      const updateData: any = {};
      if (input.moduleId !== undefined) updateData.moduleId = input.moduleId;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.dueDate !== undefined)
        updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
      if (input.assignmentType !== undefined)
        updateData.assignmentType = input.assignmentType;
      if (input.assignmentContent !== undefined)
        updateData.assignmentContent = input.assignmentContent;
      if (input.testingDuration !== undefined)
        updateData.testingDuration = input.testingDuration;

      await ctx.db
        .update(assignments)
        .set(updateData)
        .where(eq(assignments.assignmentId, input.assignmentId));

      return { success: true };
    }),
  deleteAssignment: protectedProcedure
    .input(z.object({ assignmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the assignment belongs to the teacher
      const assignmentData = await ctx.db
        .select()
        .from(assignments)
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .where(
          and(
            eq(assignments.assignmentId, input.assignmentId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (assignmentData.length === 0) {
        throw new Error("Assignment not found or access denied");
      }

      await ctx.db
        .delete(assignments)
        .where(eq(assignments.assignmentId, input.assignmentId));

      return { success: true };
    }),
  getStudentAssignment: protectedProcedure
    .input(z.object({ assignmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is a student
      if (ctx.session.user.role !== "student") {
        throw new Error("Access denied: Only students can access assignments");
      }

      // Get assignment and check if student is enrolled in the class
      const assignmentData = await ctx.db
        .select({
          assignment: assignments,
          class: classes,
        })
        .from(assignments)
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .innerJoin(enrollments, eq(classes.classId, enrollments.classId))
        .where(
          and(
            eq(assignments.assignmentId, input.assignmentId),
            eq(enrollments.studentId, ctx.session.user.id)
          )
        );

      if (assignmentData.length === 0) {
        throw new Error("Assignment not found or access denied");
      }

      return assignmentData[0];
    }),
  submitAssignment: protectedProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        submissionContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is a student
      if (ctx.session.user.role !== "student") {
        throw new Error("Access denied: Only students can submit assignments");
      }

      // Check if student is enrolled and assignment exists
      const assignmentData = await ctx.db
        .select({
          assignment: assignments,
          class: classes,
        })
        .from(assignments)
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .innerJoin(enrollments, eq(classes.classId, enrollments.classId))
        .where(
          and(
            eq(assignments.assignmentId, input.assignmentId),
            eq(enrollments.studentId, ctx.session.user.id)
          )
        );

      if (assignmentData.length === 0) {
        throw new Error("Assignment not found or access denied");
      }

      // Check if student has already submitted
      const existingSubmission = await ctx.db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.assignmentId, input.assignmentId),
            eq(submissions.studentId, ctx.session.user.id)
          )
        );

      if (existingSubmission.length > 0) {
        throw new Error("You have already submitted this assignment");
      }

      // Calculate grade - only auto-grade quiz assignments
      const assignment = assignmentData[0]!.assignment;
      const isWrittenAssignment = assignment.assignmentType === "written";
      const grade = isWrittenAssignment
        ? null // Written assignments require manual grading
        : gradeSubmission(
            assignment.assignmentContent,
            input.submissionContent
          );

      // Create submission
      const submission = await ctx.db
        .insert(submissions)
        .values({
          submissionId: crypto.randomUUID(),
          assignmentId: input.assignmentId,
          studentId: ctx.session.user.id,
          submissionContent: input.submissionContent,
          grade: grade,
        })
        .returning();

      return submission[0];
    }),
  createLecture: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        moduleId: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["file", "youtube"]),
        url: z.string().url(),
        lectureDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the class belongs to the teacher
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      const lectureId = crypto.randomUUID();

      const newLecture = await ctx.db
        .insert(lectures)
        .values({
          lectureId,
          classId: input.classId,
          moduleId: input.moduleId,
          title: input.title,
          description: input.description,
          type: input.type,
          url: input.url,
          lectureDate: new Date(input.lectureDate),
        })
        .returning();

      return newLecture[0];
    }),
  getClassLectures: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(lectures)
        .where(eq(lectures.classId, input.classId))
        .orderBy(lectures.createdAt);
    }),
  getLecture: protectedProcedure
    .input(z.object({ lectureId: z.string() }))
    .query(async ({ ctx, input }) => {
      const lecture = await ctx.db
        .select({
          lecture: lectures,
          class: classes,
        })
        .from(lectures)
        .innerJoin(classes, eq(lectures.classId, classes.classId))
        .where(eq(lectures.lectureId, input.lectureId));

      if (lecture.length === 0) {
        throw new Error("Lecture not found");
      }

      // Check if user is the teacher or enrolled student
      const lectureData = lecture[0];
      if (
        // @ts-ignore
        lectureData.class.teacherId !== ctx.session.user.id &&
        ctx.session.user.role === "student"
      ) {
        // Check if student is enrolled
        const enrollment = await ctx.db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.studentId, ctx.session.user.id),
              // @ts-ignore
              eq(enrollments.classId, lectureData.class.classId)
            )
          );

        if (enrollment.length === 0) {
          throw new Error("Access denied");
        }
      }

      return lectureData;
    }),
  updateLecture: protectedProcedure
    .input(
      z.object({
        lectureId: z.string(),
        moduleId: z.string().nullable().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.enum(["file", "youtube"]).optional(),
        url: z.string().url().optional(),
        lectureDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the lecture belongs to the teacher
      const lectureData = await ctx.db
        .select()
        .from(lectures)
        .innerJoin(classes, eq(lectures.classId, classes.classId))
        .where(
          and(
            eq(lectures.lectureId, input.lectureId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (lectureData.length === 0) {
        throw new Error("Lecture not found or access denied");
      }

      const updateData: any = {};
      if (input.moduleId !== undefined) updateData.moduleId = input.moduleId;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.url !== undefined) updateData.url = input.url;
      if (input.lectureDate !== undefined)
        updateData.lectureDate = new Date(input.lectureDate);

      await ctx.db
        .update(lectures)
        .set(updateData)
        .where(eq(lectures.lectureId, input.lectureId));

      return { success: true };
    }),
  deleteLecture: protectedProcedure
    .input(z.object({ lectureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the lecture belongs to the teacher
      const lectureData = await ctx.db
        .select()
        .from(lectures)
        .innerJoin(classes, eq(lectures.classId, classes.classId))
        .where(
          and(
            eq(lectures.lectureId, input.lectureId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (lectureData.length === 0) {
        throw new Error("Lecture not found or access denied");
      }

      await ctx.db
        .delete(lectures)
        .where(eq(lectures.lectureId, input.lectureId));

      return { success: true };
    }),
  createAnnouncement: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        title: z.string().min(1),
        content: z.string().optional(),
        attachedImage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the class belongs to the teacher
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      const announcementId = crypto.randomUUID();

      const newAnnouncement = await ctx.db
        .insert(announcements)
        .values({
          announcementId,
          classId: input.classId,
          title: input.title,
          content: input.content,
          attachedImage: input.attachedImage,
          createdBy: ctx.session.user.id,
        })
        .returning();

      return newAnnouncement[0];
    }),
  getClassAnnouncements: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is the teacher or enrolled student
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.classId, input.classId));

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      const classInfo = classData[0]!;

      // If user is not the teacher, check if they are enrolled
      if (classInfo.teacherId !== ctx.session.user.id) {
        const enrollment = await ctx.db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.studentId, ctx.session.user.id),
              eq(enrollments.classId, input.classId)
            )
          );

        if (enrollment.length === 0) {
          throw new Error("Access denied");
        }
      }

      return await ctx.db
        .select({
          announcement: announcements,
          creator: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
        })
        .from(announcements)
        .innerJoin(user, eq(announcements.createdBy, user.id))
        .where(eq(announcements.classId, input.classId))
        .orderBy(announcements.createdAt);
    }),
  updateAnnouncement: protectedProcedure
    .input(
      z.object({
        announcementId: z.string(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        attachedImage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the announcement belongs to the teacher
      const announcementData = await ctx.db
        .select()
        .from(announcements)
        .innerJoin(classes, eq(announcements.classId, classes.classId))
        .where(
          and(
            eq(announcements.announcementId, input.announcementId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (announcementData.length === 0) {
        throw new Error("Announcement not found or access denied");
      }

      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.attachedImage !== undefined)
        updateData.attachedImage = input.attachedImage;

      await ctx.db
        .update(announcements)
        .set(updateData)
        .where(eq(announcements.announcementId, input.announcementId));

      return { success: true };
    }),
  deleteAnnouncement: protectedProcedure
    .input(z.object({ announcementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the announcement belongs to the teacher
      const announcementData = await ctx.db
        .select()
        .from(announcements)
        .innerJoin(classes, eq(announcements.classId, classes.classId))
        .where(
          and(
            eq(announcements.announcementId, input.announcementId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (announcementData.length === 0) {
        throw new Error("Announcement not found or access denied");
      }

      await ctx.db
        .delete(announcements)
        .where(eq(announcements.announcementId, input.announcementId));

      return { success: true };
    }),
  createSchedule: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm format
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm format
        title: z.string().min(1),
        color: scheduleColorSchema.default("blue"),
        location: z.string().optional(),
        meetingLink: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the class belongs to the teacher
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      // Validate that endTime is after startTime
      if (input.startTime >= input.endTime) {
        throw new Error("End time must be after start time");
      }

      // Check for overlapping schedules on the same day
      const existingSchedules = await ctx.db
        .select()
        .from(classSchedules)
        .where(
          and(
            eq(classSchedules.classId, input.classId),
            eq(classSchedules.dayOfWeek, input.dayOfWeek)
          )
        );

      const hasOverlap = existingSchedules.some((schedule) =>
        timesOverlap(
          input.startTime,
          input.endTime,
          schedule.startTime,
          schedule.endTime
        )
      );

      const scheduleId = crypto.randomUUID();

      const newSchedule = await ctx.db
        .insert(classSchedules)
        .values({
          scheduleId,
          classId: input.classId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          title: input.title,
          color: input.color,
          location: input.location,
          meetingLink: input.meetingLink,
        })
        .returning();

      return { schedule: newSchedule[0], hasOverlap };
    }),
  getClassSchedules: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is the teacher or enrolled student
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.classId, input.classId));

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      const classInfo = classData[0]!;

      // If user is not the teacher, check if they are enrolled
      if (classInfo.teacherId !== ctx.session.user.id) {
        const enrollment = await ctx.db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.studentId, ctx.session.user.id),
              eq(enrollments.classId, input.classId)
            )
          );

        if (enrollment.length === 0) {
          throw new Error("Access denied");
        }
      }

      return await ctx.db
        .select()
        .from(classSchedules)
        .where(eq(classSchedules.classId, input.classId))
        .orderBy(classSchedules.dayOfWeek, classSchedules.startTime);
    }),
  updateSchedule: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        startTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .optional(),
        endTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .optional(),
        title: z.string().min(1).optional(),
        color: scheduleColorSchema.optional(),
        location: z.string().optional().nullable(),
        meetingLink: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the schedule belongs to the teacher
      const scheduleData = await ctx.db
        .select()
        .from(classSchedules)
        .innerJoin(classes, eq(classSchedules.classId, classes.classId))
        .where(
          and(
            eq(classSchedules.scheduleId, input.scheduleId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (scheduleData.length === 0) {
        throw new Error("Schedule not found or access denied");
      }

      const existingSchedule = scheduleData[0]!.class_schedules;

      // Build update data
      const updateData: Partial<typeof classSchedules.$inferInsert> = {};
      if (input.dayOfWeek !== undefined) updateData.dayOfWeek = input.dayOfWeek;
      if (input.startTime !== undefined) updateData.startTime = input.startTime;
      if (input.endTime !== undefined) updateData.endTime = input.endTime;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.location !== undefined)
        updateData.location = input.location ?? undefined;
      if (input.meetingLink !== undefined)
        updateData.meetingLink = input.meetingLink ?? undefined;

      // Validate time order if both times are being updated or one is provided
      const finalStartTime = input.startTime ?? existingSchedule.startTime;
      const finalEndTime = input.endTime ?? existingSchedule.endTime;
      if (finalStartTime >= finalEndTime) {
        throw new Error("End time must be after start time");
      }

      // Check for overlaps on the target day
      const targetDay = input.dayOfWeek ?? existingSchedule.dayOfWeek;
      const existingSchedules = await ctx.db
        .select()
        .from(classSchedules)
        .where(
          and(
            eq(classSchedules.classId, existingSchedule.classId),
            eq(classSchedules.dayOfWeek, targetDay)
          )
        );

      const hasOverlap = existingSchedules.some(
        (schedule) =>
          schedule.scheduleId !== input.scheduleId &&
          timesOverlap(
            finalStartTime,
            finalEndTime,
            schedule.startTime,
            schedule.endTime
          )
      );

      await ctx.db
        .update(classSchedules)
        .set(updateData)
        .where(eq(classSchedules.scheduleId, input.scheduleId));

      return { success: true, hasOverlap };
    }),
  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the schedule belongs to the teacher
      const scheduleData = await ctx.db
        .select()
        .from(classSchedules)
        .innerJoin(classes, eq(classSchedules.classId, classes.classId))
        .where(
          and(
            eq(classSchedules.scheduleId, input.scheduleId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (scheduleData.length === 0) {
        throw new Error("Schedule not found or access denied");
      }

      await ctx.db
        .delete(classSchedules)
        .where(eq(classSchedules.scheduleId, input.scheduleId));

      return { success: true };
    }),
  getAllTeacherSchedules: protectedProcedure.query(async ({ ctx }) => {
    // Fetch all weekly schedules for classes owned by the teacher
    return await ctx.db
      .select()
      .from(classSchedules)
      .innerJoin(classes, eq(classSchedules.classId, classes.classId))
      .where(eq(classes.teacherId, ctx.session.user.id))
      .orderBy(classSchedules.dayOfWeek, classSchedules.startTime);
  }),
  getStudentSchedules: protectedProcedure.query(async ({ ctx }) => {
    // Fetch all weekly schedules for classes the student is enrolled in
    return await ctx.db
      .select()
      .from(classSchedules)
      .innerJoin(classes, eq(classSchedules.classId, classes.classId))
      .innerJoin(
        enrollments,
        and(
          eq(enrollments.classId, classes.classId),
          eq(enrollments.studentId, ctx.session.user.id)
        )
      )
      .orderBy(classSchedules.dayOfWeek, classSchedules.startTime);
  }),
  getTeachingHoursStats: protectedProcedure.query(async ({ ctx }) => {
    // Helper to convert "HH:mm" to minutes
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours! * 60 + minutes!;
    };

    // Fetch all schedules for teacher's classes
    const schedules = await ctx.db
      .select({
        classId: classes.classId,
        className: classes.className,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
      })
      .from(classSchedules)
      .innerJoin(classes, eq(classSchedules.classId, classes.classId))
      .where(eq(classes.teacherId, ctx.session.user.id));

    // Calculate hours per class
    const classHoursMap = new Map<
      string,
      { classId: string; className: string; hours: number }
    >();

    for (const schedule of schedules) {
      const durationMinutes =
        toMinutes(schedule.endTime) - toMinutes(schedule.startTime);
      const durationHours = durationMinutes / 60;

      const existing = classHoursMap.get(schedule.classId);
      if (existing) {
        existing.hours += durationHours;
      } else {
        classHoursMap.set(schedule.classId, {
          classId: schedule.classId,
          className: schedule.className,
          hours: durationHours,
        });
      }
    }

    const perClass = Array.from(classHoursMap.values()).sort(
      (a, b) => b.hours - a.hours
    );
    const totalWeeklyHours = perClass.reduce((sum, c) => sum + c.hours, 0);

    return {
      totalWeeklyHours,
      monthlyHoursEstimate: totalWeeklyHours * 4,
      perClass,
    };
  }),
  generateQuestionsFromDocument: protectedProcedure
    .input(
      z.object({
        questions: z.array(
          z.object({
            id: z.string(),
            index: z.number(),
            type: z.enum(["simple", "multiple", "truefalse"]),
            statement: z.string(),
            options: z.array(z.string()).optional(),
            correctAnswer: z.string(),
            explanation: z.string().optional(),
          })
        ),
        classId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        testingDuration: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the class belongs to the teacher
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      const assignmentId = crypto.randomUUID();

      const newAssignment = await ctx.db
        .insert(assignments)
        .values({
          assignmentId,
          classId: input.classId,
          title: input.title || "AI Generated Assignment",
          description: input.description,
          assignmentContent: JSON.stringify({ questions: input.questions }),
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          testingDuration: input.testingDuration,
        })
        .returning();

      return newAssignment[0];
    }),
  getStudentAssignmentStatuses: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is a student
      if (ctx.session.user.role !== "student") {
        throw new Error(
          "Access denied: Only students can access assignment statuses"
        );
      }

      // Check if student is enrolled in the class
      const enrollment = await ctx.db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, ctx.session.user.id),
            eq(enrollments.classId, input.classId)
          )
        );

      if (enrollment.length === 0) {
        throw new Error("Not enrolled in this class");
      }

      // Get assignments with submission status
      const assignmentsWithStatus = await ctx.db
        .select({
          assignmentId: assignments.assignmentId,
          title: assignments.title,
          description: assignments.description,
          dueDate: assignments.dueDate,
          createdAt: assignments.createdAt,
          submitted: submissions.submissionId,
          submittedAt: submissions.submittedAt,
        })
        .from(assignments)
        .leftJoin(
          submissions,
          and(
            eq(submissions.assignmentId, assignments.assignmentId),
            eq(submissions.studentId, ctx.session.user.id)
          )
        )
        .where(eq(assignments.classId, input.classId))
        .orderBy(assignments.createdAt);

      return assignmentsWithStatus.map((item) => ({
        ...item,
        submitted: !!item.submitted,
      }));
    }),
  getStudentSubmission: protectedProcedure
    .input(z.object({ assignmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is a student
      if (ctx.session.user.role !== "student") {
        throw new Error(
          "Access denied: Only students can view their submissions"
        );
      }

      // Get submission with assignment and class details
      const submissionData = await ctx.db
        .select({
          submission: submissions,
          assignment: assignments,
          class: classes,
        })
        .from(submissions)
        .innerJoin(
          assignments,
          eq(submissions.assignmentId, assignments.assignmentId)
        )
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .innerJoin(enrollments, eq(classes.classId, enrollments.classId))
        .where(
          and(
            eq(submissions.assignmentId, input.assignmentId),
            eq(submissions.studentId, ctx.session.user.id),
            eq(enrollments.studentId, ctx.session.user.id)
          )
        );

      if (submissionData.length === 0) {
        throw new Error("Submission not found or access denied");
      }

      return submissionData[0];
    }),
  getAssignmentSubmissions: protectedProcedure
    .input(z.object({ assignmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if the assignment belongs to the teacher
      const assignmentData = await ctx.db
        .select()
        .from(assignments)
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .where(
          and(
            eq(assignments.assignmentId, input.assignmentId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (assignmentData.length === 0) {
        throw new Error("Assignment not found or access denied");
      }

      // Get all submissions with student details
      const submissionsData = await ctx.db
        .select({
          submissionId: submissions.submissionId,
          submissionContent: submissions.submissionContent,
          submittedAt: submissions.submittedAt,
          grade: submissions.grade,
          student: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
        .from(submissions)
        .innerJoin(user, eq(submissions.studentId, user.id))
        .where(eq(submissions.assignmentId, input.assignmentId))
        .orderBy(submissions.submittedAt);

      return submissionsData;
    }),
  getSubmissionById: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get submission with assignment and class details
      const submissionData = await ctx.db
        .select({
          submission: submissions,
          assignment: assignments,
          class: classes,
          student: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
        .from(submissions)
        .innerJoin(
          assignments,
          eq(submissions.assignmentId, assignments.assignmentId)
        )
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .innerJoin(user, eq(submissions.studentId, user.id))
        .where(eq(submissions.submissionId, input.submissionId));

      if (submissionData.length === 0) {
        throw new Error("Submission not found");
      }

      const data = submissionData[0]!;

      // Check if user is the teacher of the class
      if (data.class.teacherId !== ctx.session.user.id) {
        throw new Error(
          "Access denied: Only the class teacher can view submissions"
        );
      }

      return data;
    }),
  getStudentAssignments: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is a student
    if (ctx.session.user.role !== "student") {
      throw new Error(
        "Access denied: Only students can access their assignments"
      );
    }

    // Get all assignments from classes the student is enrolled in
    const studentAssignments = await ctx.db
      .select({
        assignmentId: assignments.assignmentId,
        title: assignments.title,
        description: assignments.description,
        dueDate: assignments.dueDate,
        createdAt: assignments.createdAt,
        classId: classes.classId,
        className: classes.className,
        submitted: submissions.submissionId,
        submittedAt: submissions.submittedAt,
        grade: submissions.grade,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.classId))
      .innerJoin(assignments, eq(classes.classId, assignments.classId))
      .leftJoin(
        submissions,
        and(
          eq(submissions.assignmentId, assignments.assignmentId),
          eq(submissions.studentId, ctx.session.user.id)
        )
      )
      .where(eq(enrollments.studentId, ctx.session.user.id))
      .orderBy(assignments.dueDate, assignments.createdAt);

    return studentAssignments.map((item) => ({
      ...item,
      submitted: !!item.submitted,
    }));
  }),

  // --- Modules ---

  createModule: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if teacher owns the class
      const classData = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (classData.length === 0) {
        throw new Error("Class not found or access denied");
      }

      // Get max order index
      const maxOrder = await ctx.db
        .select({ maxOrder: sql<number>`max(${classModules.orderIndex})` })
        .from(classModules)
        .where(eq(classModules.classId, input.classId));

      const nextOrder = (maxOrder[0]?.maxOrder ?? -1) + 1;

      const moduleId = crypto.randomUUID();

      const newModule = await ctx.db
        .insert(classModules)
        .values({
          moduleId,
          classId: input.classId,
          title: input.title,
          description: input.description,
          orderIndex: nextOrder,
        })
        .returning();

      return newModule[0];
    }),

  updateModule: protectedProcedure
    .input(
      z.object({
        moduleId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        orderIndex: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership via class
      const moduleData = await ctx.db
        .select({
          moduleId: classModules.moduleId,
          teacherId: classes.teacherId,
        })
        .from(classModules)
        .innerJoin(classes, eq(classModules.classId, classes.classId))
        .where(eq(classModules.moduleId, input.moduleId));

      if (
        moduleData.length === 0 ||
        moduleData[0]?.teacherId !== ctx.session.user.id
      ) {
        throw new Error("Module not found or access denied");
      }

      const updatedModule = await ctx.db
        .update(classModules)
        .set({
          title: input.title,
          description: input.description,
          orderIndex: input.orderIndex,
        })
        .where(eq(classModules.moduleId, input.moduleId))
        .returning();

      return updatedModule[0];
    }),

  deleteModule: protectedProcedure
    .input(z.object({ moduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const moduleData = await ctx.db
        .select({
          moduleId: classModules.moduleId,
          teacherId: classes.teacherId,
        })
        .from(classModules)
        .innerJoin(classes, eq(classModules.classId, classes.classId))
        .where(eq(classModules.moduleId, input.moduleId));

      if (
        moduleData.length === 0 ||
        moduleData[0]?.teacherId !== ctx.session.user.id
      ) {
        throw new Error("Module not found or access denied");
      }

      await ctx.db
        .delete(classModules)
        .where(eq(classModules.moduleId, input.moduleId));

      return { success: true };
    }),

  getClassModules: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check access (teacher or student enrolled)
      const isTeacher = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (isTeacher.length === 0) {
        const isStudent = await ctx.db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.classId, input.classId),
              eq(enrollments.studentId, ctx.session.user.id)
            )
          );

        if (isStudent.length === 0) {
          throw new Error("Access denied");
        }
      }

      const modules = await ctx.db
        .select()
        .from(classModules)
        .where(eq(classModules.classId, input.classId))
        .orderBy(classModules.orderIndex);

      const modulesWithContent = await Promise.all(
        modules.map(async (module) => {
          const moduleAssignments = await ctx.db
            .select()
            .from(assignments)
            .where(eq(assignments.moduleId, module.moduleId));

          const moduleLectures = await ctx.db
            .select()
            .from(lectures)
            .where(eq(lectures.moduleId, module.moduleId));

          return {
            ...module,
            assignments: moduleAssignments,
            lectures: moduleLectures,
          };
        })
      );

      return modulesWithContent;
    }),

  getUnassignedContent: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check access
      const isTeacher = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.classId, input.classId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (isTeacher.length === 0) {
        const isStudent = await ctx.db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.classId, input.classId),
              eq(enrollments.studentId, ctx.session.user.id)
            )
          );

        if (isStudent.length === 0) {
          throw new Error("Access denied");
        }
      }

      const unassignedAssignments = await ctx.db
        .select()
        .from(assignments)
        .where(
          and(
            eq(assignments.classId, input.classId),
            sql`${assignments.moduleId} IS NULL`
          )
        );

      const unassignedLectures = await ctx.db
        .select()
        .from(lectures)
        .where(
          and(
            eq(lectures.classId, input.classId),
            sql`${lectures.moduleId} IS NULL`
          )
        );

      return {
        assignments: unassignedAssignments,
        lectures: unassignedLectures,
      };
    }),

  // Manager endpoints - get all teachers with extended profile (scoped to manager)
  getAllTeachers: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is a manager
    if (ctx.session.user.role !== "manager") {
      throw new Error("Access denied - manager only");
    }

    const teachers = await ctx.db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        schoolName: user.schoolName,
        createdAt: user.createdAt,
        generatedPassword: user.generatedPassword,
        hasChangedPassword: user.hasChangedPassword,
      })
      .from(user)
      .where(
        and(eq(user.role, "teacher"), eq(user.managerId, ctx.session.user.id))
      )
      .orderBy(user.name);

    return teachers;
  }),

  // Manager endpoints - get all students with extended profile (scoped to manager)
  getAllStudents: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is a manager
    if (ctx.session.user.role !== "manager") {
      throw new Error("Access denied - manager only");
    }

    const students = await ctx.db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        grade: user.grade,
        schoolName: user.schoolName,
        parentEmail: user.parentEmail,
        parentPhone: user.parentPhone,
        createdAt: user.createdAt,
        generatedPassword: user.generatedPassword,
        hasChangedPassword: user.hasChangedPassword,
      })
      .from(user)
      .where(
        and(eq(user.role, "student"), eq(user.managerId, ctx.session.user.id))
      )
      .orderBy(user.name);

    return students;
  }),

  // Update student parent contact info (manager can update any student under them, teacher can update enrolled students)
  updateStudentParentContact: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        parentEmail: z.string().email().nullable().optional(),
        parentPhone: z
          .string()
          .regex(/^[+]?[\d\s()-]{7,20}$/, "Invalid phone number format")
          .nullable()
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;

      if (userRole !== "manager" && userRole !== "teacher") {
        throw new Error("Access denied - manager or teacher only");
      }

      // Verify the student exists and is a student
      const studentData = await ctx.db
        .select({
          id: user.id,
          role: user.role,
          managerId: user.managerId,
        })
        .from(user)
        .where(eq(user.id, input.studentId))
        .limit(1);

      if (studentData.length === 0 || studentData[0]!.role !== "student") {
        throw new Error("Student not found");
      }

      // Manager can update any student under them
      if (userRole === "manager") {
        if (studentData[0]!.managerId !== ctx.session.user.id) {
          throw new Error("Access denied - student not under this manager");
        }
      }

      // Teacher can only update students enrolled in their classes
      if (userRole === "teacher") {
        const enrollment = await ctx.db
          .select({ enrollmentId: enrollments.enrollmentId })
          .from(enrollments)
          .innerJoin(classes, eq(enrollments.classId, classes.classId))
          .where(
            and(
              eq(enrollments.studentId, input.studentId),
              eq(classes.teacherId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (enrollment.length === 0) {
          throw new Error(
            "Access denied - student not enrolled in any of your classes"
          );
        }
      }

      // Update the student's parent contact info
      const updateData: {
        parentEmail?: string | null;
        parentPhone?: string | null;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (input.parentEmail !== undefined) {
        updateData.parentEmail = input.parentEmail;
      }
      if (input.parentPhone !== undefined) {
        updateData.parentPhone = input.parentPhone;
      }

      await ctx.db
        .update(user)
        .set(updateData)
        .where(eq(user.id, input.studentId));

      return { success: true };
    }),

  // =====================
  // TUITION BILLING
  // =====================

  // Get all tuition billings with filters (manager only, scoped to manager's students)
  getTuitionBillings: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        billingMonth: z.string().optional(), // Format: "YYYY-MM"
        classId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Filter by students belonging to this manager
      const conditions = [eq(user.managerId, ctx.session.user.id)];

      if (input.status) {
        conditions.push(eq(tuitionBilling.status, input.status));
      }
      if (input.billingMonth) {
        conditions.push(eq(tuitionBilling.billingMonth, input.billingMonth));
      }
      if (input.classId) {
        conditions.push(eq(tuitionBilling.classId, input.classId));
      }

      const billings = await ctx.db
        .select({
          billingId: tuitionBilling.billingId,
          studentId: tuitionBilling.studentId,
          studentName: user.name,
          studentEmail: user.email,
          classId: tuitionBilling.classId,
          className: classes.className,
          amount: tuitionBilling.amount,
          billingMonth: tuitionBilling.billingMonth,
          dueDate: tuitionBilling.dueDate,
          status: tuitionBilling.status,
          paidAt: tuitionBilling.paidAt,
          paymentMethod: tuitionBilling.paymentMethod,
          invoiceNumber: tuitionBilling.invoiceNumber,
          notes: tuitionBilling.notes,
          createdAt: tuitionBilling.createdAt,
        })
        .from(tuitionBilling)
        .innerJoin(user, eq(tuitionBilling.studentId, user.id))
        .leftJoin(classes, eq(tuitionBilling.classId, classes.classId))
        .where(and(...conditions))
        .orderBy(desc(tuitionBilling.createdAt));

      return billings;
    }),

  // Create monthly billing for all enrolled students (manager only)
  createMonthlyBilling: protectedProcedure
    .input(
      z.object({
        billingMonth: z.string(), // Format: "YYYY-MM"
        dueDate: z.string(), // ISO date string
        classIds: z.array(z.string()).optional(), // Optional: specific classes only
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Get all enrollments with class tuition rates
      let enrollmentQuery = ctx.db
        .select({
          enrollmentId: enrollments.enrollmentId,
          studentId: enrollments.studentId,
          classId: enrollments.classId,
          tuitionRate: classes.tuitionRate,
        })
        .from(enrollments)
        .innerJoin(classes, eq(enrollments.classId, classes.classId));

      if (input.classIds && input.classIds.length > 0) {
        enrollmentQuery = enrollmentQuery.where(
          inArray(enrollments.classId, input.classIds)
        ) as typeof enrollmentQuery;
      }

      const enrollmentData = await enrollmentQuery;

      // Filter out enrollments where class has no tuition rate
      const validEnrollments = enrollmentData.filter(
        (e) => e.tuitionRate !== null
      );

      if (validEnrollments.length === 0) {
        throw new Error("No valid enrollments found with tuition rates set");
      }

      // Check for existing billings for this month to avoid duplicates
      const existingBillings = await ctx.db
        .select({
          studentId: tuitionBilling.studentId,
          classId: tuitionBilling.classId,
        })
        .from(tuitionBilling)
        .where(eq(tuitionBilling.billingMonth, input.billingMonth));

      const existingSet = new Set(
        existingBillings.map((b) => `${b.studentId}-${b.classId}`)
      );

      // Create billing records for new enrollments only
      const newBillings = validEnrollments
        .filter((e) => !existingSet.has(`${e.studentId}-${e.classId}`))
        .map((enrollment) => ({
          billingId: crypto.randomUUID(),
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          amount: enrollment.tuitionRate!,
          billingMonth: input.billingMonth,
          dueDate: new Date(input.dueDate),
          status: "pending" as const,
          invoiceNumber: `INV-${input.billingMonth.replace("-", "")}-${crypto
            .randomUUID()
            .slice(0, 8)
            .toUpperCase()}`,
        }));

      if (newBillings.length === 0) {
        return { created: 0, skipped: validEnrollments.length };
      }

      await ctx.db.insert(tuitionBilling).values(newBillings);

      return {
        created: newBillings.length,
        skipped: validEnrollments.length - newBillings.length,
      };
    }),

  // Update billing status (manager only)
  updateBillingStatus: protectedProcedure
    .input(
      z.object({
        billingId: z.string(),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]),
        paymentMethod: z
          .enum(["cash", "bank_transfer", "momo", "vnpay"])
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const updateData: {
        status: "pending" | "paid" | "overdue" | "cancelled";
        paidAt?: Date | null;
        paymentMethod?: "cash" | "bank_transfer" | "momo" | "vnpay" | null;
        notes?: string | null;
      } = {
        status: input.status,
      };

      if (input.status === "paid") {
        updateData.paidAt = new Date();
        if (input.paymentMethod) {
          updateData.paymentMethod = input.paymentMethod;
        }
      } else {
        updateData.paidAt = null;
        updateData.paymentMethod = null;
      }

      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }

      await ctx.db
        .update(tuitionBilling)
        .set(updateData)
        .where(eq(tuitionBilling.billingId, input.billingId));

      return { success: true };
    }),

  // Get single billing for invoice view (manager only)
  getBillingInvoice: protectedProcedure
    .input(z.object({ billingId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const billing = await ctx.db
        .select({
          billingId: tuitionBilling.billingId,
          studentId: tuitionBilling.studentId,
          studentName: user.name,
          studentEmail: user.email,
          classId: tuitionBilling.classId,
          className: classes.className,
          classCode: classes.classCode,
          subject: classes.subject,
          teacherName: sql<string>`(SELECT name FROM "user" WHERE id = ${classes.teacherId})`,
          amount: tuitionBilling.amount,
          billingMonth: tuitionBilling.billingMonth,
          dueDate: tuitionBilling.dueDate,
          status: tuitionBilling.status,
          paidAt: tuitionBilling.paidAt,
          paymentMethod: tuitionBilling.paymentMethod,
          invoiceNumber: tuitionBilling.invoiceNumber,
          notes: tuitionBilling.notes,
          createdAt: tuitionBilling.createdAt,
        })
        .from(tuitionBilling)
        .leftJoin(user, eq(tuitionBilling.studentId, user.id))
        .leftJoin(classes, eq(tuitionBilling.classId, classes.classId))
        .where(eq(tuitionBilling.billingId, input.billingId));

      if (billing.length === 0) {
        throw new Error("Billing record not found");
      }

      return billing[0];
    }),

  // =====================
  // TEACHER RATES MANAGEMENT
  // =====================

  // Get teacher rates (manager only)
  getTeacherRates: protectedProcedure
    .input(
      z.object({
        teacherId: z.string().optional(),
        activeOnly: z.boolean().optional().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const conditions = [];

      if (input.teacherId) {
        conditions.push(eq(teacherRates.teacherId, input.teacherId));
      }

      if (input.activeOnly) {
        conditions.push(eq(teacherRates.isActive, true));
      }

      // Filter by teachers belonging to this manager
      const rates = await ctx.db
        .select({
          rateId: teacherRates.rateId,
          teacherId: teacherRates.teacherId,
          teacherName: user.name,
          teacherEmail: user.email,
          rateType: teacherRates.rateType,
          amount: teacherRates.amount,
          effectiveDate: teacherRates.effectiveDate,
          isActive: teacherRates.isActive,
        })
        .from(teacherRates)
        .innerJoin(user, eq(teacherRates.teacherId, user.id))
        .where(
          conditions.length > 0
            ? and(eq(user.managerId, ctx.session.user.id), ...conditions)
            : eq(user.managerId, ctx.session.user.id)
        )
        .orderBy(desc(teacherRates.effectiveDate));

      return rates;
    }),

  // Create teacher rate (manager only)
  createTeacherRate: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        rateType: z.enum(["HOURLY", "PER_STUDENT", "MONTHLY_FIXED"]),
        amount: z.number().min(0),
        effectiveDate: z.string().optional(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Verify teacher belongs to this manager
      const teacher = await ctx.db
        .select()
        .from(user)
        .where(
          and(
            eq(user.id, input.teacherId),
            eq(user.managerId, ctx.session.user.id)
          )
        );

      if (teacher.length === 0) {
        throw new Error("Teacher not found or access denied");
      }

      // Deactivate existing rates of the same type for this teacher
      await ctx.db
        .update(teacherRates)
        .set({ isActive: false })
        .where(
          and(
            eq(teacherRates.teacherId, input.teacherId),
            eq(teacherRates.rateType, input.rateType),
            eq(teacherRates.isActive, true)
          )
        );

      // Create new rate
      const rateId = crypto.randomUUID();
      await ctx.db.insert(teacherRates).values({
        rateId,
        teacherId: input.teacherId,
        rateType: input.rateType,
        amount: input.amount,
        effectiveDate: input.effectiveDate
          ? new Date(input.effectiveDate)
          : new Date(),
        isActive: true,
      });

      return { rateId, success: true };
    }),

  // Update teacher rate (manager only - only for rates not used in payments)
  updateTeacherRate: protectedProcedure
    .input(
      z.object({
        rateId: z.string(),
        amount: z.number().min(0).optional(),
        effectiveDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Verify rate exists and teacher belongs to manager
      const rate = await ctx.db
        .select({
          rateId: teacherRates.rateId,
          teacherId: teacherRates.teacherId,
          managerId: user.managerId,
        })
        .from(teacherRates)
        .innerJoin(user, eq(teacherRates.teacherId, user.id))
        .where(eq(teacherRates.rateId, input.rateId));

      if (rate.length === 0 || rate[0]!.managerId !== ctx.session.user.id) {
        throw new Error("Rate not found or access denied");
      }

      // Check if rate is used in any payments (lock rates once used)
      const paymentsWithRate = await ctx.db
        .select({ paymentId: tutorPayments.paymentId })
        .from(tutorPayments)
        .where(eq(tutorPayments.rateId, input.rateId))
        .limit(1);

      if (paymentsWithRate.length > 0) {
        throw new Error(
          "Cannot modify rate - it has been used in existing payments. Create a new rate instead."
        );
      }

      const updateData: { amount?: number; effectiveDate?: Date } = {};
      if (input.amount !== undefined) {
        updateData.amount = input.amount;
      }
      if (input.effectiveDate) {
        updateData.effectiveDate = new Date(input.effectiveDate);
      }

      await ctx.db
        .update(teacherRates)
        .set(updateData)
        .where(eq(teacherRates.rateId, input.rateId));

      return { success: true };
    }),

  // Deactivate teacher rate (manager only)
  deactivateTeacherRate: protectedProcedure
    .input(z.object({ rateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Verify rate exists and teacher belongs to manager
      const rate = await ctx.db
        .select({
          rateId: teacherRates.rateId,
          teacherId: teacherRates.teacherId,
          managerId: user.managerId,
        })
        .from(teacherRates)
        .innerJoin(user, eq(teacherRates.teacherId, user.id))
        .where(eq(teacherRates.rateId, input.rateId));

      if (rate.length === 0 || rate[0]!.managerId !== ctx.session.user.id) {
        throw new Error("Rate not found or access denied");
      }

      await ctx.db
        .update(teacherRates)
        .set({ isActive: false })
        .where(eq(teacherRates.rateId, input.rateId));

      return { success: true };
    }),

  // =====================
  // TUTOR PAYMENTS
  // =====================

  // Get all tutor payments (manager only, scoped to manager's teachers)
  getTutorPayments: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        paymentMonth: z.string().optional(),
        teacherId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Filter by teachers belonging to this manager
      const conditions = [eq(user.managerId, ctx.session.user.id)];

      if (input.status) {
        conditions.push(eq(tutorPayments.status, input.status));
      }
      if (input.paymentMonth) {
        conditions.push(eq(tutorPayments.paymentMonth, input.paymentMonth));
      }
      if (input.teacherId) {
        conditions.push(eq(tutorPayments.teacherId, input.teacherId));
      }

      const payments = await ctx.db
        .select({
          paymentId: tutorPayments.paymentId,
          teacherId: tutorPayments.teacherId,
          teacherName: user.name,
          teacherEmail: user.email,
          amount: tutorPayments.amount,
          paymentMonth: tutorPayments.paymentMonth,
          sessionsCount: tutorPayments.sessionsCount,
          studentsCount: tutorPayments.studentsCount,
          rateId: tutorPayments.rateId,
          rateType: teacherRates.rateType,
          status: tutorPayments.status,
          paidAt: tutorPayments.paidAt,
          paymentMethod: tutorPayments.paymentMethod,
          notes: tutorPayments.notes,
          createdAt: tutorPayments.createdAt,
        })
        .from(tutorPayments)
        .innerJoin(user, eq(tutorPayments.teacherId, user.id))
        .leftJoin(teacherRates, eq(tutorPayments.rateId, teacherRates.rateId))
        .where(and(...conditions))
        .orderBy(desc(tutorPayments.createdAt));

      return payments;
    }),

  // Calculate and create monthly tutor payments (manager only)
  calculateMonthlyTutorPay: protectedProcedure
    .input(
      z.object({
        paymentMonth: z.string(), // Format: "YYYY-MM"
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Get all teachers with active rates
      const teachersWithRates = await ctx.db
        .select({
          teacherId: teacherRates.teacherId,
          rateId: teacherRates.rateId,
          rateType: teacherRates.rateType,
          amount: teacherRates.amount,
        })
        .from(teacherRates)
        .where(eq(teacherRates.isActive, true));

      if (teachersWithRates.length === 0) {
        throw new Error("No teachers with active rates found");
      }

      // Check for existing payments for this month
      const existingPayments = await ctx.db
        .select({ teacherId: tutorPayments.teacherId })
        .from(tutorPayments)
        .where(eq(tutorPayments.paymentMonth, input.paymentMonth));

      const existingTeacherIds = new Set(
        existingPayments.map((p) => p.teacherId)
      );

      const newPayments = [];

      for (const teacherRate of teachersWithRates) {
        if (existingTeacherIds.has(teacherRate.teacherId)) {
          continue; // Skip if already has payment for this month
        }

        // Get teacher's classes
        const teacherClasses = await ctx.db
          .select({ classId: classes.classId })
          .from(classes)
          .where(eq(classes.teacherId, teacherRate.teacherId));

        if (teacherClasses.length === 0) continue;

        const classIds = teacherClasses.map((c) => c.classId);

        // Get actual attendance logs for this month (completed sessions only)
        const completedLogs = await ctx.db
          .select()
          .from(attendanceLogs)
          .where(
            and(
              eq(attendanceLogs.teacherId, teacherRate.teacherId),
              eq(attendanceLogs.status, "completed"),
              sql`${attendanceLogs.sessionDate} LIKE ${
                input.paymentMonth + "%"
              }`
            )
          );

        // Calculate actual sessions and hours from attendance logs
        let sessionsCount = completedLogs.length;
        let totalMinutes = completedLogs.reduce(
          (sum, log) => sum + (log.actualDurationMinutes || 0),
          0
        );

        // Fallback to schedule approximation if no attendance logs exist
        if (sessionsCount === 0) {
          const schedules = await ctx.db
            .select()
            .from(classSchedules)
            .where(inArray(classSchedules.classId, classIds));

          // Calculate weeks in month (approximate: 4 sessions per weekly schedule)
          const weeksInMonth = 4;
          sessionsCount = schedules.length * weeksInMonth;
          // Estimate 90 minutes per session
          totalMinutes = sessionsCount * 90;
        }

        // Count unique students across all classes
        const studentCounts = await ctx.db
          .select({
            count: sql<number>`count(distinct ${enrollments.studentId})::int`,
          })
          .from(enrollments)
          .where(inArray(enrollments.classId, classIds));

        const studentsCount = studentCounts[0]?.count || 0;

        // Calculate amount based on rate type
        let amount = 0;
        switch (teacherRate.rateType) {
          case "HOURLY":
            // Use actual hours from attendance logs
            const totalHours = totalMinutes / 60;
            amount = teacherRate.amount * totalHours;
            break;
          case "PER_STUDENT":
            amount = teacherRate.amount * studentsCount;
            break;
          case "MONTHLY_FIXED":
            amount = teacherRate.amount;
            break;
        }

        newPayments.push({
          paymentId: crypto.randomUUID(),
          teacherId: teacherRate.teacherId,
          amount: Math.round(amount),
          paymentMonth: input.paymentMonth,
          sessionsCount,
          studentsCount,
          rateId: teacherRate.rateId,
          status: "pending" as const,
        });
      }

      if (newPayments.length === 0) {
        return { created: 0, skipped: teachersWithRates.length };
      }

      await ctx.db.insert(tutorPayments).values(newPayments);

      return {
        created: newPayments.length,
        skipped: teachersWithRates.length - newPayments.length,
      };
    }),

  // Update tutor payment status (manager only)
  updateTutorPaymentStatus: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]),
        paymentMethod: z
          .enum(["cash", "bank_transfer", "momo", "vnpay"])
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const updateData: {
        status: "pending" | "paid" | "overdue" | "cancelled";
        paidAt?: Date | null;
        paymentMethod?: "cash" | "bank_transfer" | "momo" | "vnpay" | null;
        notes?: string | null;
      } = {
        status: input.status,
      };

      if (input.status === "paid") {
        updateData.paidAt = new Date();
        if (input.paymentMethod) {
          updateData.paymentMethod = input.paymentMethod;
        }
      } else {
        updateData.paidAt = null;
        updateData.paymentMethod = null;
      }

      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }

      await ctx.db
        .update(tutorPayments)
        .set(updateData)
        .where(eq(tutorPayments.paymentId, input.paymentId));

      return { success: true };
    }),

  // =====================
  // FINANCIAL SUMMARY
  // =====================

  // Get financial summary for dashboard (manager only)
  getFinancialSummary: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const currentYear = input.year || new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(
        2,
        "0"
      )}`;

      // Total revenue (all paid billings)
      const totalRevenueResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
        })
        .from(tuitionBilling)
        .where(eq(tuitionBilling.status, "paid"));

      // Outstanding bills (pending + overdue)
      const outstandingResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(tuitionBilling)
        .where(sql`${tuitionBilling.status} IN ('pending', 'overdue')`);

      // This month's revenue
      const monthRevenueResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
        })
        .from(tuitionBilling)
        .where(
          and(
            eq(tuitionBilling.status, "paid"),
            eq(tuitionBilling.billingMonth, currentMonthStr)
          )
        );

      // Pending tutor payments
      const pendingTutorPaymentsResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${tutorPayments.amount}), 0)::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(tutorPayments)
        .where(eq(tutorPayments.status, "pending"));

      // Monthly revenue trend (last 12 months)
      const monthlyTrend = await ctx.db
        .select({
          month: tuitionBilling.billingMonth,
          revenue: sql<number>`coalesce(sum(case when ${tuitionBilling.status} = 'paid' then ${tuitionBilling.amount} else 0 end), 0)::int`,
          outstanding: sql<number>`coalesce(sum(case when ${tuitionBilling.status} IN ('pending', 'overdue') then ${tuitionBilling.amount} else 0 end), 0)::int`,
        })
        .from(tuitionBilling)
        .groupBy(tuitionBilling.billingMonth)
        .orderBy(tuitionBilling.billingMonth);

      return {
        totalRevenue: totalRevenueResult[0]?.total || 0,
        outstandingBills: outstandingResult[0]?.total || 0,
        outstandingCount: outstandingResult[0]?.count || 0,
        monthRevenue: monthRevenueResult[0]?.total || 0,
        pendingTutorPayments: pendingTutorPaymentsResult[0]?.total || 0,
        pendingTutorCount: pendingTutorPaymentsResult[0]?.count || 0,
        monthlyTrend: monthlyTrend,
      };
    }),

  // Get all classes for filter dropdowns (manager only)
  getAllClasses: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "manager") {
      throw new Error("Access denied - manager only");
    }

    const allClasses = await ctx.db
      .select({
        classId: classes.classId,
        className: classes.className,
        classCode: classes.classCode,
        subject: classes.subject,
        tuitionRate: classes.tuitionRate,
        teacherId: classes.teacherId,
        teacherName: user.name,
      })
      .from(classes)
      .leftJoin(user, eq(classes.teacherId, user.id))
      .orderBy(classes.className);

    return allClasses;
  }),

  // Update class tuition rate (manager only)
  updateClassTuitionRate: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        tuitionRate: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      await ctx.db
        .update(classes)
        .set({ tuitionRate: input.tuitionRate })
        .where(eq(classes.classId, input.classId));

      return { success: true };
    }),

  // Grade written submission (teacher only)
  gradeWrittenSubmission: protectedProcedure
    .input(
      z.object({
        submissionId: z.string(),
        grade: z.number().min(0).max(100),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is a teacher
      if (ctx.session.user.role !== "teacher") {
        throw new Error("Access denied: Only teachers can grade submissions");
      }

      // Get the submission and verify teacher owns the class
      const submissionData = await ctx.db
        .select({
          submission: submissions,
          assignment: assignments,
          class: classes,
        })
        .from(submissions)
        .innerJoin(
          assignments,
          eq(submissions.assignmentId, assignments.assignmentId)
        )
        .innerJoin(classes, eq(assignments.classId, classes.classId))
        .where(eq(submissions.submissionId, input.submissionId));

      if (submissionData.length === 0) {
        throw new Error("Submission not found");
      }

      const data = submissionData[0]!;

      // Verify teacher owns the class
      if (data.class.teacherId !== ctx.session.user.id) {
        throw new Error("Access denied: You do not own this class");
      }

      // Update the submission with grade and feedback
      await ctx.db
        .update(submissions)
        .set({
          grade: input.grade,
          feedback: input.feedback || null,
        })
        .where(eq(submissions.submissionId, input.submissionId));

      return { success: true };
    }),

  // ========== ATTENDANCE / CHECK-IN PROCEDURES ==========

  // Get active schedule for check-in (teacher only)
  // Returns schedule if current time is within ±15 minutes of start time
  getActiveScheduleForCheckIn: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "teacher") {
      throw new Error("Access denied - teacher only");
    }

    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;
    const today = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Get teacher's schedules for today
    const schedules = await ctx.db
      .select({
        schedule: classSchedules,
        class: classes,
      })
      .from(classSchedules)
      .innerJoin(classes, eq(classSchedules.classId, classes.classId))
      .where(
        and(
          eq(classes.teacherId, ctx.session.user.id),
          eq(classSchedules.dayOfWeek, currentDayOfWeek)
        )
      );

    // Check for existing attendance logs for today
    const todayLogs = await ctx.db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.teacherId, ctx.session.user.id),
          eq(attendanceLogs.sessionDate, today!)
        )
      );

    const logsBySchedule = new Map(
      todayLogs.map((log) => [log.scheduleId, log])
    );

    // Find schedules within ±5 min window
    const activeSchedules = schedules
      .map(({ schedule, class: cls }) => {
        const [startHours, startMinutes] = schedule.startTime
          .split(":")
          .map(Number);
        const [endHours, endMinutes] = schedule.endTime.split(":").map(Number);
        const startTimeMinutes = startHours! * 60 + startMinutes!;
        const endTimeMinutes = endHours! * 60 + endMinutes!;

        const existingLog = logsBySchedule.get(schedule.scheduleId);

        // Check if within ±15 minutes of start time (for check-in)
        const canCheckIn =
          !existingLog &&
          currentTimeMinutes >= startTimeMinutes - 15 &&
          currentTimeMinutes <= startTimeMinutes + 15;

        // Check if within ±15 minutes of end time (for check-out)
        const canCheckOut =
          existingLog?.status === "checked_in" &&
          currentTimeMinutes >= endTimeMinutes - 15 &&
          currentTimeMinutes <= endTimeMinutes + 15;

        return {
          scheduleId: schedule.scheduleId,
          classId: schedule.classId,
          className: cls.className,
          title: schedule.title,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location,
          color: schedule.color,
          canCheckIn,
          canCheckOut,
          existingLog: existingLog
            ? {
                logId: existingLog.logId,
                status: existingLog.status,
                checkInTime: existingLog.checkInTime,
                checkOutTime: existingLog.checkOutTime,
              }
            : null,
        };
      })
      .filter((s) => s.canCheckIn || s.canCheckOut || s.existingLog);

    return activeSchedules;
  }),

  // Check in to a session (teacher only)
  checkInSession: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "teacher") {
        throw new Error("Access denied - teacher only");
      }

      const now = new Date();
      const currentDayOfWeek = now.getDay();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeMinutes = currentHours * 60 + currentMinutes;
      const today = now.toISOString().split("T")[0]!;

      // Get the schedule and verify teacher owns the class
      const scheduleData = await ctx.db
        .select({
          schedule: classSchedules,
          class: classes,
        })
        .from(classSchedules)
        .innerJoin(classes, eq(classSchedules.classId, classes.classId))
        .where(
          and(
            eq(classSchedules.scheduleId, input.scheduleId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (scheduleData.length === 0) {
        throw new Error("Schedule not found or access denied");
      }

      const { schedule, class: cls } = scheduleData[0]!;

      // Verify it's the correct day
      if (schedule.dayOfWeek !== currentDayOfWeek) {
        throw new Error("This schedule is not for today");
      }

      // Verify within ±15 minutes of start time
      const [startHours, startMinutes] = schedule.startTime
        .split(":")
        .map(Number);
      const startTimeMinutes = startHours! * 60 + startMinutes!;

      if (
        currentTimeMinutes < startTimeMinutes - 15 ||
        currentTimeMinutes > startTimeMinutes + 15
      ) {
        throw new Error(
          "Check-in is only allowed within 15 minutes of the scheduled start time"
        );
      }

      // Check for existing log
      const existingLog = await ctx.db
        .select()
        .from(attendanceLogs)
        .where(
          and(
            eq(attendanceLogs.scheduleId, input.scheduleId),
            eq(attendanceLogs.sessionDate, today)
          )
        );

      if (existingLog.length > 0) {
        throw new Error("Already checked in for this session today");
      }

      // Create attendance log
      const logId = crypto.randomUUID();
      await ctx.db.insert(attendanceLogs).values({
        logId,
        scheduleId: input.scheduleId,
        classId: cls.classId,
        teacherId: ctx.session.user.id,
        sessionDate: today,
        checkInTime: now,
        status: "checked_in",
      });

      return { success: true, logId };
    }),

  // Check out of a session (teacher only)
  checkOutSession: protectedProcedure
    .input(
      z.object({
        logId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "teacher") {
        throw new Error("Access denied - teacher only");
      }

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeMinutes = currentHours * 60 + currentMinutes;

      // Get the attendance log
      const logData = await ctx.db
        .select({
          log: attendanceLogs,
          schedule: classSchedules,
        })
        .from(attendanceLogs)
        .innerJoin(
          classSchedules,
          eq(attendanceLogs.scheduleId, classSchedules.scheduleId)
        )
        .where(
          and(
            eq(attendanceLogs.logId, input.logId),
            eq(attendanceLogs.teacherId, ctx.session.user.id)
          )
        );

      if (logData.length === 0) {
        throw new Error("Attendance log not found or access denied");
      }

      const { log, schedule } = logData[0]!;

      if (log.status !== "checked_in") {
        throw new Error("Session is not in checked-in status");
      }

      // Verify within ±15 minutes of end time
      const [endHours, endMinutes] = schedule.endTime.split(":").map(Number);
      const endTimeMinutes = endHours! * 60 + endMinutes!;

      if (
        currentTimeMinutes < endTimeMinutes - 15 ||
        currentTimeMinutes > endTimeMinutes + 15
      ) {
        throw new Error(
          "Check-out is only allowed within 15 minutes of the scheduled end time"
        );
      }

      // Calculate actual duration
      const checkInTime = log.checkInTime!;
      const durationMs = now.getTime() - checkInTime.getTime();
      const actualDurationMinutes = Math.round(durationMs / 1000 / 60);

      // Update attendance log
      await ctx.db
        .update(attendanceLogs)
        .set({
          checkOutTime: now,
          actualDurationMinutes,
          status: "completed",
        })
        .where(eq(attendanceLogs.logId, input.logId));

      return { success: true, actualDurationMinutes };
    }),

  // Get attendance logs for a teacher (for history/reports)
  getTeacherAttendanceLogs: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(), // "YYYY-MM" format
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "teacher") {
        throw new Error("Access denied - teacher only");
      }

      let query = ctx.db
        .select({
          log: attendanceLogs,
          schedule: classSchedules,
          class: classes,
        })
        .from(attendanceLogs)
        .innerJoin(
          classSchedules,
          eq(attendanceLogs.scheduleId, classSchedules.scheduleId)
        )
        .innerJoin(classes, eq(attendanceLogs.classId, classes.classId))
        .where(eq(attendanceLogs.teacherId, ctx.session.user.id))
        .orderBy(desc(attendanceLogs.sessionDate));

      const logs = await query;

      // Filter by month if specified
      if (input.month) {
        return logs.filter((l) => l.log.sessionDate.startsWith(input.month!));
      }

      return logs;
    }),

  // Mark missed sessions - called by cron job (internal use)
  markMissedSessions: protectedProcedure.mutation(async ({ ctx }) => {
    // This should ideally be called by a cron job with a special auth token
    // For now, only managers can trigger this
    if (ctx.session.user.role !== "manager") {
      throw new Error("Access denied - manager only");
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0]!;
    const currentDayOfWeek = now.getDay();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    // Get all schedules for today that have passed their end time
    const schedules = await ctx.db
      .select({
        schedule: classSchedules,
        class: classes,
      })
      .from(classSchedules)
      .innerJoin(classes, eq(classSchedules.classId, classes.classId))
      .where(eq(classSchedules.dayOfWeek, currentDayOfWeek));

    let markedCount = 0;

    for (const { schedule, class: cls } of schedules) {
      const [endHours, endMinutes] = schedule.endTime.split(":").map(Number);
      const endTimeMinutes = endHours! * 60 + endMinutes!;

      // Skip if session hasn't ended yet (with 5 min buffer)
      if (currentTimeMinutes < endTimeMinutes + 5) {
        continue;
      }

      // Check if there's already a log for this schedule today
      const existingLog = await ctx.db
        .select()
        .from(attendanceLogs)
        .where(
          and(
            eq(attendanceLogs.scheduleId, schedule.scheduleId),
            eq(attendanceLogs.sessionDate, today)
          )
        );

      // If no log exists, mark as missed
      if (existingLog.length === 0) {
        await ctx.db.insert(attendanceLogs).values({
          logId: crypto.randomUUID(),
          scheduleId: schedule.scheduleId,
          classId: cls.classId,
          teacherId: cls.teacherId,
          sessionDate: today,
          status: "missed",
        });
        markedCount++;
      }
    }

    return { markedCount };
  }),

  // Get all attendance logs (manager only - for reports, scoped to manager's teachers)
  getAllAttendanceLogs: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(), // "YYYY-MM" format
        teacherId: z.string().optional(),
        status: z.enum(["checked_in", "completed", "missed"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const logs = await ctx.db
        .select({
          log: attendanceLogs,
          schedule: classSchedules,
          class: classes,
          teacher: user,
        })
        .from(attendanceLogs)
        .innerJoin(
          classSchedules,
          eq(attendanceLogs.scheduleId, classSchedules.scheduleId)
        )
        .innerJoin(classes, eq(attendanceLogs.classId, classes.classId))
        .innerJoin(user, eq(attendanceLogs.teacherId, user.id))
        .where(eq(user.managerId, ctx.session.user.id))
        .orderBy(desc(attendanceLogs.sessionDate));

      // Apply filters
      let filtered = logs;
      if (input.month) {
        filtered = filtered.filter((l) =>
          l.log.sessionDate.startsWith(input.month!)
        );
      }
      if (input.teacherId) {
        filtered = filtered.filter((l) => l.log.teacherId === input.teacherId);
      }
      if (input.status) {
        filtered = filtered.filter((l) => l.log.status === input.status);
      }

      return filtered;
    }),

  // =====================
  // ACCOUNT MANAGEMENT (Manager only)
  // =====================

  // Create a teacher account
  createTeacher: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        dateOfBirth: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Check if email already exists
      const existingUser = await ctx.db
        .select()
        .from(user)
        .where(eq(user.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Email already exists");
      }

      const userId = crypto.randomUUID();
      const password = generateRandomPassword();
      const hashedPassword = await new Scrypt().hash(password);
      const now = new Date();

      // Create user
      await ctx.db.insert(user).values({
        id: userId,
        name: input.name,
        email: input.email,
        emailVerified: true,
        role: "teacher",
        managerId: ctx.session.user.id,
        generatedPassword: password,
        hasChangedPassword: false,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        createdAt: now,
        updatedAt: now,
      });

      // Create account for password authentication
      await ctx.db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      // Send welcome email
      try {
        const loginUrl = process.env.CORS_ORIGIN
          ? `${process.env.CORS_ORIGIN}/login`
          : "/login";
        await sendWelcomeEmail({
          name: input.name,
          email: input.email,
          password: password,
          role: "teacher",
          loginUrl,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't throw - user was created successfully, just email failed
      }

      return { userId, email: input.email, generatedPassword: password };
    }),

  // Create a student account
  createStudent: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        dateOfBirth: z.string().optional(),
        parentEmail: z.string().email().optional(),
        parentPhone: z
          .string()
          .regex(/^[+]?[\d\s()-]{7,20}$/, "Invalid phone number format")
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Check if email already exists
      const existingUser = await ctx.db
        .select()
        .from(user)
        .where(eq(user.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Email already exists");
      }

      const userId = crypto.randomUUID();
      const password = generateRandomPassword();
      const hashedPassword = await new Scrypt().hash(password);
      const now = new Date();

      // Create user
      await ctx.db.insert(user).values({
        id: userId,
        name: input.name,
        email: input.email,
        emailVerified: true,
        role: "student",
        managerId: ctx.session.user.id,
        generatedPassword: password,
        hasChangedPassword: false,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        parentEmail: input.parentEmail || null,
        parentPhone: input.parentPhone || null,
        createdAt: now,
        updatedAt: now,
      });

      // Create account for password authentication
      await ctx.db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      // Send welcome email
      try {
        const loginUrl = process.env.CORS_ORIGIN
          ? `${process.env.CORS_ORIGIN}/login`
          : "/login";
        await sendWelcomeEmail({
          name: input.name,
          email: input.email,
          password: password,
          role: "student",
          loginUrl,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't throw - user was created successfully, just email failed
      }

      return { userId, email: input.email, generatedPassword: password };
    }),

  // Import teachers from CSV data
  importTeachers: protectedProcedure
    .input(
      z.object({
        teachers: z.array(
          z.object({
            name: z.string().min(2),
            email: z.string().email(),
            dateOfBirth: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const results: {
        success: { email: string; password: string }[];
        failed: { email: string; reason: string }[];
      } = { success: [], failed: [] };

      for (const teacher of input.teachers) {
        try {
          // Check if email already exists
          const existingUser = await ctx.db
            .select()
            .from(user)
            .where(eq(user.email, teacher.email))
            .limit(1);

          if (existingUser.length > 0) {
            results.failed.push({
              email: teacher.email,
              reason: "Email already exists",
            });
            continue;
          }

          const userId = crypto.randomUUID();
          const password = generateRandomPassword();
          const hashedPassword = await new Scrypt().hash(password);
          const now = new Date();

          // Create user
          await ctx.db.insert(user).values({
            id: userId,
            name: teacher.name,
            email: teacher.email,
            emailVerified: true,
            role: "teacher",
            managerId: ctx.session.user.id,
            generatedPassword: password,
            hasChangedPassword: false,
            dateOfBirth: teacher.dateOfBirth
              ? new Date(teacher.dateOfBirth)
              : null,
            createdAt: now,
            updatedAt: now,
          });

          // Create account for password authentication
          await ctx.db.insert(account).values({
            id: crypto.randomUUID(),
            accountId: userId,
            providerId: "credential",
            userId: userId,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
          });

          results.success.push({ email: teacher.email, password });

          // Send welcome email (don't await to speed up bulk import)
          const loginUrl = process.env.CORS_ORIGIN
            ? `${process.env.CORS_ORIGIN}/login`
            : "/login";
          sendWelcomeEmail({
            name: teacher.name,
            email: teacher.email,
            password: password,
            role: "teacher",
            loginUrl,
          }).catch((err) =>
            console.error(`Failed to send email to ${teacher.email}:`, err)
          );
        } catch (error: any) {
          results.failed.push({
            email: teacher.email,
            reason: error.message || "Unknown error",
          });
        }
      }

      return results;
    }),

  // Import students from CSV data
  importStudents: protectedProcedure
    .input(
      z.object({
        students: z.array(
          z.object({
            name: z.string().min(2),
            email: z.string().email(),
            dateOfBirth: z.string().optional(),
            parentEmail: z.string().email().optional(),
            parentPhone: z
              .string()
              .regex(/^[+]?[\d\s()-]{7,20}$/, "Invalid phone number format")
              .optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const results: {
        success: { email: string; password: string }[];
        failed: { email: string; reason: string }[];
      } = { success: [], failed: [] };

      for (const student of input.students) {
        try {
          // Check if email already exists
          const existingUser = await ctx.db
            .select()
            .from(user)
            .where(eq(user.email, student.email))
            .limit(1);

          if (existingUser.length > 0) {
            results.failed.push({
              email: student.email,
              reason: "Email already exists",
            });
            continue;
          }

          const userId = crypto.randomUUID();
          const password = generateRandomPassword();
          const hashedPassword = await new Scrypt().hash(password);
          const now = new Date();

          // Create user
          await ctx.db.insert(user).values({
            id: userId,
            name: student.name,
            email: student.email,
            emailVerified: true,
            role: "student",
            managerId: ctx.session.user.id,
            generatedPassword: password,
            hasChangedPassword: false,
            dateOfBirth: student.dateOfBirth
              ? new Date(student.dateOfBirth)
              : null,
            parentEmail: student.parentEmail || null,
            parentPhone: student.parentPhone || null,
            createdAt: now,
            updatedAt: now,
          });

          // Create account for password authentication
          await ctx.db.insert(account).values({
            id: crypto.randomUUID(),
            accountId: userId,
            providerId: "credential",
            userId: userId,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
          });

          results.success.push({ email: student.email, password });

          // Send welcome email (don't await to speed up bulk import)
          const loginUrl = process.env.CORS_ORIGIN
            ? `${process.env.CORS_ORIGIN}/login`
            : "/login";
          sendWelcomeEmail({
            name: student.name,
            email: student.email,
            password: password,
            role: "student",
            loginUrl,
          }).catch((err) =>
            console.error(`Failed to send email to ${student.email}:`, err)
          );
        } catch (error: any) {
          results.failed.push({
            email: student.email,
            reason: error.message || "Unknown error",
          });
        }
      }

      return results;
    }),

  // Get generated password for a user (manager only)
  getAccountPassword: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const result = await ctx.db
        .select({
          generatedPassword: user.generatedPassword,
          hasChangedPassword: user.hasChangedPassword,
        })
        .from(user)
        .where(
          and(
            eq(user.id, input.userId),
            eq(user.managerId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (result.length === 0) {
        throw new Error("User not found or access denied");
      }

      return result[0];
    }),

  // ========== STUDENT ATTENDANCE / CHECK-IN PROCEDURES ==========

  // Get active schedules for student check-in (teacher only)
  // Returns schedules if current time is within ±15 minutes of start time
  getActiveSchedulesForStudentCheckIn: protectedProcedure.query(
    async ({ ctx }) => {
      if (ctx.session.user.role !== "teacher") {
        throw new Error("Access denied - teacher only");
      }

      const now = new Date();
      const currentDayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeMinutes = currentHours * 60 + currentMinutes;

      // Get teacher's schedules for today
      const schedules = await ctx.db
        .select({
          schedule: classSchedules,
          class: classes,
        })
        .from(classSchedules)
        .innerJoin(classes, eq(classSchedules.classId, classes.classId))
        .where(
          and(
            eq(classes.teacherId, ctx.session.user.id),
            eq(classSchedules.dayOfWeek, currentDayOfWeek)
          )
        );

      // Find schedules within ±5 min window of start time
      const activeSchedules = schedules
        .map(({ schedule, class: cls }) => {
          const [startHours, startMinutes] = schedule.startTime
            .split(":")
            .map(Number);
          const startTimeMinutes = startHours! * 60 + startMinutes!;

          const [endHours, endMinutes] = schedule.endTime
            .split(":")
            .map(Number);
          const endTimeMinutes = endHours! * 60 + endMinutes!;

          // Check if within 15 minutes before start time until 15 minutes after end time
          const isActive =
            currentTimeMinutes >= startTimeMinutes - 15 &&
            currentTimeMinutes <= endTimeMinutes + 15;

          return {
            scheduleId: schedule.scheduleId,
            classId: schedule.classId,
            className: cls.className,
            title: schedule.title,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            location: schedule.location,
            color: schedule.color,
            isActive,
          };
        })
        .filter((s) => s.isActive);

      return activeSchedules;
    }
  ),

  // Get students for check-in with their attendance status
  getStudentsForCheckIn: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        sessionDate: z.string(), // Format: "YYYY-MM-DD"
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "teacher") {
        throw new Error("Access denied - teacher only");
      }

      // Get the schedule and verify teacher owns the class
      const scheduleData = await ctx.db
        .select({
          schedule: classSchedules,
          class: classes,
        })
        .from(classSchedules)
        .innerJoin(classes, eq(classSchedules.classId, classes.classId))
        .where(eq(classSchedules.scheduleId, input.scheduleId))
        .limit(1);

      if (
        scheduleData.length === 0 ||
        scheduleData[0]!.class.teacherId !== ctx.session.user.id
      ) {
        throw new Error("Schedule not found or access denied");
      }

      const classId = scheduleData[0]!.schedule.classId;

      // Get enrolled students
      const students = await ctx.db
        .select({
          userId: user.id,
          name: user.name,
          email: user.email,
        })
        .from(enrollments)
        .innerJoin(user, eq(enrollments.studentId, user.id))
        .where(eq(enrollments.classId, classId));

      // Get existing attendance records for this session
      const existingAttendance = await ctx.db
        .select()
        .from(studentAttendanceLogs)
        .where(
          and(
            eq(studentAttendanceLogs.scheduleId, input.scheduleId),
            eq(studentAttendanceLogs.sessionDate, input.sessionDate)
          )
        );

      const attendanceMap = new Map(
        existingAttendance.map((a) => [a.studentId, a])
      );

      // Combine student data with attendance status
      const studentsWithAttendance = students.map((student) => ({
        ...student,
        isPresent: attendanceMap.get(student.userId)?.isPresent ?? false,
        attendanceLogId: attendanceMap.get(student.userId)?.logId ?? null,
      }));

      return {
        schedule: {
          scheduleId: scheduleData[0]!.schedule.scheduleId,
          title: scheduleData[0]!.schedule.title,
          startTime: scheduleData[0]!.schedule.startTime,
          endTime: scheduleData[0]!.schedule.endTime,
        },
        className: scheduleData[0]!.class.className,
        students: studentsWithAttendance,
      };
    }),

  // Save student attendance (bulk upsert)
  saveStudentAttendance: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        sessionDate: z.string(), // Format: "YYYY-MM-DD"
        students: z.array(
          z.object({
            studentId: z.string(),
            isPresent: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "teacher") {
        throw new Error("Access denied - teacher only");
      }

      // Get the schedule and verify teacher owns the class
      const scheduleData = await ctx.db
        .select({
          schedule: classSchedules,
          class: classes,
        })
        .from(classSchedules)
        .innerJoin(classes, eq(classSchedules.classId, classes.classId))
        .where(eq(classSchedules.scheduleId, input.scheduleId))
        .limit(1);

      if (
        scheduleData.length === 0 ||
        scheduleData[0]!.class.teacherId !== ctx.session.user.id
      ) {
        throw new Error("Schedule not found or access denied");
      }

      const classId = scheduleData[0]!.schedule.classId;
      const now = new Date();

      // Process each student's attendance
      for (const student of input.students) {
        // Check if record exists
        const existingRecord = await ctx.db
          .select()
          .from(studentAttendanceLogs)
          .where(
            and(
              eq(studentAttendanceLogs.scheduleId, input.scheduleId),
              eq(studentAttendanceLogs.sessionDate, input.sessionDate),
              eq(studentAttendanceLogs.studentId, student.studentId)
            )
          )
          .limit(1);

        if (existingRecord.length > 0) {
          // Update existing record
          await ctx.db
            .update(studentAttendanceLogs)
            .set({
              isPresent: student.isPresent,
              checkedInAt: student.isPresent ? now : null,
              checkedInByTeacherId: student.isPresent
                ? ctx.session.user.id
                : null,
            })
            .where(eq(studentAttendanceLogs.logId, existingRecord[0]!.logId));
        } else {
          // Insert new record
          await ctx.db.insert(studentAttendanceLogs).values({
            logId: crypto.randomUUID(),
            scheduleId: input.scheduleId,
            classId: classId,
            studentId: student.studentId,
            sessionDate: input.sessionDate,
            isPresent: student.isPresent,
            checkedInAt: student.isPresent ? now : null,
            checkedInByTeacherId: student.isPresent
              ? ctx.session.user.id
              : null,
          });
        }
      }

      return { success: true };
    }),

  // Get student attendance history (teacher only)
  getStudentAttendanceHistory: protectedProcedure
    .input(
      z.object({
        classId: z.string().optional(),
        startDate: z.string().optional(), // Format: "YYYY-MM-DD"
        endDate: z.string().optional(), // Format: "YYYY-MM-DD"
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "teacher") {
        throw new Error("Access denied - teacher only");
      }

      // Build conditions
      const conditions = [];

      // Always filter by teacher's classes
      const teacherClasses = await ctx.db
        .select({ classId: classes.classId })
        .from(classes)
        .where(eq(classes.teacherId, ctx.session.user.id));

      const teacherClassIds = teacherClasses.map((c) => c.classId);

      if (teacherClassIds.length === 0) {
        return [];
      }

      conditions.push(inArray(studentAttendanceLogs.classId, teacherClassIds));

      if (input.classId) {
        conditions.push(eq(studentAttendanceLogs.classId, input.classId));
      }

      if (input.startDate) {
        conditions.push(
          gte(studentAttendanceLogs.sessionDate, input.startDate)
        );
      }

      if (input.endDate) {
        conditions.push(lte(studentAttendanceLogs.sessionDate, input.endDate));
      }

      const logs = await ctx.db
        .select({
          logId: studentAttendanceLogs.logId,
          sessionDate: studentAttendanceLogs.sessionDate,
          isPresent: studentAttendanceLogs.isPresent,
          checkedInAt: studentAttendanceLogs.checkedInAt,
          studentId: studentAttendanceLogs.studentId,
          studentName: user.name,
          studentEmail: user.email,
          classId: studentAttendanceLogs.classId,
          className: classes.className,
          scheduleTitle: classSchedules.title,
        })
        .from(studentAttendanceLogs)
        .innerJoin(user, eq(studentAttendanceLogs.studentId, user.id))
        .innerJoin(classes, eq(studentAttendanceLogs.classId, classes.classId))
        .innerJoin(
          classSchedules,
          eq(studentAttendanceLogs.scheduleId, classSchedules.scheduleId)
        )
        .where(and(...conditions))
        .orderBy(desc(studentAttendanceLogs.sessionDate));

      return logs;
    }),

  // Get all student attendance logs (manager only - view only)
  getAllStudentAttendanceLogs: protectedProcedure
    .input(
      z.object({
        teacherId: z.string().optional(),
        classId: z.string().optional(),
        studentId: z.string().optional(),
        startDate: z.string().optional(), // Format: "YYYY-MM-DD"
        endDate: z.string().optional(), // Format: "YYYY-MM-DD"
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Build conditions
      const conditions = [];

      // Get classes belonging to teachers managed by this manager
      const managedTeachers = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(
          and(eq(user.managerId, ctx.session.user.id), eq(user.role, "teacher"))
        );

      const managedTeacherIds = managedTeachers.map((t) => t.id);

      if (managedTeacherIds.length === 0) {
        return [];
      }

      const managedClasses = await ctx.db
        .select({ classId: classes.classId })
        .from(classes)
        .where(inArray(classes.teacherId, managedTeacherIds));

      const managedClassIds = managedClasses.map((c) => c.classId);

      if (managedClassIds.length === 0) {
        return [];
      }

      conditions.push(inArray(studentAttendanceLogs.classId, managedClassIds));

      if (input.teacherId) {
        const teacherClasses = await ctx.db
          .select({ classId: classes.classId })
          .from(classes)
          .where(eq(classes.teacherId, input.teacherId));
        const teacherClassIds = teacherClasses.map((c) => c.classId);
        if (teacherClassIds.length > 0) {
          conditions.push(
            inArray(studentAttendanceLogs.classId, teacherClassIds)
          );
        }
      }

      if (input.classId) {
        conditions.push(eq(studentAttendanceLogs.classId, input.classId));
      }

      if (input.studentId) {
        conditions.push(eq(studentAttendanceLogs.studentId, input.studentId));
      }

      if (input.startDate) {
        conditions.push(
          gte(studentAttendanceLogs.sessionDate, input.startDate)
        );
      }

      if (input.endDate) {
        conditions.push(lte(studentAttendanceLogs.sessionDate, input.endDate));
      }

      const logs = await ctx.db
        .select({
          logId: studentAttendanceLogs.logId,
          sessionDate: studentAttendanceLogs.sessionDate,
          isPresent: studentAttendanceLogs.isPresent,
          checkedInAt: studentAttendanceLogs.checkedInAt,
          studentId: studentAttendanceLogs.studentId,
          studentName: user.name,
          studentEmail: user.email,
          classId: studentAttendanceLogs.classId,
          className: classes.className,
          scheduleTitle: classSchedules.title,
          teacherId: classes.teacherId,
        })
        .from(studentAttendanceLogs)
        .innerJoin(user, eq(studentAttendanceLogs.studentId, user.id))
        .innerJoin(classes, eq(studentAttendanceLogs.classId, classes.classId))
        .innerJoin(
          classSchedules,
          eq(studentAttendanceLogs.scheduleId, classSchedules.scheduleId)
        )
        .where(and(...conditions))
        .orderBy(desc(studentAttendanceLogs.sessionDate));

      // Get teacher names separately
      const teacherIds = [...new Set(logs.map((l) => l.teacherId))];
      const teachers = await ctx.db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, teacherIds));

      const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

      return logs.map((log) => ({
        ...log,
        teacherName: teacherMap.get(log.teacherId) || "Unknown",
      }));
    }),

  // =====================
  // COLLECTION & OVERDUE METRICS
  // =====================

  // Get collection metrics (collection rate, payment method distribution)
  getCollectionMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(), // Format: "YYYY-MM"
        endDate: z.string().optional(), // Format: "YYYY-MM"
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Get students belonging to this manager
      const managerStudents = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(
          and(eq(user.role, "student"), eq(user.managerId, ctx.session.user.id))
        );

      const studentIds = managerStudents.map((s) => s.id);

      if (studentIds.length === 0) {
        return {
          collectionRate: 0,
          totalBilled: 0,
          totalCollected: 0,
          paymentMethodDistribution: [],
        };
      }

      // Build conditions
      const conditions = [inArray(tuitionBilling.studentId, studentIds)];
      if (input.startDate) {
        conditions.push(gte(tuitionBilling.billingMonth, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(tuitionBilling.billingMonth, input.endDate));
      }

      // Total billed amount
      const totalBilledResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
        })
        .from(tuitionBilling)
        .where(and(...conditions));

      // Total collected (paid)
      const totalCollectedResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
        })
        .from(tuitionBilling)
        .where(and(...conditions, eq(tuitionBilling.status, "paid")));

      const totalBilled = totalBilledResult[0]?.total || 0;
      const totalCollected = totalCollectedResult[0]?.total || 0;
      const collectionRate =
        totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

      // Payment method distribution
      const paymentMethodDist = await ctx.db
        .select({
          method: tuitionBilling.paymentMethod,
          count: sql<number>`count(*)::int`,
          amount: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
        })
        .from(tuitionBilling)
        .where(and(...conditions, eq(tuitionBilling.status, "paid")))
        .groupBy(tuitionBilling.paymentMethod);

      return {
        collectionRate,
        totalBilled,
        totalCollected,
        paymentMethodDistribution: paymentMethodDist.map((p) => ({
          method: p.method || "unknown",
          count: p.count,
          amount: p.amount,
        })),
      };
    }),

  // Get overdue billings with aging buckets
  getOverdueBillings: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "manager") {
      throw new Error("Access denied - manager only");
    }

    // Get students belonging to this manager
    const managerStudents = await ctx.db
      .select({ id: user.id })
      .from(user)
      .where(
        and(eq(user.role, "student"), eq(user.managerId, ctx.session.user.id))
      );

    const studentIds = managerStudents.map((s) => s.id);

    if (studentIds.length === 0) {
      return [];
    }

    const now = new Date();

    const overdueList = await ctx.db
      .select({
        billingId: tuitionBilling.billingId,
        studentId: tuitionBilling.studentId,
        studentName: user.name,
        studentEmail: user.email,
        classId: tuitionBilling.classId,
        className: classes.className,
        amount: tuitionBilling.amount,
        billingMonth: tuitionBilling.billingMonth,
        dueDate: tuitionBilling.dueDate,
        invoiceNumber: tuitionBilling.invoiceNumber,
      })
      .from(tuitionBilling)
      .leftJoin(user, eq(tuitionBilling.studentId, user.id))
      .leftJoin(classes, eq(tuitionBilling.classId, classes.classId))
      .where(
        and(
          inArray(tuitionBilling.studentId, studentIds),
          eq(tuitionBilling.status, "overdue")
        )
      )
      .orderBy(tuitionBilling.dueDate);

    // Calculate days overdue and aging bucket
    return overdueList.map((bill) => {
      const dueDate = new Date(bill.dueDate!);
      const daysOverdue = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let agingBucket: "1-30" | "31-60" | "61-90" | "90+";
      if (daysOverdue <= 30) {
        agingBucket = "1-30";
      } else if (daysOverdue <= 60) {
        agingBucket = "31-60";
      } else if (daysOverdue <= 90) {
        agingBucket = "61-90";
      } else {
        agingBucket = "90+";
      }

      return {
        ...bill,
        daysOverdue,
        agingBucket,
      };
    });
  }),

  // =====================
  // EXPENSE MANAGEMENT
  // =====================

  // Get all expense categories (manager only)
  getExpenseCategories: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "manager") {
      throw new Error("Access denied - manager only");
    }

    const categories = await ctx.db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.managerId, ctx.session.user.id))
      .orderBy(expenseCategories.name);

    return categories;
  }),

  // Create expense category
  createExpenseCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["facility", "marketing", "operational"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const categoryId = crypto.randomUUID();

      await ctx.db.insert(expenseCategories).values({
        categoryId,
        name: input.name,
        type: input.type,
        managerId: ctx.session.user.id,
      });

      return { categoryId };
    }),

  // Delete expense category
  deleteExpenseCategory: protectedProcedure
    .input(z.object({ categoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Verify ownership
      const category = await ctx.db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.categoryId, input.categoryId),
            eq(expenseCategories.managerId, ctx.session.user.id)
          )
        );

      if (category.length === 0) {
        throw new Error("Category not found or access denied");
      }

      await ctx.db
        .delete(expenseCategories)
        .where(eq(expenseCategories.categoryId, input.categoryId));

      return { success: true };
    }),

  // Get expenses with filters
  getExpenses: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        categoryType: z
          .enum(["facility", "marketing", "operational"])
          .optional(),
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        isRecurring: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const conditions = [eq(expenses.managerId, ctx.session.user.id)];

      if (input.categoryId) {
        conditions.push(eq(expenses.categoryId, input.categoryId));
      }

      if (input.startDate) {
        conditions.push(gte(expenses.expenseDate, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(expenses.expenseDate, new Date(input.endDate)));
      }

      if (input.isRecurring !== undefined) {
        conditions.push(eq(expenses.isRecurring, input.isRecurring));
      }

      let query = ctx.db
        .select({
          expenseId: expenses.expenseId,
          categoryId: expenses.categoryId,
          categoryName: expenseCategories.name,
          categoryType: expenseCategories.type,
          amount: expenses.amount,
          description: expenses.description,
          expenseDate: expenses.expenseDate,
          isRecurring: expenses.isRecurring,
          recurringInterval: expenses.recurringInterval,
          createdAt: expenses.createdAt,
        })
        .from(expenses)
        .innerJoin(
          expenseCategories,
          eq(expenses.categoryId, expenseCategories.categoryId)
        )
        .where(and(...conditions))
        .orderBy(desc(expenses.expenseDate));

      // Filter by category type if provided
      if (input.categoryType) {
        const expensesList = await query;
        return expensesList.filter(
          (e) => e.categoryType === input.categoryType
        );
      }

      return await query;
    }),

  // Create expense
  createExpense: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        amount: z.number().positive(),
        description: z.string().optional(),
        expenseDate: z.string(), // ISO date string
        isRecurring: z.boolean().default(false),
        recurringInterval: z
          .enum(["monthly", "quarterly", "yearly"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Verify category ownership
      const category = await ctx.db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.categoryId, input.categoryId),
            eq(expenseCategories.managerId, ctx.session.user.id)
          )
        );

      if (category.length === 0) {
        throw new Error("Category not found or access denied");
      }

      const expenseId = crypto.randomUUID();

      await ctx.db.insert(expenses).values({
        expenseId,
        categoryId: input.categoryId,
        amount: input.amount,
        description: input.description,
        expenseDate: new Date(input.expenseDate),
        isRecurring: input.isRecurring,
        recurringInterval: input.isRecurring ? input.recurringInterval : null,
        managerId: ctx.session.user.id,
      });

      return { expenseId };
    }),

  // Update expense
  updateExpense: protectedProcedure
    .input(
      z.object({
        expenseId: z.string(),
        categoryId: z.string().optional(),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        expenseDate: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurringInterval: z
          .enum(["monthly", "quarterly", "yearly"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Verify ownership
      const expense = await ctx.db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.expenseId, input.expenseId),
            eq(expenses.managerId, ctx.session.user.id)
          )
        );

      if (expense.length === 0) {
        throw new Error("Expense not found or access denied");
      }

      const updateData: Partial<typeof expenses.$inferInsert> = {};

      if (input.categoryId) {
        // Verify category ownership
        const category = await ctx.db
          .select()
          .from(expenseCategories)
          .where(
            and(
              eq(expenseCategories.categoryId, input.categoryId),
              eq(expenseCategories.managerId, ctx.session.user.id)
            )
          );

        if (category.length === 0) {
          throw new Error("Category not found or access denied");
        }
        updateData.categoryId = input.categoryId;
      }

      if (input.amount !== undefined) {
        updateData.amount = input.amount;
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      if (input.expenseDate) {
        updateData.expenseDate = new Date(input.expenseDate);
      }

      if (input.isRecurring !== undefined) {
        updateData.isRecurring = input.isRecurring;
        if (!input.isRecurring) {
          updateData.recurringInterval = null;
        }
      }

      if (input.recurringInterval !== undefined) {
        updateData.recurringInterval = input.recurringInterval;
      }

      await ctx.db
        .update(expenses)
        .set(updateData)
        .where(eq(expenses.expenseId, input.expenseId));

      return { success: true };
    }),

  // Delete expense
  deleteExpense: protectedProcedure
    .input(z.object({ expenseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      // Verify ownership
      const expense = await ctx.db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.expenseId, input.expenseId),
            eq(expenses.managerId, ctx.session.user.id)
          )
        );

      if (expense.length === 0) {
        throw new Error("Expense not found or access denied");
      }

      await ctx.db
        .delete(expenses)
        .where(eq(expenses.expenseId, input.expenseId));

      return { success: true };
    }),

  // Get expense summary (totals by category type, monthly trend)
  getExpenseSummary: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const currentYear = input.year || new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      // Total expenses by category type
      const byTypeResult = await ctx.db
        .select({
          type: expenseCategories.type,
          total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(expenses)
        .innerJoin(
          expenseCategories,
          eq(expenses.categoryId, expenseCategories.categoryId)
        )
        .where(
          and(
            eq(expenses.managerId, ctx.session.user.id),
            gte(expenses.expenseDate, startOfYear),
            lte(expenses.expenseDate, endOfYear)
          )
        )
        .groupBy(expenseCategories.type);

      // Monthly trend
      const monthlyTrend = await ctx.db
        .select({
          month: sql<string>`to_char(${expenses.expenseDate}, 'YYYY-MM')`,
          total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.managerId, ctx.session.user.id),
            gte(expenses.expenseDate, startOfYear),
            lte(expenses.expenseDate, endOfYear)
          )
        )
        .groupBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`);

      // Total for the year
      const totalResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.managerId, ctx.session.user.id),
            gte(expenses.expenseDate, startOfYear),
            lte(expenses.expenseDate, endOfYear)
          )
        );

      return {
        totalExpenses: totalResult[0]?.total || 0,
        byType: byTypeResult.map((t) => ({
          type: t.type,
          total: t.total,
          count: t.count,
        })),
        monthlyTrend: monthlyTrend.map((m) => ({
          month: m.month,
          total: m.total,
        })),
      };
    }),

  // =====================
  // PROFITABILITY METRICS
  // =====================

  // Get profitability metrics (net margin, revenue per student/class, teacher cost ratio)
  getProfitabilityMetrics: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
        month: z.string().optional(), // Format: "YYYY-MM"
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const currentYear = input.year || new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      // Get students belonging to this manager
      const managerStudents = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(
          and(eq(user.role, "student"), eq(user.managerId, ctx.session.user.id))
        );
      const studentIds = managerStudents.map((s) => s.id);

      // Get teachers belonging to this manager
      const managerTeachers = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(
          and(eq(user.role, "teacher"), eq(user.managerId, ctx.session.user.id))
        );
      const teacherIds = managerTeachers.map((t) => t.id);

      // Build billing conditions
      const billingConditions =
        studentIds.length > 0
          ? [
              inArray(tuitionBilling.studentId, studentIds),
              eq(tuitionBilling.status, "paid"),
            ]
          : [sql`1=0`]; // No students = no billing

      if (input.month) {
        billingConditions.push(eq(tuitionBilling.billingMonth, input.month));
      } else {
        billingConditions.push(
          gte(tuitionBilling.billingMonth, `${currentYear}-01`)
        );
        billingConditions.push(
          lte(tuitionBilling.billingMonth, `${currentYear}-12`)
        );
      }

      // Total revenue (paid tuition)
      const revenueResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
        })
        .from(tuitionBilling)
        .where(and(...billingConditions));

      const totalRevenue = revenueResult[0]?.total || 0;

      // Total teacher costs (paid tutor payments)
      const teacherCostConditions =
        teacherIds.length > 0
          ? [
              inArray(tutorPayments.teacherId, teacherIds),
              eq(tutorPayments.status, "paid"),
            ]
          : [sql`1=0`];

      if (input.month) {
        teacherCostConditions.push(eq(tutorPayments.paymentMonth, input.month));
      } else {
        teacherCostConditions.push(
          gte(tutorPayments.paymentMonth, `${currentYear}-01`)
        );
        teacherCostConditions.push(
          lte(tutorPayments.paymentMonth, `${currentYear}-12`)
        );
      }

      const teacherCostResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${tutorPayments.amount}), 0)::int`,
        })
        .from(tutorPayments)
        .where(and(...teacherCostConditions));

      const totalTeacherCost = teacherCostResult[0]?.total || 0;

      // Total expenses
      const expenseResult = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.managerId, ctx.session.user.id),
            gte(expenses.expenseDate, startOfYear),
            lte(expenses.expenseDate, endOfYear)
          )
        );

      const totalExpenses = expenseResult[0]?.total || 0;

      // Net profit
      const netProfit = totalRevenue - totalTeacherCost - totalExpenses;
      const netProfitMargin =
        totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

      // Teacher cost ratio
      const teacherCostRatio =
        totalRevenue > 0
          ? Math.round((totalTeacherCost / totalRevenue) * 100)
          : 0;

      // Count active students (with enrollments)
      const activeStudentsResult = await ctx.db
        .select({
          count: sql<number>`count(distinct ${enrollments.studentId})::int`,
        })
        .from(enrollments)
        .where(
          studentIds.length > 0
            ? inArray(enrollments.studentId, studentIds)
            : sql`1=0`
        );

      const activeStudentCount = activeStudentsResult[0]?.count || 0;
      const revenuePerStudent =
        activeStudentCount > 0
          ? Math.round(totalRevenue / activeStudentCount)
          : 0;

      // Revenue per class
      const classRevenueResult = await ctx.db
        .select({
          classId: tuitionBilling.classId,
          className: classes.className,
          revenue: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
        })
        .from(tuitionBilling)
        .leftJoin(classes, eq(tuitionBilling.classId, classes.classId))
        .where(and(...billingConditions))
        .groupBy(tuitionBilling.classId, classes.className);

      const classCount = classRevenueResult.length;
      const avgRevenuePerClass =
        classCount > 0 ? Math.round(totalRevenue / classCount) : 0;

      return {
        totalRevenue,
        totalTeacherCost,
        totalExpenses,
        netProfit,
        netProfitMargin,
        teacherCostRatio,
        activeStudentCount,
        revenuePerStudent,
        classCount,
        avgRevenuePerClass,
        revenueByClass: classRevenueResult.map((c) => ({
          classId: c.classId,
          className: c.className || "Unknown",
          revenue: c.revenue,
        })),
      };
    }),

  // =====================
  // CASH FLOW
  // =====================

  // Get cash flow summary (inflow, outflow, net, projected revenue)
  getCashFlowSummary: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const currentYear = input.year || new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      // Get students and teachers belonging to this manager
      const managerStudents = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(
          and(eq(user.role, "student"), eq(user.managerId, ctx.session.user.id))
        );
      const studentIds = managerStudents.map((s) => s.id);

      const managerTeachers = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(
          and(eq(user.role, "teacher"), eq(user.managerId, ctx.session.user.id))
        );
      const teacherIds = managerTeachers.map((t) => t.id);

      // Monthly inflow (paid tuition) by month
      const monthlyInflow =
        studentIds.length > 0
          ? await ctx.db
              .select({
                month: tuitionBilling.billingMonth,
                amount: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
              })
              .from(tuitionBilling)
              .where(
                and(
                  inArray(tuitionBilling.studentId, studentIds),
                  eq(tuitionBilling.status, "paid"),
                  gte(tuitionBilling.billingMonth, `${currentYear}-01`),
                  lte(tuitionBilling.billingMonth, `${currentYear}-12`)
                )
              )
              .groupBy(tuitionBilling.billingMonth)
              .orderBy(tuitionBilling.billingMonth)
          : [];

      // Monthly outflow - tutor wages by month
      const monthlyTutorWages =
        teacherIds.length > 0
          ? await ctx.db
              .select({
                month: tutorPayments.paymentMonth,
                amount: sql<number>`coalesce(sum(${tutorPayments.amount}), 0)::int`,
              })
              .from(tutorPayments)
              .where(
                and(
                  inArray(tutorPayments.teacherId, teacherIds),
                  eq(tutorPayments.status, "paid"),
                  gte(tutorPayments.paymentMonth, `${currentYear}-01`),
                  lte(tutorPayments.paymentMonth, `${currentYear}-12`)
                )
              )
              .groupBy(tutorPayments.paymentMonth)
              .orderBy(tutorPayments.paymentMonth)
          : [];

      // Monthly expenses
      const monthlyExpenses = await ctx.db
        .select({
          month: sql<string>`to_char(${expenses.expenseDate}, 'YYYY-MM')`,
          amount: sql<number>`coalesce(sum(${expenses.amount}), 0)::int`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.managerId, ctx.session.user.id),
            gte(expenses.expenseDate, startOfYear),
            lte(expenses.expenseDate, endOfYear)
          )
        )
        .groupBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`);

      // Combine into monthly cash flow
      const months = Array.from({ length: 12 }, (_, i) => {
        const month = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
        const inflow =
          monthlyInflow.find((m) => m.month === month)?.amount || 0;
        const tutorOutflow =
          monthlyTutorWages.find((m) => m.month === month)?.amount || 0;
        const expenseOutflow =
          monthlyExpenses.find((m) => m.month === month)?.amount || 0;
        const totalOutflow = tutorOutflow + expenseOutflow;
        return {
          month,
          inflow,
          tutorWages: tutorOutflow,
          expenses: expenseOutflow,
          totalOutflow,
          netCashFlow: inflow - totalOutflow,
        };
      });

      // Calculate totals
      const totalInflow = months.reduce((sum, m) => sum + m.inflow, 0);
      const totalOutflow = months.reduce((sum, m) => sum + m.totalOutflow, 0);
      const totalNetCashFlow = totalInflow - totalOutflow;

      // Projected revenue from active enrollments
      // Count active enrollments and multiply by class tuition rates
      const projectedRevenueResult =
        studentIds.length > 0
          ? await ctx.db
              .select({
                total: sql<number>`coalesce(sum(${classes.tuitionRate}), 0)::int`,
              })
              .from(enrollments)
              .innerJoin(classes, eq(enrollments.classId, classes.classId))
              .where(inArray(enrollments.studentId, studentIds))
          : [{ total: 0 }];

      const projectedMonthlyRevenue = projectedRevenueResult[0]?.total || 0;

      return {
        monthlyData: months,
        totalInflow,
        totalOutflow,
        totalNetCashFlow,
        projectedMonthlyRevenue,
        projectedAnnualRevenue: projectedMonthlyRevenue * 12,
      };
    }),

  // ==================== MANAGER OVERVIEW ANALYTICS ====================

  // Get manager dashboard overview stats
  getManagerOverviewStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "manager") {
      throw new Error("Access denied - manager only");
    }

    const managerId = ctx.session.user.id;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // Get teacher count
    const teacherCount = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(and(eq(user.role, "teacher"), eq(user.managerId, managerId)));

    // Get student count
    const studentCount = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(and(eq(user.role, "student"), eq(user.managerId, managerId)));

    // Get active classes (classes from teachers under this manager)
    const teacherIds = await ctx.db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.role, "teacher"), eq(user.managerId, managerId)));

    const classCount =
      teacherIds.length > 0
        ? await ctx.db
            .select({ count: sql<number>`count(*)::int` })
            .from(classes)
            .where(
              inArray(
                classes.teacherId,
                teacherIds.map((t) => t.id)
              )
            )
        : [{ count: 0 }];

    // Get this month's revenue (paid tuition)
    const studentIds = await ctx.db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.role, "student"), eq(user.managerId, managerId)));

    const monthlyRevenue =
      studentIds.length > 0
        ? await ctx.db
            .select({
              total: sql<number>`coalesce(sum(${tuitionBilling.amount}), 0)::int`,
            })
            .from(tuitionBilling)
            .where(
              and(
                inArray(
                  tuitionBilling.studentId,
                  studentIds.map((s) => s.id)
                ),
                eq(tuitionBilling.billingMonth, currentMonth),
                eq(tuitionBilling.status, "paid")
              )
            )
        : [{ total: 0 }];

    return {
      totalTeachers: teacherCount[0]?.count ?? 0,
      totalStudents: studentCount[0]?.count ?? 0,
      activeClasses: classCount[0]?.count ?? 0,
      monthlyRevenue: monthlyRevenue[0]?.total ?? 0,
    };
  }),

  // Get retention metrics based on last activity date
  getRetentionMetrics: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const managerId = ctx.session.user.id;
      const now = new Date();

      // Get all students under this manager
      const students = await ctx.db
        .select({ id: user.id, createdAt: user.createdAt })
        .from(user)
        .where(and(eq(user.role, "student"), eq(user.managerId, managerId)));

      const studentIds = students.map((s) => s.id);
      if (studentIds.length === 0) {
        return {
          currentRetentionRate: 0,
          monthlyRetention: [],
          totalStudents: 0,
          activeStudents: 0,
        };
      }

      // Calculate retention for each month
      const monthlyRetention = [];
      for (let i = input.months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthStr = `${monthDate.getFullYear()}-${String(
          monthDate.getMonth() + 1
        ).padStart(2, "0")}`;
        const monthEndStr = monthEnd.toISOString().split("T")[0]!;

        // Students who existed at that time (enrolled before month end)
        const existingStudents = students.filter(
          (s) => s.createdAt && new Date(s.createdAt) <= monthEnd
        );

        if (existingStudents.length === 0) {
          monthlyRetention.push({
            month: monthStr,
            retentionRate: 0,
            totalStudents: 0,
            activeStudents: 0,
          });
          continue;
        }

        const existingIds = existingStudents.map((s) => s.id);

        // Check activity from submissions
        const submissionActivity = await ctx.db
          .select({ studentId: submissions.studentId })
          .from(submissions)
          .innerJoin(
            assignments,
            eq(submissions.assignmentId, assignments.assignmentId)
          )
          .innerJoin(classes, eq(assignments.classId, classes.classId))
          .where(
            and(
              inArray(submissions.studentId, existingIds),
              gte(submissions.submittedAt, monthDate),
              lte(submissions.submittedAt, monthEnd)
            )
          )
          .groupBy(submissions.studentId);

        // Check activity from attendance
        const attendanceActivity = await ctx.db
          .select({ studentId: studentAttendanceLogs.studentId })
          .from(studentAttendanceLogs)
          .where(
            and(
              inArray(studentAttendanceLogs.studentId, existingIds),
              gte(
                studentAttendanceLogs.sessionDate,
                monthStr.slice(0, 7) + "-01"
              ),
              lte(studentAttendanceLogs.sessionDate, monthEndStr),
              eq(studentAttendanceLogs.isPresent, true)
            )
          )
          .groupBy(studentAttendanceLogs.studentId);

        // Combine active students (from either submissions or attendance)
        const activeFromSubmissions = new Set(
          submissionActivity.map((s) => s.studentId)
        );
        const activeFromAttendance = new Set(
          attendanceActivity.map((s) => s.studentId)
        );
        const allActive = new Set([
          ...activeFromSubmissions,
          ...activeFromAttendance,
        ]);

        const retentionRate =
          existingStudents.length > 0
            ? Math.round((allActive.size / existingStudents.length) * 100)
            : 0;

        monthlyRetention.push({
          month: monthStr,
          retentionRate,
          totalStudents: existingStudents.length,
          activeStudents: allActive.size,
        });
      }

      // Current retention rate (last month)
      const currentRetention = monthlyRetention[monthlyRetention.length - 1];

      return {
        currentRetentionRate: currentRetention?.retentionRate ?? 0,
        monthlyRetention,
        totalStudents: currentRetention?.totalStudents ?? 0,
        activeStudents: currentRetention?.activeStudents ?? 0,
      };
    }),

  // Get assignment completion metrics
  getAssignmentCompletionMetrics: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const managerId = ctx.session.user.id;
      const now = new Date();
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth() - input.months + 1,
        1
      );

      // Get teachers under this manager
      const teachers = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.role, "teacher"), eq(user.managerId, managerId)));

      const teacherIds = teachers.map((t) => t.id);
      if (teacherIds.length === 0) {
        return {
          overallCompletionRate: 0,
          onTimeRate: 0,
          lateRate: 0,
          byClass: [],
        };
      }

      // Get classes from these teachers
      const teacherClasses = await ctx.db
        .select({ classId: classes.classId, className: classes.className })
        .from(classes)
        .where(inArray(classes.teacherId, teacherIds));

      const classIds = teacherClasses.map((c) => c.classId);
      if (classIds.length === 0) {
        return {
          overallCompletionRate: 0,
          onTimeRate: 0,
          lateRate: 0,
          byClass: [],
        };
      }

      // Get students under this manager
      const students = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.role, "student"), eq(user.managerId, managerId)));

      const studentIds = students.map((s) => s.id);

      // Get assignments in date range
      const assignmentList = await ctx.db
        .select({
          assignmentId: assignments.assignmentId,
          classId: assignments.classId,
          dueDate: assignments.dueDate,
        })
        .from(assignments)
        .where(
          and(
            inArray(assignments.classId, classIds),
            gte(assignments.createdAt, startDate)
          )
        );

      if (assignmentList.length === 0 || studentIds.length === 0) {
        return {
          overallCompletionRate: 0,
          onTimeRate: 0,
          lateRate: 0,
          byClass: teacherClasses.map((c) => ({
            classId: c.classId,
            className: c.className,
            completionRate: 0,
            onTimeRate: 0,
          })),
        };
      }

      // Get enrollments to know which students should submit which assignments
      const enrollmentData = await ctx.db
        .select({
          studentId: enrollments.studentId,
          classId: enrollments.classId,
        })
        .from(enrollments)
        .where(
          and(
            inArray(enrollments.studentId, studentIds),
            inArray(enrollments.classId, classIds)
          )
        );

      // Calculate expected submissions per assignment
      const expectedSubmissions = new Map<string, number>();
      const classEnrollments = new Map<string, Set<string>>();

      for (const e of enrollmentData) {
        if (!classEnrollments.has(e.classId)) {
          classEnrollments.set(e.classId, new Set());
        }
        classEnrollments.get(e.classId)!.add(e.studentId);
      }

      for (const a of assignmentList) {
        const enrolledCount = classEnrollments.get(a.classId)?.size ?? 0;
        expectedSubmissions.set(a.assignmentId, enrolledCount);
      }

      // Get actual submissions
      const submissionData = await ctx.db
        .select({
          assignmentId: submissions.assignmentId,
          submittedAt: submissions.submittedAt,
          studentId: submissions.studentId,
        })
        .from(submissions)
        .where(
          and(
            inArray(
              submissions.assignmentId,
              assignmentList.map((a) => a.assignmentId)
            ),
            inArray(submissions.studentId, studentIds)
          )
        );

      // Calculate metrics
      let totalExpected = 0;
      let totalSubmitted = 0;
      let onTime = 0;
      let late = 0;

      const byClassMap = new Map<
        string,
        { expected: number; submitted: number; onTime: number }
      >();

      for (const a of assignmentList) {
        const expected = expectedSubmissions.get(a.assignmentId) ?? 0;
        totalExpected += expected;

        if (!byClassMap.has(a.classId)) {
          byClassMap.set(a.classId, { expected: 0, submitted: 0, onTime: 0 });
        }
        byClassMap.get(a.classId)!.expected += expected;
      }

      for (const s of submissionData) {
        totalSubmitted++;
        const assignment = assignmentList.find(
          (a) => a.assignmentId === s.assignmentId
        );

        if (assignment) {
          if (!byClassMap.has(assignment.classId)) {
            byClassMap.set(assignment.classId, {
              expected: 0,
              submitted: 0,
              onTime: 0,
            });
          }
          byClassMap.get(assignment.classId)!.submitted++;

          if (assignment.dueDate && s.submittedAt <= assignment.dueDate) {
            onTime++;
            byClassMap.get(assignment.classId)!.onTime++;
          } else {
            late++;
          }
        }
      }

      const overallCompletionRate =
        totalExpected > 0
          ? Math.round((totalSubmitted / totalExpected) * 100)
          : 0;
      const onTimeRate =
        totalSubmitted > 0 ? Math.round((onTime / totalSubmitted) * 100) : 0;
      const lateRate =
        totalSubmitted > 0 ? Math.round((late / totalSubmitted) * 100) : 0;

      const byClass = teacherClasses.map((c) => {
        const stats = byClassMap.get(c.classId) ?? {
          expected: 0,
          submitted: 0,
          onTime: 0,
        };
        return {
          classId: c.classId,
          className: c.className,
          completionRate:
            stats.expected > 0
              ? Math.round((stats.submitted / stats.expected) * 100)
              : 0,
          onTimeRate:
            stats.submitted > 0
              ? Math.round((stats.onTime / stats.submitted) * 100)
              : 0,
        };
      });

      return {
        overallCompletionRate,
        onTimeRate,
        lateRate,
        byClass,
      };
    }),

  // Get enrollment trends over time
  getEnrollmentTrends: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const managerId = ctx.session.user.id;
      const now = new Date();

      // Get students under this manager
      const students = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.role, "student"), eq(user.managerId, managerId)));

      const studentIds = students.map((s) => s.id);
      if (studentIds.length === 0) {
        const emptyMonths = [];
        for (let i = input.months - 1; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          emptyMonths.push({
            month: `${monthDate.getFullYear()}-${String(
              monthDate.getMonth() + 1
            ).padStart(2, "0")}`,
            newEnrollments: 0,
            totalEnrollments: 0,
          });
        }
        return { trends: emptyMonths };
      }

      // Get enrollments data
      const enrollmentData = await ctx.db
        .select({
          enrolledAt: enrollments.enrolledAt,
        })
        .from(enrollments)
        .where(inArray(enrollments.studentId, studentIds));

      // Calculate monthly trends
      const trends = [];
      let cumulativeTotal = 0;

      // First, count enrollments before the period
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth() - input.months + 1,
        1
      );
      cumulativeTotal = enrollmentData.filter(
        (e) => e.enrolledAt && new Date(e.enrolledAt) < startDate
      ).length;

      for (let i = input.months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59
        );
        const monthStr = `${monthStart.getFullYear()}-${String(
          monthStart.getMonth() + 1
        ).padStart(2, "0")}`;

        const newEnrollments = enrollmentData.filter(
          (e) =>
            e.enrolledAt &&
            new Date(e.enrolledAt) >= monthStart &&
            new Date(e.enrolledAt) <= monthEnd
        ).length;

        cumulativeTotal += newEnrollments;

        trends.push({
          month: monthStr,
          newEnrollments,
          totalEnrollments: cumulativeTotal,
        });
      }

      return { trends };
    }),

  // Get class performance metrics
  getClassPerformanceMetrics: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "manager") {
        throw new Error("Access denied - manager only");
      }

      const managerId = ctx.session.user.id;
      const now = new Date();
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth() - input.months + 1,
        1
      );

      // Get teachers under this manager
      const teachers = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.role, "teacher"), eq(user.managerId, managerId)));

      const teacherIds = teachers.map((t) => t.id);
      if (teacherIds.length === 0) {
        return { classPerformance: [] };
      }

      // Get classes from these teachers
      const teacherClasses = await ctx.db
        .select({
          classId: classes.classId,
          className: classes.className,
        })
        .from(classes)
        .where(inArray(classes.teacherId, teacherIds));

      if (teacherClasses.length === 0) {
        return { classPerformance: [] };
      }

      const classIds = teacherClasses.map((c) => c.classId);

      // Get assignments for these classes
      const assignmentList = await ctx.db
        .select({
          assignmentId: assignments.assignmentId,
          classId: assignments.classId,
        })
        .from(assignments)
        .where(
          and(
            inArray(assignments.classId, classIds),
            gte(assignments.createdAt, startDate)
          )
        );

      if (assignmentList.length === 0) {
        return {
          classPerformance: teacherClasses.map((c) => ({
            classId: c.classId,
            className: c.className,
            averageGrade: 0,
            submissionCount: 0,
          })),
        };
      }

      // Get submissions with grades
      const submissionData = await ctx.db
        .select({
          assignmentId: submissions.assignmentId,
          grade: submissions.grade,
        })
        .from(submissions)
        .where(
          and(
            inArray(
              submissions.assignmentId,
              assignmentList.map((a) => a.assignmentId)
            ),
            sql`${submissions.grade} IS NOT NULL`
          )
        );

      // Calculate average grade per class
      const classGrades = new Map<string, { total: number; count: number }>();

      for (const s of submissionData) {
        const assignment = assignmentList.find(
          (a) => a.assignmentId === s.assignmentId
        );
        if (assignment && s.grade !== null) {
          if (!classGrades.has(assignment.classId)) {
            classGrades.set(assignment.classId, { total: 0, count: 0 });
          }
          classGrades.get(assignment.classId)!.total += s.grade;
          classGrades.get(assignment.classId)!.count++;
        }
      }

      const classPerformance = teacherClasses.map((c) => {
        const grades = classGrades.get(c.classId);
        return {
          classId: c.classId,
          className: c.className,
          averageGrade:
            grades && grades.count > 0
              ? Math.round(grades.total / grades.count)
              : 0,
          submissionCount: grades?.count ?? 0,
        };
      });

      // Sort by average grade descending
      classPerformance.sort((a, b) => b.averageGrade - a.averageGrade);

      return { classPerformance };
    }),

  // ========== PARENT NOTIFICATIONS ==========

  updateParentConsent: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        enableWeekly: z.boolean().optional(),
        enableMonthly: z.boolean().optional(),
        enableUrgentAlerts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only manager can update parent consent
      if (ctx.session.user.role !== "manager") {
        throw new Error(
          "Unauthorized: Only managers can update parent consent"
        );
      }

      // Verify student belongs to this manager's center
      const student = await ctx.db
        .select()
        .from(user)
        .where(
          and(
            eq(user.id, input.studentId),
            eq(user.managerId, ctx.session.user.id),
            eq(user.role, "student")
          )
        );

      if (student.length === 0) {
        throw new Error("Student not found or not authorized");
      }

      // Check if consent record exists
      const existingConsent = await ctx.db
        .select()
        .from(parentConsent)
        .where(eq(parentConsent.studentId, input.studentId));

      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (input.enableWeekly !== undefined) {
        updateData.enableWeekly = input.enableWeekly;
      }
      if (input.enableMonthly !== undefined) {
        updateData.enableMonthly = input.enableMonthly;
      }
      if (input.enableUrgentAlerts !== undefined) {
        updateData.enableUrgentAlerts = input.enableUrgentAlerts;
      }

      if (existingConsent.length > 0) {
        // Update existing consent
        return await ctx.db
          .update(parentConsent)
          .set(updateData)
          .where(eq(parentConsent.studentId, input.studentId))
          .returning();
      } else {
        // Create new consent record
        const consentId = crypto.randomUUID();
        return await ctx.db
          .insert(parentConsent)
          .values({
            consentId,
            studentId: input.studentId,
            enableWeekly: input.enableWeekly ?? true,
            enableMonthly: input.enableMonthly ?? true,
            enableUrgentAlerts: input.enableUrgentAlerts ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }
    }),

  getParentConsent: protectedProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Only manager can view parent consent
      if (ctx.session.user.role !== "manager") {
        throw new Error("Unauthorized: Only managers can view parent consent");
      }

      // Verify student belongs to this manager's center
      const student = await ctx.db
        .select()
        .from(user)
        .where(
          and(
            eq(user.id, input.studentId),
            eq(user.managerId, ctx.session.user.id),
            eq(user.role, "student")
          )
        );

      if (student.length === 0) {
        throw new Error("Student not found or not authorized");
      }

      const consent = await ctx.db
        .select()
        .from(parentConsent)
        .where(eq(parentConsent.studentId, input.studentId));

      return {
        studentId: input.studentId,
        studentEmail: student[0]!.email,
        parentEmail: student[0]!.parentEmail,
        parentPhone: student[0]!.parentPhone,
        enableWeekly: consent.length > 0 ? consent[0]!.enableWeekly : true,
        enableMonthly: consent.length > 0 ? consent[0]!.enableMonthly : true,
        enableUrgentAlerts:
          consent.length > 0 ? consent[0]!.enableUrgentAlerts : true,
      };
    }),

  sendWeeklyReportToParent: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only teacher or manager can send weekly report
      if (!["teacher", "manager"].includes(ctx.session.user.role)) {
        throw new Error(
          "Unauthorized: Only teachers and managers can send reports"
        );
      }

      // Verify access: teacher must own the class, manager must own the center
      let classRecord;
      if (ctx.session.user.role === "teacher") {
        classRecord = await ctx.db
          .select()
          .from(classes)
          .where(
            and(
              eq(classes.classId, input.classId),
              eq(classes.teacherId, ctx.session.user.id)
            )
          );
      } else {
        // Manager: verify student and class belong to their center
        const classData = await ctx.db
          .select()
          .from(classes)
          .where(eq(classes.classId, input.classId));

        if (classData.length === 0) {
          throw new Error("Class not found");
        }

        classRecord = classData;
      }

      if (classRecord.length === 0) {
        throw new Error("Class not found or not authorized");
      }

      // Get student
      const studentData = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.studentId));

      if (studentData.length === 0 || studentData[0]!.role !== "student") {
        throw new Error("Student not found");
      }

      const student = studentData[0]!;

      // Check parent consent
      const consent = await ctx.db
        .select()
        .from(parentConsent)
        .where(eq(parentConsent.studentId, input.studentId));

      const enableWeekly =
        consent.length === 0 ? true : consent[0]!.enableWeekly;

      if (!enableWeekly) {
        throw new Error("Parent has disabled weekly reports");
      }

      // Get performance data
      const performanceData = await getStudentPerformanceData(
        ctx.db,
        input.studentId,
        input.classId
      );

      // Send email to both parent and student
      const recipients: { email?: string | null }[] = [
        { email: student.email },
      ];
      if (student.parentEmail) {
        recipients.push({ email: student.parentEmail });
      }

      const validRecipients = recipients
        .map((r) => r.email)
        .filter(Boolean) as string[];

      if (validRecipients.length === 0) {
        throw new Error("No valid email recipient");
      }

      await sendWeeklyPerformanceReport({
        studentEmail: student.email,
        parentEmail: student.parentEmail || "",
        studentName: student.name,
        className: classRecord[0]!.className,
        performanceData,
      });

      return {
        success: true,
        message: "Weekly report sent successfully",
        recipients: validRecipients,
      };
    }),

  sendMonthlyBillingReportToParent: protectedProcedure
    .input(z.object({ studentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only manager can send billing reports
      if (ctx.session.user.role !== "manager") {
        throw new Error("Unauthorized: Only managers can send billing reports");
      }

      // Verify student belongs to manager's center
      const student = await ctx.db
        .select()
        .from(user)
        .where(
          and(
            eq(user.id, input.studentId),
            eq(user.managerId, ctx.session.user.id),
            eq(user.role, "student")
          )
        );

      if (student.length === 0) {
        throw new Error("Student not found or not authorized");
      }

      const studentData = student[0]!;

      // Check parent consent
      const consent = await ctx.db
        .select()
        .from(parentConsent)
        .where(eq(parentConsent.studentId, input.studentId));

      const enableMonthly =
        consent.length === 0 ? true : consent[0]!.enableMonthly;

      if (!enableMonthly) {
        throw new Error("Parent has disabled monthly reports");
      }

      // Get most recent billing record
      const billingRecords = await ctx.db
        .select({
          billingId: tuitionBilling.billingId,
          amount: tuitionBilling.amount,
          billingMonth: tuitionBilling.billingMonth,
          dueDate: tuitionBilling.dueDate,
          status: tuitionBilling.status,
          paymentMethod: tuitionBilling.paymentMethod,
          invoiceNumber: tuitionBilling.invoiceNumber,
          classId: tuitionBilling.classId,
          className: classes.className,
        })
        .from(tuitionBilling)
        .leftJoin(classes, eq(tuitionBilling.classId, classes.classId))
        .where(eq(tuitionBilling.studentId, input.studentId))
        .orderBy(desc(tuitionBilling.billingMonth))
        .limit(1);

      if (billingRecords.length === 0) {
        throw new Error("No billing records found for this student");
      }

      const billing = billingRecords[0]!;
      const billingData = {
        amount: billing.amount,
        billingMonth: billing.billingMonth,
        dueDate: new Date(billing.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        status: billing.status as "pending" | "paid" | "overdue" | "cancelled",
        paymentMethods: ["Cash", "Bank Transfer", "MoMo", "VNPay"],
        invoiceNumber: billing.invoiceNumber || undefined,
      };

      const recipients: { email?: string | null }[] = [
        { email: studentData.email },
      ];
      if (studentData.parentEmail) {
        recipients.push({ email: studentData.parentEmail });
      }

      const validRecipients = recipients
        .map((r) => r.email)
        .filter(Boolean) as string[];

      if (validRecipients.length === 0) {
        throw new Error("No valid email recipient");
      }

      await sendMonthlyBillingReport({
        studentEmail: studentData.email,
        parentEmail: studentData.parentEmail || "",
        studentName: studentData.name,
        className: billing.className || "N/A",
        billingData,
      });

      return {
        success: true,
        message: "Monthly billing report sent successfully",
        recipients: validRecipients,
      };
    }),

  sendUrgentAlertToParent: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        title: z.string().min(1),
        message: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only teacher or manager can send urgent alert
      if (!["teacher", "manager"].includes(ctx.session.user.role)) {
        throw new Error(
          "Unauthorized: Only teachers and managers can send alerts"
        );
      }

      // If teacher, verify student is in one of their classes
      let student;
      if (ctx.session.user.role === "teacher") {
        const studentClasses = await ctx.db
          .select({
            studentId: enrollments.studentId,
          })
          .from(enrollments)
          .innerJoin(classes, eq(enrollments.classId, classes.classId))
          .where(eq(classes.teacherId, ctx.session.user.id));

        const studentIds = studentClasses.map((s) => s.studentId);
        if (!studentIds.includes(input.studentId)) {
          throw new Error("Student not in any of your classes");
        }

        const studentData = await ctx.db
          .select()
          .from(user)
          .where(eq(user.id, input.studentId));

        if (studentData.length === 0) {
          throw new Error("Student not found");
        }

        student = studentData[0]!;
      } else {
        // Manager: verify student belongs to center
        const studentData = await ctx.db
          .select()
          .from(user)
          .where(
            and(
              eq(user.id, input.studentId),
              eq(user.managerId, ctx.session.user.id),
              eq(user.role, "student")
            )
          );

        if (studentData.length === 0) {
          throw new Error("Student not found or not authorized");
        }

        student = studentData[0]!;
      }

      // Check parent consent
      const consent = await ctx.db
        .select()
        .from(parentConsent)
        .where(eq(parentConsent.studentId, input.studentId));

      const enableUrgentAlerts =
        consent.length === 0 ? true : consent[0]!.enableUrgentAlerts;

      if (!enableUrgentAlerts) {
        throw new Error("Parent has disabled urgent alerts");
      }

      // Send email
      const recipients: { email?: string | null }[] = [
        { email: student.email },
      ];
      if (student.parentEmail) {
        recipients.push({ email: student.parentEmail });
      }

      const validRecipients = recipients
        .map((r) => r.email)
        .filter(Boolean) as string[];

      if (validRecipients.length === 0) {
        throw new Error("No valid email recipient");
      }

      await sendUrgentAlert({
        studentEmail: student.email,
        parentEmail: student.parentEmail || "",
        studentName: student.name,
        title: input.title,
        message: input.message,
      });

      return {
        success: true,
        message: "Urgent alert sent successfully",
        recipients: validRecipients,
      };
    }),
});

export type EducationRouter = typeof educationRouter;
