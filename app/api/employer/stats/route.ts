import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    
    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can access" }, { status: 403 });
    }

    // FIXED: don't convert to ObjectId, use user.id directly (matches Job.create { postedBy: user.id })
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
        .lean() // FIXED: no populate applicant, use snapshot
    ]);

    return NextResponse.json({
      totalJobs: jobs.length,
      totalApplicants,
      pendingApplicants,
      hired,
      recentApplications, // has snapshot.firstName lastName
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Employer Stats Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}