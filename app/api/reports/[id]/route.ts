// app/api/reports/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Report from "@/models/Report";
import mongoose from "mongoose";

interface VerifiedUser { id: string; role?: string; }
type UpdateStatus = "reviewed" | "dismissed";
interface UpdateBody { status: UpdateStatus; }

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser | null;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    const { id } = await params; // ✅ FIXED: await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid report id" }, { status: 400 });
    }

    const { status } = (await req.json()) as UpdateBody;

    if (!status || !["reviewed", "dismissed"].includes(status)) {
      return NextResponse.json({ message: "Status must be reviewed or dismissed" }, { status: 400 });
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });

    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ message: `Report ${status}`, report }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser | null;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    const { id } = await params; // ✅ FIXED
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid report id" }, { status: 400 });
    }

    const report = await Report.findByIdAndDelete(id);
    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Report deleted" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}