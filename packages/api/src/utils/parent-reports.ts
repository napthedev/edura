import { eq, and } from "drizzle-orm";
import { db } from "@edura/db";
import { submissions, assignments, tuitionBilling } from "@edura/db";

type DB = typeof db;

export interface StudentPerformanceData {
  assignmentCount: number;
  averageGrade: number;
  accuracyPercentage: number;
  trend: "improving" | "stable" | "declining";
}

/**
 * Get student performance data for a specific class
 * Calculates: number of assignments completed, average grade, accuracy percentage, and trend
 */
export async function getStudentPerformanceData(
  db: DB,
  studentId: string,
  classId: string
): Promise<StudentPerformanceData> {
  // Get all submissions for this student in this class
  const studentSubmissions = await db
    .select({
      submissionId: submissions.submissionId,
      grade: submissions.grade,
      submittedAt: submissions.submittedAt,
      assignmentId: submissions.assignmentId,
    })
    .from(submissions)
    .innerJoin(
      assignments,
      eq(submissions.assignmentId, assignments.assignmentId)
    )
    .where(
      and(
        eq(submissions.studentId, studentId),
        eq(assignments.classId, classId)
      )
    )
    .orderBy(submissions.submittedAt);

  if (studentSubmissions.length === 0) {
    return {
      assignmentCount: 0,
      averageGrade: 0,
      accuracyPercentage: 0,
      trend: "stable",
    };
  }

  // Calculate average grade from graded submissions
  const gradedSubmissions = studentSubmissions.filter((s) => s.grade !== null);
  const averageGrade =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) /
        gradedSubmissions.length
      : 0;

  // Calculate accuracy percentage (submissions with grade >= 80% considered accurate)
  const accurateSubmissions = gradedSubmissions.filter(
    (s) => (s.grade || 0) >= 80
  );
  const accuracyPercentage =
    gradedSubmissions.length > 0
      ? (accurateSubmissions.length / gradedSubmissions.length) * 100
      : 0;

  // Calculate trend based on last 5 submissions vs previous submissions
  let trend: "improving" | "stable" | "declining" = "stable";
  if (gradedSubmissions.length >= 5) {
    const recentSubmissions = gradedSubmissions.slice(-5);
    const previousSubmissions = gradedSubmissions.slice(0, -5);

    const recentAvg =
      recentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) /
      recentSubmissions.length;
    const previousAvg =
      previousSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) /
      previousSubmissions.length;

    const difference = recentAvg - previousAvg;
    if (difference > 5) trend = "improving";
    else if (difference < -5) trend = "declining";
  }

  return {
    assignmentCount: studentSubmissions.length,
    averageGrade: Math.round(averageGrade * 100) / 100,
    accuracyPercentage: Math.round(accuracyPercentage * 100) / 100,
    trend,
  };
}

export interface StudentBillingData {
  amount: number;
  billingMonth: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paymentMethods: string[];
  invoiceNumber?: string;
}

/**
 * Get student billing data for a specific class
 * Returns the most recent billing record
 */
export async function getStudentBillingData(
  db: DB,
  studentId: string,
  classId: string
): Promise<StudentBillingData | null> {
  const billingRecord = await db
    .select({
      billingId: tuitionBilling.billingId,
      amount: tuitionBilling.amount,
      billingMonth: tuitionBilling.billingMonth,
      dueDate: tuitionBilling.dueDate,
      status: tuitionBilling.status,
      paymentMethod: tuitionBilling.paymentMethod,
      invoiceNumber: tuitionBilling.invoiceNumber,
    })
    .from(tuitionBilling)
    .where(
      and(
        eq(tuitionBilling.studentId, studentId),
        eq(tuitionBilling.classId, classId)
      )
    )
    .orderBy(tuitionBilling.billingMonth)
    .limit(1);

  if (billingRecord.length === 0) {
    return null;
  }

  const billing = billingRecord[0]!;

  // For now, show all available payment methods; in future, could be customized per center
  const paymentMethods = ["Cash", "Bank Transfer", "MoMo", "VNPay"];

  // Format due date
  const dueDateObj = new Date(billing.dueDate);
  const dueDateFormatted = dueDateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    amount: billing.amount,
    billingMonth: billing.billingMonth,
    dueDate: dueDateFormatted,
    status: billing.status,
    paymentMethods,
    invoiceNumber: billing.invoiceNumber || undefined,
  };
}
