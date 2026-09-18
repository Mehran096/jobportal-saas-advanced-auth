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
      return NextResponse.json({ message: "Only employers can view" }, { status: 403 });
    }

    const jobs = await Job.find({ postedBy: user.id }).sort({ createdAt: -1 }).lean();

    const jobsWithCount = await Promise.all(
      jobs.map(async (job) => {
        const count = await Application.countDocuments({ job: job._id });
        return { ...job, applicationCount: count };
      })
    );

    return NextResponse.json({ count: jobsWithCount.length, jobs: jobsWithCount }, { status: 200 });

  } catch (error: unknown) {
    console.error("My-Jobs Error:", error);
    const message = error instanceof Error ? error.message : "Server error";

    if (message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("no token")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message }, { status: 500 });
  }
}