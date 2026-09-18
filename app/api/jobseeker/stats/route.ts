import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);

    if (!user || !user.role) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
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
    console.error("Jobseeker Stats Error:", error);
    const message = error instanceof Error ? error.message : "Server error";

    if (message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("no token")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message }, { status: 500 });
  }
}