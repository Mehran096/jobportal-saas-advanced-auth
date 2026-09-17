import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import SavedJob from "@/models/SavedJob";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    const saved = await SavedJob.find({ user: user.id })
      .populate("job")
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json(
      { savedJobs: saved.map((s) => s.job) }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("GET saved-jobs error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ message: "jobId required" }, { status: 400 });
    }

    await SavedJob.create({ user: user.id, job: jobId });
    return NextResponse.json({ message: "Job saved" }, { status: 201 });

  } catch (error: unknown) {
    // FIXED: no 'any', check Mongo duplicate key safely
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json({ message: "Already saved" }, { status: 200 });
    }

    console.error("POST saved-jobs error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}