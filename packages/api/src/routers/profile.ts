import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { user, userEmails, userPhones } from "@edura/db/schema/auth";
import { eq, and } from "drizzle-orm";

// Simple phone number validation - allows digits, spaces, dashes, parentheses, and + prefix
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

export const profileRouter = router({
  // Get current user's profile with emails and phones
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [userProfile] = await ctx.db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (!userProfile) {
      throw new Error("User not found");
    }

    const emails = await ctx.db
      .select()
      .from(userEmails)
      .where(eq(userEmails.userId, userId));

    const phones = await ctx.db
      .select()
      .from(userPhones)
      .where(eq(userPhones.userId, userId));

    return {
      ...userProfile,
      emails,
      phones,
    };
  }),

  // Update basic profile information
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        dateOfBirth: z.coerce.date().optional().nullable(),
        address: z.string().optional().nullable(),
        grade: z.string().optional().nullable(),
        schoolName: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.dateOfBirth !== undefined)
        updateData.dateOfBirth = input.dateOfBirth;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.grade !== undefined) updateData.grade = input.grade;
      if (input.schoolName !== undefined)
        updateData.schoolName = input.schoolName;

      const [updated] = await ctx.db
        .update(user)
        .set(updateData)
        .where(eq(user.id, userId))
        .returning();

      return updated;
    }),

  // Email management
  addEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const emailId = crypto.randomUUID();

      // Check if email already exists for this user
      const existing = await ctx.db
        .select()
        .from(userEmails)
        .where(
          and(eq(userEmails.userId, userId), eq(userEmails.email, input.email))
        );

      if (existing.length > 0) {
        throw new Error("Email already exists");
      }

      // Check if this is the first email (make it primary)
      const existingEmails = await ctx.db
        .select()
        .from(userEmails)
        .where(eq(userEmails.userId, userId));

      const [newEmail] = await ctx.db
        .insert(userEmails)
        .values({
          emailId,
          userId,
          email: input.email,
          isPrimary: existingEmails.length === 0,
          isVerified: false,
        })
        .returning();

      return newEmail;
    }),

  removeEmail: protectedProcedure
    .input(
      z.object({
        emailId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if email belongs to user
      const [email] = await ctx.db
        .select()
        .from(userEmails)
        .where(
          and(
            eq(userEmails.emailId, input.emailId),
            eq(userEmails.userId, userId)
          )
        );

      if (!email) {
        throw new Error("Email not found");
      }

      // Don't allow removing primary email if there are other emails
      if (email.isPrimary) {
        const otherEmails = await ctx.db
          .select()
          .from(userEmails)
          .where(
            and(eq(userEmails.userId, userId), eq(userEmails.isPrimary, false))
          );

        if (otherEmails.length > 0) {
          throw new Error(
            "Cannot remove primary email. Set another email as primary first."
          );
        }
      }

      await ctx.db
        .delete(userEmails)
        .where(eq(userEmails.emailId, input.emailId));

      return { success: true };
    }),

  setPrimaryEmail: protectedProcedure
    .input(
      z.object({
        emailId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if email belongs to user
      const [email] = await ctx.db
        .select()
        .from(userEmails)
        .where(
          and(
            eq(userEmails.emailId, input.emailId),
            eq(userEmails.userId, userId)
          )
        );

      if (!email) {
        throw new Error("Email not found");
      }

      // Remove primary from all other emails
      await ctx.db
        .update(userEmails)
        .set({ isPrimary: false })
        .where(eq(userEmails.userId, userId));

      // Set this email as primary
      const [updated] = await ctx.db
        .update(userEmails)
        .set({ isPrimary: true })
        .where(eq(userEmails.emailId, input.emailId))
        .returning();

      return updated;
    }),

  // Phone management
  addPhone: protectedProcedure
    .input(
      z.object({
        phoneNumber: z
          .string()
          .regex(phoneRegex, "Invalid phone number format"),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const phoneId = crypto.randomUUID();

      // Check if phone already exists for this user
      const existing = await ctx.db
        .select()
        .from(userPhones)
        .where(
          and(
            eq(userPhones.userId, userId),
            eq(userPhones.phoneNumber, input.phoneNumber)
          )
        );

      if (existing.length > 0) {
        throw new Error("Phone number already exists");
      }

      // Check if this is the first phone (make it primary)
      const existingPhones = await ctx.db
        .select()
        .from(userPhones)
        .where(eq(userPhones.userId, userId));

      const [newPhone] = await ctx.db
        .insert(userPhones)
        .values({
          phoneId,
          userId,
          phoneNumber: input.phoneNumber,
          isPrimary: existingPhones.length === 0,
          label: input.label || null,
        })
        .returning();

      return newPhone;
    }),

  removePhone: protectedProcedure
    .input(
      z.object({
        phoneId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if phone belongs to user
      const [phone] = await ctx.db
        .select()
        .from(userPhones)
        .where(
          and(
            eq(userPhones.phoneId, input.phoneId),
            eq(userPhones.userId, userId)
          )
        );

      if (!phone) {
        throw new Error("Phone not found");
      }

      // Don't allow removing primary phone if there are other phones
      if (phone.isPrimary) {
        const otherPhones = await ctx.db
          .select()
          .from(userPhones)
          .where(
            and(eq(userPhones.userId, userId), eq(userPhones.isPrimary, false))
          );

        if (otherPhones.length > 0) {
          throw new Error(
            "Cannot remove primary phone. Set another phone as primary first."
          );
        }
      }

      await ctx.db
        .delete(userPhones)
        .where(eq(userPhones.phoneId, input.phoneId));

      return { success: true };
    }),

  setPrimaryPhone: protectedProcedure
    .input(
      z.object({
        phoneId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if phone belongs to user
      const [phone] = await ctx.db
        .select()
        .from(userPhones)
        .where(
          and(
            eq(userPhones.phoneId, input.phoneId),
            eq(userPhones.userId, userId)
          )
        );

      if (!phone) {
        throw new Error("Phone not found");
      }

      // Remove primary from all other phones
      await ctx.db
        .update(userPhones)
        .set({ isPrimary: false })
        .where(eq(userPhones.userId, userId));

      // Set this phone as primary
      const [updated] = await ctx.db
        .update(userPhones)
        .set({ isPrimary: true })
        .where(eq(userPhones.phoneId, input.phoneId))
        .returning();

      return updated;
    }),
});
