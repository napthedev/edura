import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
  tuitionBilling,
  classes,
  enrollments,
  user,
} from "@edura/db/schema/education";
import { eq, and, sql, inArray } from "drizzle-orm";

// Add after existing student billing endpoints (around line 2363)

// Get teacher billing overview (revenue stats by class)
export const getTeacherBillingOverview = protectedProcedure.query(
  async ({ ctx }) => {
    if (ctx.session.user.role !== "teacher") {
      throw new Error("Access denied - teacher only");
    }

    // Get all classes taught by this teacher
    const teacherClasses = await ctx.db
      .select({
        classId: classes.classId,
        className: classes.className,
        tuitionRate: classes.tuitionRate,
      })
      .from(classes)
      .where(eq(classes.teacherId, ctx.session.user.id));

    const classIds = teacherClasses.map((c) => c.classId);

    if (classIds.length === 0) {
      return {
        totalRevenue: 0,
        pendingRevenue: 0,
        paidRevenue: 0,
        classBillings: [],
      };
    }

    // Get billing stats per class
    const billingStats = await ctx.db
      .select({
        classId: tuitionBilling.classId,
        status: tuitionBilling.status,
        totalAmount: sql<number>`sum(${tuitionBilling.amount})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(tuitionBilling)
      .where(inArray(tuitionBilling.classId, classIds))
      .groupBy(tuitionBilling.classId, tuitionBilling.status);

    // Organize stats by class
    const classBillings = teacherClasses.map((cls) => {
      const stats = billingStats.filter((s) => s.classId === cls.classId);
      const pending = stats.find((s) => s.status === "pending");
      const paid = stats.find((s) => s.status === "paid");

      return {
        classId: cls.classId,
        className: cls.className,
        tuitionRate: cls.tuitionRate,
        pendingAmount: pending?.totalAmount || 0,
        paidAmount: paid?.totalAmount || 0,
        pendingCount: pending?.count || 0,
        paidCount: paid?.count || 0,
      };
    });

    const totalRevenue = classBillings.reduce(
      (acc, c) => acc + c.paidAmount + c.pendingAmount,
      0
    );
    const paidRevenue = classBillings.reduce((acc, c) => acc + c.paidAmount, 0);
    const pendingRevenue = classBillings.reduce(
      (acc, c) => acc + c.pendingAmount,
      0
    );

    return {
      totalRevenue,
      pendingRevenue,
      paidRevenue,
      classBillings,
    };
  }
);

// Get student payment status for teacher's classes
export const getTeacherStudentPaymentStatus = protectedProcedure
  .input(z.object({ classId: z.string().optional() }))
  .query(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "teacher") {
      throw new Error("Access denied - teacher only");
    }

    // Build query to get students with their payment status
    let query = ctx.db
      .select({
        studentId: user.id,
        studentName: user.name,
        studentEmail: user.email,
        classId: classes.classId,
        className: classes.className,
        pendingBills: sql<number>`count(case when ${tuitionBilling.status} = 'pending' then 1 end)::int`,
        paidBills: sql<number>`count(case when ${tuitionBilling.status} = 'paid' then 1 end)::int`,
        totalDue: sql<number>`sum(case when ${tuitionBilling.status} = 'pending' then ${tuitionBilling.amount} else 0 end)::int`,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.classId))
      .innerJoin(user, eq(enrollments.studentId, user.id))
      .leftJoin(
        tuitionBilling,
        and(
          eq(tuitionBilling.studentId, user.id),
          eq(tuitionBilling.classId, classes.classId)
        )
      )
      .where(eq(classes.teacherId, ctx.session.user.id));

    if (input.classId) {
      query = query.where(eq(classes.classId, input.classId)) as typeof query;
    }

    const students = await query.groupBy(
      user.id,
      user.name,
      user.email,
      classes.classId,
      classes.className
    );

    return students;
  });
