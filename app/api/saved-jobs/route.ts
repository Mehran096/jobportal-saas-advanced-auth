export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// CRITICAL — Vercel needs these
import "@/models/Job";
import "@/models/User";
import SavedJob from "@/models/SavedJob";
import { Types } from "mongoose";

interface VerifiedUser {
  id: string;
  _id?: string;
  role: string;
}

interface SavedLean {
  _id: Types.ObjectId;
  job: { _id: Types.ObjectId } | null;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser;

    const saved = (await SavedJob.find({ user: user.id })
      .populate("job")
      .sort({ createdAt: -1 })
      .lean()) as unknown as SavedLean[];

    // FIX: filter out deleted jobs where populate returns null
    const validJobs = saved
      .map((s) => s.job)
      .filter((j): j is NonNullable<SavedLean["job"]> => j !== null);

    return NextResponse.json(
      { savedJobs: validJobs },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("GET saved-jobs error:", message);
    return NextResponse.json(
      { savedJobs: [], message },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser;
    const body = (await req.json()) as { jobId?: string };
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ message: "jobId required" }, { status: 400 });
    }

    await SavedJob.create({ user: user.id, job: jobId });
    return NextResponse.json({ message: "Job saved" }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json({ message: "Already saved" }, { status: 200 });
    }

    const message = error instanceof Error ? error.message : "Server error";
    console.error("POST saved-jobs error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}