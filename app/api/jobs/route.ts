import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Sirf employer login kar sakta hai
    const user = await verifyToken(req);
    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can post jobs" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, company, location, salary } = body;

    if (!title || !description || !company || !location || !salary) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // 2. Job create karo, postedBy me employer ka id dal do
    const newJob = await Job.create({
      title,
      description,
      company,
      location,
      salary,
      postedBy: user.id // token se aaya hua id
    });

    return NextResponse.json({
      message: "Job posted successfully",
      job: newJob
    }, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 401 });
  }
}

// ======= YAHAN SE NAYA GET CODE ADD KARO =======
// 1. Filter ke liye type bana lo
type JobFilter = {
  title?: { $regex: string; $options: string };
  location?: { $regex: string; $options: string };
};

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";

    // 2. ab any ki jagah JobFilter use karo
    const filter: JobFilter = {};
    
    if (search) {
      filter.title = { $regex: search, $options: "i" }; // title me search
    }
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    const jobs = await Job.find(filter)
      .populate("postedBy", "name email company") // employer ka name dikhane ke liye
      .sort({ createdAt: -1 }); // latest job pehle

    return NextResponse.json({ count: jobs.length, jobs }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}


