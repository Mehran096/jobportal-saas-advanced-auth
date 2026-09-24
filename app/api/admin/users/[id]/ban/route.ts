// app/api/admin/users/[id]/ban/route.ts
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";

interface BanRequestBody {
  reason?: string;
  action?: "ban" | "unban";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await verifyAdmin();

    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (targetUser._id.toString() === admin.id) {
      return NextResponse.json({ message: "Cannot ban yourself" }, { status: 400 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ message: "Cannot ban admin" }, { status: 400 });
    }

    let body: BanRequestBody = {};
    try {
      const json = (await req.json()) as BanRequestBody;
      body = json;
    } catch {
      // no body = toggle mode
    }

    if (body.action === "ban") {
      targetUser.isBanned = true;
      targetUser.bannedAt = new Date();
      targetUser.bannedReason = body.reason?.trim() || "Violated terms of service";
    } else if (body.action === "unban") {
      targetUser.isBanned = false;
      targetUser.bannedReason = "";
      targetUser.bannedAt = undefined;
    } else {
      // backward compat toggle
      if (!targetUser.isBanned) {
        targetUser.isBanned = true;
        targetUser.bannedAt = new Date();
        targetUser.bannedReason = body.reason?.trim() || "Violated terms of service";
      } else {
        targetUser.isBanned = false;
        targetUser.bannedReason = "";
        targetUser.bannedAt = undefined;
      }
    }

    await targetUser.save();

    return NextResponse.json({
      message: `User ${targetUser.isBanned ? "banned" : "unbanned"} successfully`,
      user: targetUser,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const isAuthError =
      message.includes("Unauthorized") ||
      message.includes("Admin") ||
      message.includes("login") ||
      message.includes("banned");

    return NextResponse.json({ message }, { status: isAuthError ? 401 : 500 });
  }
}