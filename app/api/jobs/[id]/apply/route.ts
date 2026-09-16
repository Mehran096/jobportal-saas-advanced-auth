import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const userToken = await verifyToken(req);

    if (userToken.role !== "jobseeker") {
      return NextResponse.json({ message: "Only jobseekers can apply" }, { status: 403 });
    }

    const body = await req.json();
    const { job } = body;

    if (!job || !mongoose.Types.ObjectId.isValid(job)) {
      return NextResponse.json({ message: "Valid Job ID is required" }, { status: 400 });
    }

    // Get full user profile + job
    const applicant = await User.findById(userToken.id);
    const jobDoc = await Job.findById(job);

    if (!applicant || !jobDoc) {
      return NextResponse.json({ message: "User or Job not found" }, { status: 404 });
    }

    if (!applicant.resumeUrl) {
      return NextResponse.json({ message: "Please upload your CV in Profile first" }, { status: 400 });
    }

    // Create with SNAPSHOT - this is what employer sees
    const application = await Application.create({
      job: jobDoc._id,
      applicant: applicant._id,
      employer: jobDoc.postedBy, // Job model me postedBy hona chahiye
      resumeUrl: applicant.resumeUrl, // backwards compatibility
      snapshot: {
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        headline: applicant.headline,
        bio: applicant.bio,
        phone: applicant.phone,
        location: applicant.location,
        profileImage: applicant.profileImage,
        resumeUrl: applicant.resumeUrl,
        resumeName: applicant.resumeName,
        skills: applicant.skills,
        email: applicant.email,
      },
    });

    return NextResponse.json({ message: "Applied successfully", application }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json({ message: "You already applied to this job" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    console.error("APPLY ERROR:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

// Optional: GET for jobseeker's own applications
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userToken = await verifyToken(req);
    
    const apps = await Application.find({ applicant: userToken.id })
      .populate("job", "title company location")
      .sort({ createdAt: -1 });

    return NextResponse.json(apps);
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}