import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { classes } from "@edura/db/schema/education";
import { eq } from "drizzle-orm";

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
});

export type EducationRouter = typeof educationRouter;
