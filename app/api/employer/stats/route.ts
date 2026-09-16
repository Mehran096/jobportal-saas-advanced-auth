import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyToken(req);
    
    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can access" }, { status: 403 });
    }

    const employerId = new mongoose.Types.ObjectId(user.id);

    const jobs = await Job.find({ postedBy: employerId });
    const jobIds = jobs.map(j => j._id);

    // Agar employer ne abhi tak koi job post nahi ki
    if (jobIds.length === 0) {
      return NextResponse.json({
        totalJobs: 0,
        totalApplicants: 0,
        pendingApplicants: 0,
        hired: 0,
        recentApplications: []
      }, { status: 200 });
    }

    const [totalApplicants, pendingApplicants, hired, recentApplications] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: "pending" }),
      Application.countDocuments({ job: { $in: jobIds }, status: "accepted" }),
      
      // UPDATED: firstName + lastName populate karo
      Application.find({ job: { $in: jobIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("applicant", "firstName lastName email") // <-- changed here
        .populate("job", "title") 
        .lean()
    ]);

    // Optional: frontend ke liye full name bana do
    const recentApplicationsWithName = recentApplications.map(app => ({
      ...app,
      applicant: {
        ...app.applicant,
        name: `${app.applicant.firstName} ${app.applicant.lastName}` // virtual jaisa
      }
    }));

    return NextResponse.json({
      totalJobs: jobs.length,
      totalApplicants,
      pendingApplicants,
      hired,
      recentApplications: recentApplicationsWithName // <- updated data
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Employer Stats Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}