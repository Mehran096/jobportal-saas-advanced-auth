import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    if (user.role !== "employer") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    const filter: any = jobId ? { job: jobId, employer: user.id } : { employer: user.id };

    const applications = await Application.find(filter)
      .populate("job", "title company location")
      .populate("applicant", "firstName lastName email")
      .select("+snapshot +resumeUrl")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ applications });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}