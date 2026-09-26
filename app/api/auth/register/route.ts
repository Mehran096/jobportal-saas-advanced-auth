import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

type UserRole = "jobseeker" | "employer";
const VALID_ROLES: UserRole[] = ["jobseeker", "employer"];

function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && (VALID_ROLES as string[]).includes(role);
}

interface RegisterBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: unknown;
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = (await req.json()) as RegisterBody;
    const { firstName, lastName, email, password, role } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRole: UserRole = isValidRole(role) ? role : "jobseeker";

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.provider === "google" || existingUser.provider === "both") {
        return NextResponse.json(
          { message: "This email already uses Google login. Please Continue with Google." },
          { status: 409 }
        );
      }
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      provider: "credentials",
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Register Error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}