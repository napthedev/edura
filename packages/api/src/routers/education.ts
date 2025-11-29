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
} from "@edura/db/schema/education";
import { eq, and, sql } from "drizzle-orm";
import { user } from "@edura/db/schema/auth";

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
          assignmentContent: input.assignmentContent,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          testingDuration: input.testingDuration,
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

      // Calculate grade
      const assignment = assignmentData[0]!.assignment;
      const grade = gradeSubmission(
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

  // Manager endpoints - get all teachers with extended profile
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
      })
      .from(user)
      .where(eq(user.role, "teacher"))
      .orderBy(user.name);

    return teachers;
  }),

  // Manager endpoints - get all students with extended profile
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
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.role, "student"))
      .orderBy(user.name);

    return students;
  }),
});

export type EducationRouter = typeof educationRouter;
