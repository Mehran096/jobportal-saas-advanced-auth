// app/api/admin/jobs/[id]/route.ts
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // <- THE FIX

    await verifyAdmin();
    await dbConnect();

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    await Job.findByIdAndDelete(id);
    return NextResponse.json({ message: "Job deleted by admin" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const isAuthError =
      message.includes("Unauthorized") ||
      message.includes("Admin") ||
      message.includes("login") ||
      message.includes("banned");

    return NextResponse.json(
      { message },
      { status: isAuthError ? 401 : 500 }
    );
  }
}