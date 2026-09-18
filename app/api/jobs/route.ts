import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import { verifyToken } from "@/lib/auth";

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

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can post jobs" }, { status: 403 });
    }

    const body = await req.json();
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
      type: type || "Full-time", // <-- FIXED: fallback to default
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      postedBy: user.id,
    });

    return NextResponse.json({ message: "Job posted successfully", job: newJob }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 401 });
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
      filter.salary = { $gte: Number(minSalary) };
    }

    if (datePosted) {
      const now = new Date();
      const fromDate = new Date(now);
      if (datePosted === "24h") fromDate.setDate(now.getDate() - 1);
      else if (datePosted === "3d") fromDate.setDate(now.getDate() - 3);
      else if (datePosted === "7d") fromDate.setDate(now.getDate() - 7);
      else if (datePosted === "14d") fromDate.setDate(now.getDate() - 14);
      filter.createdAt = { $gte: fromDate };
    }

    const jobs = await Job.find(filter)
      .populate("postedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ count: jobs.length, jobs }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}