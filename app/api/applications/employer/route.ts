import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can view" }, { status: 403 });
    }

    const jobs = await Job.find({ postedBy: user.id }).select("_id");
    const jobIds = jobs.map(job => job._id);

    if (jobIds.length === 0) {
      return NextResponse.json({ applications: [] }, { status: 200 });
    }

    // FIXED: include snapshot + resumeUrl + full job info
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("job", "title company location")
      .populate("applicant", "firstName lastName email")
      .select("+snapshot +resumeUrl")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ applications }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Get Employer Applications Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}