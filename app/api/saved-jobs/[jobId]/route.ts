export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// keep for Vercel
import "@/models/Job";
import SavedJob from "@/models/SavedJob";

type Params = { params: Promise<{ jobId: string }> };

interface VerifiedUser {
  id: string;
  role: string;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser;
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ message: "jobId required" }, { status: 400 });
    }

    await SavedJob.findOneAndDelete({ user: user.id, job: jobId });

    return NextResponse.json(
      { message: "Unsaved" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("DELETE saved-jobs error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}