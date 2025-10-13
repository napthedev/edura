import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { classes, enrollments, assignments } from "@edura/db/schema/education";
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
});

export type EducationRouter = typeof educationRouter;
