import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't reveal if user exists - security best practice
      return NextResponse.json({ message: "If that email exists, reset link sent" });
    }

    // ===== BLOCK GOOGLE USER =====
    if (user.provider === "google" && !user.password) {
      return NextResponse.json(
        {
          message: "This account uses Google login. Please sign in with Google.",
        },
        { status: 400 }
      );
    }
    // =============================

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    await sendResetEmail(user.email, resetUrl, `${user.firstName} ${user.lastName}`);

    console.log("Reset email sent to:", email);

    return NextResponse.json({ message: "Reset link sent to your email" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}