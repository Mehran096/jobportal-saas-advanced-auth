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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with firstName + lastName
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "jobseeker"
    });

    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: { 
          id: newUser._id, 
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          name: newUser.name, // virtual field
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