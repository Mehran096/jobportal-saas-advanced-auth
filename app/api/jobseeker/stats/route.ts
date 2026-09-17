import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    
    if (user.role !== "jobseeker") {
      return NextResponse.json({ message: "Only jobseekers can access" }, { status: 403 });
    }

    const [totalApplications, interviews, savedJobs] = await Promise.all([
      Application.countDocuments({ applicant: user.id }),
      Application.countDocuments({ 
        applicant: user.id, 
        status: { $in: ["accepted", "shortlisted"] } 
      }),
      SavedJob.countDocuments({ user: user.id })
    ]);

    return NextResponse.json({
      totalApplications,
      interviews,
      savedJobs
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}