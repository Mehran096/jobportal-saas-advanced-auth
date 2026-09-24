// app/api/admin/appeals/[id]/route.ts - FINAL FIXED VERSION (your code)
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Appeal from "@/models/Appeal";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";

interface ReviewBody {
  decision: "approved" | "rejected";
  adminNote?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // <-- FIX 1: await params for Next 15
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { decision, adminNote } = (await req.json()) as ReviewBody;

    if (!decision || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ message: "Decision required" }, { status: 400 });
    }

    await dbConnect();
    
    const appeal = await Appeal.findById(id);
    if (!appeal) return NextResponse.json({ message: "Appeal not found" }, { status: 404 });
    if (appeal.status !== "pending") {
      return NextResponse.json({ message: "Appeal already reviewed" }, { status: 400 });
    }

    appeal.status = decision;
    appeal.adminNote = adminNote?.trim() || "";
    appeal.reviewedBy = new mongoose.Types.ObjectId(currentUser.id);
    appeal.reviewedAt = new Date();
    await appeal.save();

    if (decision === "approved") {
      await User.findByIdAndUpdate(appeal.userId, {
        isBanned: false,
        bannedReason: "",
        bannedAt: undefined,
      });
    }

    return NextResponse.json({ 
      message: `Appeal ${decision}`, 
      success: true, 
      decision,
      appeal 
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}