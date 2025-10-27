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
} from "@edura/db/schema/education";
import { eq, and } from "drizzle-orm";
import { user } from "@edura/db/schema/auth";

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
  getClassAssignments: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(assignments)
        .where(eq(assignments.classId, input.classId))
        .orderBy(assignments.createdAt);
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
  getStudentClasses: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        classId: classes.classId,
        className: classes.className,
        classCode: classes.classCode,
        teacherId: classes.teacherId,
        createdAt: classes.createdAt,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.classId))
      .where(eq(enrollments.studentId, ctx.session.user.id));
  }),
  getClassTeacher: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const teacherData = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(classes)
        .innerJoin(user, eq(classes.teacherId, user.id))
        .where(eq(classes.classId, input.classId));

      if (teacherData.length === 0) {
        throw new Error("Teacher not found");
      }

      return teacherData[0];
    }),
  leaveClass: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the student is enrolled in the class
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

      await ctx.db
        .delete(enrollments)
        .where(
          and(
            eq(enrollments.studentId, ctx.session.user.id),
            eq(enrollments.classId, input.classId)
          )
        );

      return { success: true };
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

      // Create submission
      const submission = await ctx.db
        .insert(submissions)
        .values({
          submissionId: crypto.randomUUID(),
          assignmentId: input.assignmentId,
          studentId: ctx.session.user.id,
          submissionContent: input.submissionContent,
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
});

export type EducationRouter = typeof educationRouter;
