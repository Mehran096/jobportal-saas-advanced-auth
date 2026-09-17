import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
  job: mongoose.Types.ObjectId;
  applicant: mongoose.Types.ObjectId;
  employer: mongoose.Types.ObjectId;
  status: "pending" | "shortlisted" | "accepted" | "rejected";
  resumeUrl?: string;
  snapshot: {
    firstName: string;
    lastName: string;
    headline: string;
    bio: string;
    phone: string;
    location: string;
    profileImage: string;
    resumeUrl: string;
    resumeName: string;
    skills: string[];
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    employer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    status: {
      type: String,
      enum: ["pending", "shortlisted", "accepted", "rejected"], // removed reviewed
      default: "pending",
      index: true,
    },

    resumeUrl: { type: String }, // backwards compat

    // This is taken from Profile at apply time - employer sees this forever
    snapshot: {
      firstName: String,
      lastName: String,
      headline: String,
      bio: String,
      phone: String,
      location: String,
      profileImage: String,
      resumeUrl: String,
      resumeName: String,
      skills: { type: [String], default: [] },
      email: String,
    },
  },
  { timestamps: true }
);

// 1 user can apply 1 time to 1 job
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
ApplicationSchema.index({ employer: 1, status: 1 });
ApplicationSchema.index({ applicant: 1, status: 1 });

export default mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);