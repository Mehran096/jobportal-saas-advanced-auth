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
      return NextResponse.json({ message: "Only employers can view" }, { status: 403 });
    }

    // Fetch all jobs posted by this employer, newest first
    const jobs = await Job.find({ postedBy: user.id }).sort({ createdAt: -1 }).lean();

    // Add application count to each job
    const jobsWithCount = await Promise.all(
      jobs.map(async (job) => {
        const count = await Application.countDocuments({ job: job._id });
        return { ...job, applicationCount: count };
      })
    );

    return NextResponse.json({ count: jobsWithCount.length, jobs: jobsWithCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}