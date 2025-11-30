import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@edura/db";
import * as schema from "@edura/db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: schema,
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: true,
      },
      managerId: {
        type: "string",
        required: false,
        input: true,
      },
      generatedPassword: {
        type: "string",
        required: false,
        input: true,
      },
      hasChangedPassword: {
        type: "boolean",
        required: false,
        input: true,
        defaultValue: false,
      },
      dateOfBirth: {
        type: "date",
        required: false,
        input: true,
      },
      address: {
        type: "string",
        required: false,
        input: true,
      },
      grade: {
        type: "string",
        required: false,
        input: true,
      },
      schoolName: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
});
