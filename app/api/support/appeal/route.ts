import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Appeal from "@/models/Appeal";

export async function POST(req: NextRequest) {
  try {
    const { email, message } = (await req.json()) as {
      email: string;
      message: string;
    };

    if (!email || !message?.trim()) {
      return NextResponse.json({ error: "Email and message required" }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.isBanned) return NextResponse.json({ error: "User is not banned" }, { status: 400 });

    // Check if already has pending appeal
    const existingPending = await Appeal.findOne({ userId: user._id, status: "pending" });
    if (existingPending) {
      return NextResponse.json({ error: "You already have a pending appeal" }, { status: 400 });
    }

    const appeal = await Appeal.create({
      userId: user._id,
      email: user.email,
      message: message.trim().slice(0, 1000),
      status: "pending",
    });

    return NextResponse.json({ success: true, appealId: appeal._id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}