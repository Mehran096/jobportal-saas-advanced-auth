import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await verifyToken(req);
    if (user.role !== "jobseeker") {
      return NextResponse.json({ message: "Only jobseekers can view applications" }, { status: 403 });
    }

    const applications = await Application.find({ applicant: user.id })
      .populate("job", "title company location salary createdAt description")
      .sort({ createdAt: -1 })
      .lean();
      

    // Return both formats for compatibility
    return NextResponse.json({ 
      count: applications.length, 
      applications 
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    console.error("Get Jobseeker Applications Error:", error);
    return NextResponse.json({ message }, { status: 401 });
  }
}