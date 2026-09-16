import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);

    const notifications = await Notification.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(20); // last 20 notifications

    const unreadCount = await Notification.countDocuments({ user: user.id, isRead: false });

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 401 });
  }
}

// Notification ko read karne ke liye
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    const { id } = await req.json();

    await Notification.findOneAndUpdate({ _id: id, user: user.id }, { isRead: true });

    return NextResponse.json({ message: "Marked as read" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "No token provided" || message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ message }, { status });
  }
}