import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);

    const notifications = await Notification.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ user: user.id, isRead: false });

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });

  } catch (error: unknown) {
    console.error("Notifications GET Error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    const status = message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ message: "Unauthorized" }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "Notification id required" }, { status: 400 });
    }

    await Notification.findOneAndUpdate({ _id: id, user: user.id }, { isRead: true });

    return NextResponse.json({ message: "Marked as read" }, { status: 200 });

  } catch (error: unknown) {
    console.error("Notifications PATCH Error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    const status = message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized") || message === "No token provided" ? 401 : 500;
    return NextResponse.json({ message: status === 401 ? "Unauthorized" : message }, { status });
  }
}