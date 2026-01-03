import { pgEnum, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "teacher",
  "student",
  "manager",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // role indicates whether the user is a teacher or student
  role: userRoleEnum("role").notNull().default("student"),
  // Multi-tenancy: links teachers/students to their manager (learning center)
  // Managers link to themselves (self-reference)
  managerId: text("manager_id"),
  // System-generated password stored for manager reference
  generatedPassword: text("generated_password"),
  // Tracks if user has changed their initial password
  hasChangedPassword: boolean("has_changed_password").notNull().default(false),
  // Extended profile fields
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  grade: text("grade"), // For students only
  schoolName: text("school_name"),
  // Parent contact info (for students only, editable by manager/teacher)
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Additional emails for user (beyond primary auth email)
export const userEmails = pgTable("user_emails", {
  emailId: text("email_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Phone numbers for user
export const userPhones = pgTable("user_phones", {
  phoneId: text("phone_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  label: text("label"), // e.g., "mobile", "home", "work"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
