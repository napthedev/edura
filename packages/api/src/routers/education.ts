import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { classes, enrollments } from "@edura/db/schema/education";
import { eq, and } from "drizzle-orm";

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
});

export type EducationRouter = typeof educationRouter;
