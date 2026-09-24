import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Appeal from "@/models/Appeal";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const appeals = await Appeal.find({ status: "pending" })
      .populate("userId", "firstName lastName email role isBanned bannedReason bannedAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ appeals });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}