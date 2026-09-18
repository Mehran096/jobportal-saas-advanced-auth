import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const job = await Job.findById(id).populate("postedBy", "firstName lastName email company");
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const applicationCount = await Application.countDocuments({ job: id });

    return NextResponse.json({ job, applicationCount }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await verifyToken(req);

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can edit" }, { status: 403 });
    }

    const existingJob = await Job.findOne({ _id: id, postedBy: user.id });
    if (!existingJob) {
      return NextResponse.json({ message: "Not authorized or job not found" }, { status: 403 });
    }

    const body = await req.json();

    // Whitelist only allowed fields — prevents postedBy overwrite
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.type !== undefined) updateData.type = body.type || "Full-time";
    if (body.salary !== undefined) updateData.salary = Number(body.salary);
    if (body.salaryMin !== undefined) updateData.salaryMin = Number(body.salaryMin);
    if (body.salaryMax !== undefined) updateData.salaryMax = Number(body.salaryMax);

    const updatedJob = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("postedBy", "firstName lastName email");

    return NextResponse.json({ message: "Job updated successfully", job: updatedJob }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await verifyToken(req);

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can delete" }, { status: 403 });
    }

    const job = await Job.findOneAndDelete({ _id: id, postedBy: user.id });
    if (!job) {
      return NextResponse.json({ message: "Not authorized or job not found" }, { status: 403 });
    }

    await Application.deleteMany({ job: id });

    return NextResponse.json({ message: "Job deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}