import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { notifications } from "@edura/db/schema/education";
import { eq, and, desc, count } from "drizzle-orm";

export const notificationRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.session.user.id))
      .orderBy(desc(notifications.createdAt));
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id),
          eq(notifications.isRead, false)
        )
      );
    return result[0]?.count ?? 0;
  }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.notificationId, input.notificationId),
            eq(notifications.userId, ctx.session.user.id)
          )
        );
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.session.user.id));
    return { success: true };
  }),
});
