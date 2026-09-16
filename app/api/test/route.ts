import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ message: "DB Connected ✅" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "DB Connection Failed ❌", error: message },
      { status: 500 }
    );
  }
}