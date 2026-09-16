import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    
    // Sirf employer access kar sakta hai
    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can access" }, { status: 403 });
    }

    // 1. Is employer ki saari jobs nikalo
    const jobs = await Job.find({ postedBy: user.id });
    const jobIds = jobs.map(j => j._id);

    // 2. In jobs ke stats nikalo - parallel me
    const [totalApplicants, pendingApplicants, hired] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: "pending" }),
      Application.countDocuments({ job: { $in: jobIds }, status: "accepted" })
    ]);

    // 3. Recent 5 applications
    const recentApplications = await Application.find({ job: { $in: jobIds } })
      .populate("applicant", "name email")
      .populate("job", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      totalJobs: jobs.length,
      totalApplicants,
      pendingApplicants,
      hired,
      recentApplications
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}