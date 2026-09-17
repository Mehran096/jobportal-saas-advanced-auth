import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import { verifyToken } from "@/lib/auth";

type JobFilter = {
  title?: { $regex: string; $options: string };
  location?: { $regex: string; $options: string };
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

    if (!title || !description || !company || !location) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const newJob = await Job.create({
      title,
      description,
      company,
      location,
      salary,
      type,
      salaryMin,
      salaryMax,
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
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";

    const filter: JobFilter = {};
    
    if (search) filter.title = { $regex: search, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };

    const jobs = await Job.find(filter)
      .populate("postedBy", "firstName lastName email") // fixed for clean User model
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ count: jobs.length, jobs }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}