export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// side-effect imports for Vercel populate
import "@/models/Job";
import "@/models/User";
import Application from "@/models/Application";

interface VerifiedUser {
  id: string;
  _id?: string;
  role: string;
  email?: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = (await verifyToken(req)) as VerifiedUser;

    if (user.role !== "jobseeker") {
      return NextResponse.json(
        { message: "Only jobseekers can view applications" },
        { status: 403 }
      );
    }

    const applicantId = user.id || user._id || "";

    const applications = await Application.find({ applicant: applicantId })
      .populate("job", "title company location salary createdAt description")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { count: applications.length, applications },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    console.error("Get Jobseeker Applications Error:", error);
    return NextResponse.json(
      { message },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}