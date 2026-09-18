import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    
    if (!user || !user.role) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can access" }, { status: 403 });
    }

    // Use string id - matches Job.create { postedBy: user.id }
    const jobs = await Job.find({ postedBy: user.id }).select("_id").lean();
    const jobIds = jobs.map(j => j._id);

    if (jobIds.length === 0) {
      return NextResponse.json({
        totalJobs: 0,
        totalApplicants: 0,
        pendingApplicants: 0,
        hired: 0,
        recentApplications: []
      }, { status: 200 });
    }

    const [totalApplicants, pendingApplicants, hired, recentApplications] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: "pending" }),
      Application.countDocuments({ job: { $in: jobIds }, status: { $in: ["accepted", "hired"] } }),
      Application.find({ job: { $in: jobIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("job", "title")
        .lean()
    ]);

    return NextResponse.json({
      totalJobs: jobs.length,
      totalApplicants,
      pendingApplicants,
      hired,
      recentApplications,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Employer Stats Error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    
    // Return 401 for auth errors, not 500
    if (message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("no token")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message }, { status: 500 });
  }
}