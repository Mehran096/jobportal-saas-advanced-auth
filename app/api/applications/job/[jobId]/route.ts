import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";
import { verifyToken } from "@/lib/auth";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { jobId } = await params;
    
    const user = await verifyToken(req);

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can view" }, { status: 403 });
    }

    const job = await Job.findById(jobId).select("postedBy");
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }
    
    if (job.postedBy.toString() !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const applications = await Application.find({ job: jobId })
      .populate("job", "title company location type")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ applications }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Get Applications By Job Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}