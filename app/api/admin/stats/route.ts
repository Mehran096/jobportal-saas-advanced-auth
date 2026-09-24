// app/api/admin/stats/route.ts
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET() {
  try {
    await verifyAdmin();
    await dbConnect();

    const [
      totalUsers,
      totalEmployers,
      totalJobseekers,
      totalJobs,
      totalApplications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "employer" }),
      User.countDocuments({ role: "jobseeker" }),
      Job.countDocuments(),
      Application.countDocuments(),
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email role createdAt")
      .lean();

    return NextResponse.json({
      totalUsers,
      totalEmployers,
      totalJobseekers,
      totalJobs,
      totalApplications,
      recentUsers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const isAuthError =
      message.includes("Unauthorized") ||
      message.includes("Admin") ||
      message.includes("login") ||
      message.includes("banned");

    return NextResponse.json(
      { message },
      { status: isAuthError ? 401 : 500 }
    );
  }
}