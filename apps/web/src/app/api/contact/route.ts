import { auth } from "@edura/auth";
import { db } from "@edura/db";
import { user } from "@edura/db/schema/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendManagerAccountEmail } from "@edura/api/utils/email";

const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  centerName: z.string().min(2),
  studentCount: z.coerce.number().int().positive().optional(),
  message: z.string().optional(),
});

// Generate a random 5-letter string
function generateRandomString(length: number = 5): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a random password (16 characters)
function generateRandomPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));

  for (let i = 4; i < 16; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, phone, centerName, studentCount, message } =
      parsed.data;

    // Generate manager credentials
    const randomString = generateRandomString(5);
    const managerEmail = `manager_${randomString}@edura.work`;
    const managerPassword = generateRandomPassword();

    // Check if email already exists in users
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, managerEmail));

    if (existingUser.length > 0) {
      // Very unlikely but handle collision by regenerating
      const newRandomString = generateRandomString(5);
      const newManagerEmail = `manager_${newRandomString}@edura.work`;

      const newExistingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, newManagerEmail));

      if (newExistingUser.length > 0) {
        return NextResponse.json(
          { error: "Could not generate unique manager email" },
          { status: 500 }
        );
      }
    }

    // Create the manager account using Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email: managerEmail,
        password: managerPassword,
        name: centerName, // Use center name as the account name
        role: "manager",
      },
      headers: req.headers,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create manager account" },
        { status: 500 }
      );
    }

    // Update the manager to link to themselves and store generated password
    await db
      .update(user)
      .set({
        managerId: result.user.id,
        generatedPassword: managerPassword,
        hasChangedPassword: false,
      })
      .where(eq(user.id, result.user.id));

    // Send manager account info to the contact email
    await sendManagerAccountEmail({
      contactName: name,
      contactEmail: email,
      centerName: centerName,
      managerEmail: managerEmail,
      managerPassword: managerPassword,
      phone: phone,
      studentCount: studentCount,
      message: message,
    });

    return NextResponse.json({
      success: true,
      message:
        "Contact form submitted successfully. Manager account created and details sent to the provided email.",
    });
  } catch (error: any) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
