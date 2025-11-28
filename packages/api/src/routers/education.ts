import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
  classes,
  enrollments,
  assignments,
  submissions,
  lectures,
  announcements,
  schedules,
  classJoinRequests,
  notifications,
} from "@edura/db/schema/education";
import { eq, and, sql } from "drizzle-orm";
import { user } from "@edura/db/schema/auth";

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
          teacherId: ctx.session.user.id,
        })
        .returning();

      return newClass[0];
    }),
  getClasses: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(classes)
      .where(eq(classes.teacherId, ctx.session.user.id));
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
        title: z.string().min(1),
        description: z.string().optional(),
        date: z.string(), // YYYY-MM-DD format
        time: z.string(), // HH:MM format
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

      const scheduleId = crypto.randomUUID();
      // Combine date and time into a single timestamp
      const scheduledAt = new Date(`${input.date}T${input.time}:00`);

      const newSchedule = await ctx.db
        .insert(schedules)
        .values({
          scheduleId,
          classId: input.classId,
          title: input.title,
          description: input.description,
          scheduledAt,
          meetingLink: input.meetingLink,
        })
        .returning();

      return newSchedule[0];
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
        .from(schedules)
        .where(eq(schedules.classId, input.classId))
        .orderBy(schedules.scheduledAt);
    }),
  updateSchedule: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        date: z.string().optional(), // YYYY-MM-DD format
        time: z.string().optional(), // HH:MM format
        meetingLink: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the schedule belongs to the teacher
      const scheduleData = await ctx.db
        .select()
        .from(schedules)
        .innerJoin(classes, eq(schedules.classId, classes.classId))
        .where(
          and(
            eq(schedules.scheduleId, input.scheduleId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (scheduleData.length === 0) {
        throw new Error("Schedule not found or access denied");
      }

      const existingSchedule = scheduleData[0]!;
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.date !== undefined && input.time !== undefined) {
        updateData.scheduledAt = new Date(`${input.date}T${input.time}:00`);
      } else if (input.date !== undefined) {
        // Update only date, keep existing time
        const existingTime = existingSchedule.schedules.scheduledAt
          .toTimeString()
          .slice(0, 5);
        updateData.scheduledAt = new Date(`${input.date}T${existingTime}:00`);
      } else if (input.time !== undefined) {
        // Update only time, keep existing date
        const existingDate = existingSchedule.schedules.scheduledAt
          .toISOString()
          .slice(0, 10);
        updateData.scheduledAt = new Date(`${existingDate}T${input.time}:00`);
      }
      if (input.meetingLink !== undefined)
        updateData.meetingLink = input.meetingLink;

      await ctx.db
        .update(schedules)
        .set(updateData)
        .where(eq(schedules.scheduleId, input.scheduleId));

      return { success: true };
    }),
  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the schedule belongs to the teacher
      const scheduleData = await ctx.db
        .select()
        .from(schedules)
        .innerJoin(classes, eq(schedules.classId, classes.classId))
        .where(
          and(
            eq(schedules.scheduleId, input.scheduleId),
            eq(classes.teacherId, ctx.session.user.id)
          )
        );

      if (scheduleData.length === 0) {
        throw new Error("Schedule not found or access denied");
      }

      await ctx.db
        .delete(schedules)
        .where(eq(schedules.scheduleId, input.scheduleId));

      return { success: true };
    }),
  getAllTeacherSchedules: protectedProcedure.query(async ({ ctx }) => {
    // Fetch all schedules for classes owned by the teacher
    return await ctx.db
      .select()
      .from(schedules)
      .innerJoin(classes, eq(schedules.classId, classes.classId))
      .where(eq(classes.teacherId, ctx.session.user.id))
      .orderBy(schedules.scheduledAt);
  }),
  getStudentSchedules: protectedProcedure.query(async ({ ctx }) => {
    // Fetch all schedules for classes the student is enrolled in
    return await ctx.db
      .select()
      .from(schedules)
      .innerJoin(classes, eq(schedules.classId, classes.classId))
      .innerJoin(
        enrollments,
        and(
          eq(enrollments.classId, classes.classId),
          eq(enrollments.studentId, ctx.session.user.id)
        )
      )
      .orderBy(schedules.scheduledAt);
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
});

export type EducationRouter = typeof educationRouter;
