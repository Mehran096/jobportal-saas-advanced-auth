import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    
    if (!token || !password) {
      return NextResponse.json({ message: "Token and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    await dbConnect();

    // IMPORTANT: trim() to remove any spaces/newline from URL
    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({ message: "Token invalid or expired" }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return NextResponse.json({ message: "Password reset successful. Please login." });

  } catch (err) {
    console.error("Reset Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}