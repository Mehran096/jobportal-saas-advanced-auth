export const dynamic = 'force-dynamic';
export const revalidate = 0;

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";

type UserRole = "jobseeker" | "employer" | "admin";

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role") as UserRole | null;
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    let query = User.find();

    if (roleParam && ["jobseeker", "employer", "admin"].includes(roleParam)) {
      query = query.where("role").equals(roleParam);
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query = query.or([
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
      ]);
    }

    const [users, total] = await Promise.all([
      query.sort({ createdAt: -1 }).select("-password").skip(skip).limit(limit).lean(),
      User.countDocuments(query.getFilter()),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const isAuthError =
      message.includes("Unauthorized") ||
      message.includes("Admin") ||
      message.includes("login") ||
      message.includes("banned");

    return NextResponse.json({ message }, { status: isAuthError ? 401 : 500 });
  }
}