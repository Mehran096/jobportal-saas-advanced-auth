import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { firstName, lastName, email, password, role } = await req.json();

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Normalize email + validate role
    const normalizedEmail = email.toLowerCase().trim();
    const validRoles = ["jobseeker", "employer"];
    const userRole = validRoles.includes(role) ? role : "jobseeker";

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // ===== FIX FOR YOUR SCREENSHOT: mehranh91309@gmail.com =====
      if (existingUser.provider === "google") {
        return NextResponse.json(
          { message: "This email already uses Google login. Please Continue with Google." },
          { status: 409 }
        );
      }
      // ============================================================
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
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        } 
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Register Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}