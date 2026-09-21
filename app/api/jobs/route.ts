export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// keep models registered for populate
import "@/models/User";
import Job from "@/models/Job";

type RegexFilter = { $regex: string; $options: string };

type JobFilter = {
  location?: RegexFilter;
  type?: string;
  salary?: { $gte: number };
  createdAt?: { $gte: Date };
  $or?: Array<{
    title?: RegexFilter;
    company?: RegexFilter;
    description?: RegexFilter;
  }>;
};

interface VerifiedUser {
  id: string;
  role: string;
}

interface JobBody {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  salary?: string | number;
  type?: string;
  salaryMin?: string | number;
  salaryMax?: string | number;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser;

    if (user.role !== "employer") {
      return NextResponse.json(
        { message: "Only employers can post jobs" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as JobBody;
    const { title, description, company, location, salary, type, salaryMin, salaryMax } = body;

    if (!title || !description || !company || !location || !salary) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const newJob = await Job.create({
      title,
      description,
      company,
      location,
      salary: Number(salary),
      type: type || "Full-time",
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      postedBy: user.id,
    });

    return NextResponse.json(
      { message: "Job posted successfully", job: newJob },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    // FIX: was 401 — now distinguish
    const isAuthError = message.toLowerCase().includes("token") || 
                        message.toLowerCase().includes("unauthorized") ||
                        message.toLowerCase().includes("jwt");
    
    console.error("POST jobs error:", message);
    return NextResponse.json(
      { message },
      { status: isAuthError ? 401 : 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const location = searchParams.get("location")?.trim() || "";
    const jobType = searchParams.get("jobType")?.trim() || "";
    const minSalary = searchParams.get("minSalary")?.trim() || "";
    const datePosted = searchParams.get("datePosted")?.trim() || "";

    const filter: JobFilter = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [{ title: regex }, { company: regex }, { description: regex }];
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (jobType) {
      filter.type = jobType;
    }

    if (minSalary) {
      const parsed = Number(minSalary);
      if (!Number.isNaN(parsed)) {
        filter.salary = { $gte: parsed };
      }
    }

    if (datePosted) {
      const now = new Date();
      const fromDate = new Date(now);
      if (datePosted === "24h") fromDate.setDate(now.getDate() - 1);
      else if (datePosted === "3d") fromDate.setDate(now.getDate() - 3);
      else if (datePosted === "7d") fromDate.setDate(now.getDate() - 7);
      else if (datePosted === "14d") fromDate.setDate(now.getDate() - 14);
      else fromDate.setDate(now.getDate() - 30);
      filter.createdAt = { $gte: fromDate };
    }

    const jobs = await Job.find(filter)
      .populate("postedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { count: jobs.length, jobs },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("GET jobs error:", message);
    return NextResponse.json(
      { message, count: 0, jobs: [] },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}