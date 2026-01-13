import { eq, and, inArray } from "drizzle-orm";
import { user } from "@edura/db/schema/auth";
import { classes } from "@edura/db/schema/education";
import type { db as dbType } from "@edura/db";

/**
 * Authorization utilities for manager-scoped queries
 * Ensures multi-tenancy isolation between learning centers
 */

/**
 * Get all teacher IDs belonging to a specific manager
 * @param db Database instance
 * @param managerId Manager's user ID
 * @returns Array of teacher user IDs
 */
export async function getManagerTeacherIds(
  db: typeof dbType,
  managerId: string
): Promise<string[]> {
  const teachers = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "teacher"), eq(user.managerId, managerId)));

  return teachers.map((t) => t.id);
}

/**
 * Get all student IDs belonging to a specific manager
 * @param db Database instance
 * @param managerId Manager's user ID
 * @returns Array of student user IDs
 */
export async function getManagerStudentIds(
  db: typeof dbType,
  managerId: string
): Promise<string[]> {
  const students = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "student"), eq(user.managerId, managerId)));

  return students.map((s) => s.id);
}

/**
 * Get all class IDs taught by teachers belonging to a specific manager
 * @param db Database instance
 * @param managerId Manager's user ID
 * @returns Array of class IDs
 */
export async function getManagerClassIds(
  db: typeof dbType,
  managerId: string
): Promise<string[]> {
  const teacherIds = await getManagerTeacherIds(db, managerId);

  if (teacherIds.length === 0) {
    return [];
  }

  const managerClasses = await db
    .select({ classId: classes.classId })
    .from(classes)
    .where(inArray(classes.teacherId, teacherIds));

  return managerClasses.map((c) => c.classId);
}

/**
 * Verify if a teacher belongs to a specific manager
 * @param db Database instance
 * @param teacherId Teacher's user ID
 * @param managerId Manager's user ID
 * @returns True if teacher belongs to manager
 */
export async function verifyTeacherBelongsToManager(
  db: typeof dbType,
  teacherId: string,
  managerId: string
): Promise<boolean> {
  const teacher = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        eq(user.id, teacherId),
        eq(user.role, "teacher"),
        eq(user.managerId, managerId)
      )
    );

  return teacher.length > 0;
}

/**
 * Verify if a student belongs to a specific manager
 * @param db Database instance
 * @param studentId Student's user ID
 * @param managerId Manager's user ID
 * @returns True if student belongs to manager
 */
export async function verifyStudentBelongsToManager(
  db: typeof dbType,
  studentId: string,
  managerId: string
): Promise<boolean> {
  const student = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        eq(user.id, studentId),
        eq(user.role, "student"),
        eq(user.managerId, managerId)
      )
    );

  return student.length > 0;
}

/**
 * Verify if a class belongs to a manager's teachers
 * @param db Database instance
 * @param classId Class ID
 * @param managerId Manager's user ID
 * @returns True if class belongs to manager's organization
 */
export async function verifyClassBelongsToManager(
  db: typeof dbType,
  classId: string,
  managerId: string
): Promise<boolean> {
  const classData = await db
    .select({ teacherId: classes.teacherId })
    .from(classes)
    .where(eq(classes.classId, classId));

  if (classData.length === 0) {
    return false;
  }

  return verifyTeacherBelongsToManager(db, classData[0]!.teacherId, managerId);
}
