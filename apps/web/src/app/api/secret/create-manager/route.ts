import { auth } from "@edura/auth";
import { db } from "@edura/db";
import { user } from "@edura/db/schema/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createManagerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  secretKey: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createManagerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name, secretKey } = parsed.data;

    if (secretKey !== process.env.MANAGER_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the user using Better Auth
    // We use signUpEmail which creates the user and account
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        role: "manager",
      },
      headers: req.headers,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Update the manager to link to themselves and mark password as changed
    // (since they set their own password during creation)
    await db
      .update(user)
      .set({
        managerId: result.user.id,
        hasChangedPassword: true,
      })
      .where(eq(user.id, result.user.id));

    return NextResponse.json({
      success: true,
      message: "Manager account created successfully",
      user: result.user,
    });
  } catch (error: any) {
    console.error("Error creating manager:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
