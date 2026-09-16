import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    
    if (user.role !== "jobseeker") {
      return NextResponse.json({ message: "Only jobseekers can access" }, { status: 403 });
    }

    const jobseekerId = user.id;

    // 1. Total Applications
    const totalApplications = await Application.countDocuments({ applicant: jobseekerId });

    // 2. Interviews = accepted status
    const interviews = await Application.countDocuments({ applicant: jobseekerId, status: "accepted" });

    // 3. Saved Jobs - agar tumne save job ka model banaya hai to yahan count karo
    // filhal 0 rakhte hain
    const savedJobs = 0; 

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