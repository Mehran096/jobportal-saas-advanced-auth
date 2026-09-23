export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// side-effect imports for Vercel populate
import "@/models/Job";
import "@/models/User";
import Application from "@/models/Application";



//all job applicants/jobSeekers all applications can be viewed by the employer who posted the job
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can view" }, { status: 403 });
    }

    const applications = await Application.find({ employer: user.id })
      .populate("job", "title company location type")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ applications }, { status: 200 });
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Get Employer Applications Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}