import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import SavedJob from "@/models/SavedJob";
import { verifyToken } from "@/lib/auth";

type Params = { params: Promise<{ jobId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    const { jobId } = await params;
    await SavedJob.findOneAndDelete({ user: user.id, job: jobId });
    return NextResponse.json({ message: "Unsaved" }, { status: 200 });
  } catch { return NextResponse.json({ message: "Server error" }, { status: 500 }); }
}