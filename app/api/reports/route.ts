export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Report, { IReport } from "@/models/Report";
import User from "@/models/User";
import Job from "@/models/Job";
import mongoose from "mongoose";

interface VerifiedUser { id: string; role?: string; }
type ReportReason = IReport["reason"];
interface ReportBody { reportedUser: string; reason: ReportReason; details?: string; jobId?: string; }

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser | null;
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as ReportBody;
    const { reportedUser, reason, details, jobId } = body;

    if (!reportedUser || !reason) {
      return NextResponse.json({ message: "reportedUser and reason required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(reportedUser)) {
      return NextResponse.json({ message: "Invalid reportedUser id" }, { status: 400 });
    }

    if (reportedUser === user.id) {
      return NextResponse.json({ message: "You cannot report yourself" }, { status: 400 });
    }

    const target = await User.findById(reportedUser);
    if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });

    if (jobId) {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return NextResponse.json({ message: "Invalid jobId" }, { status: 400 });
      }
      const job = await Job.findById(jobId);
      if (!job) return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const recent = await Report.findOne({
      reportedUser: new mongoose.Types.ObjectId(reportedUser),
      reportedBy: new mongoose.Types.ObjectId(user.id),
      reason: reason,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recent) {
      return NextResponse.json({ message: "You already reported this user for this reason recently" }, { status: 429 });
    }

    const report = await Report.create({
      reportedUser: new mongoose.Types.ObjectId(reportedUser),
      reportedBy: new mongoose.Types.ObjectId(user.id),
      reason,
      details: details?.trim().slice(0, 500) || "",
      ...(jobId ? { jobId: new mongoose.Types.ObjectId(jobId) } : {}),
      status: "pending" as const
    });

    return NextResponse.json({ message: "Report submitted", report }, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser | null;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    const reports = await Report.find({}) // ✅ FIXED: return ALL, not only pending
      .populate("reportedUser", "firstName lastName email role isBanned")
      .populate("reportedBy", "firstName lastName email")
      .populate("jobId", "title company")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ reports }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}