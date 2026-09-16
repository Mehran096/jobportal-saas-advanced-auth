import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
  job: mongoose.Types.ObjectId;
  applicant: mongoose.Types.ObjectId;
  employer: mongoose.Types.ObjectId;
  status: "pending" | "reviewed" | "shortlisted" | "accepted" | "rejected";
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
      enum: ["pending", "reviewed", "shortlisted", "accepted", "rejected"],
      default: "pending",
    },

    resumeUrl: { type: String }, // keep for backwards compatibility

    // This is what employer will see - FULL bio data + CV at time of apply
    snapshot: {
      firstName: { type: String },
      lastName: { type: String },
      headline: { type: String },
      bio: { type: String },
      phone: { type: String },
      location: { type: String },
      profileImage: { type: String },
      resumeUrl: { type: String },
      resumeName: { type: String },
      skills: { type: [String], default: [] },
      email: { type: String },
    },
  },
  { timestamps: true }
);

// Ek user ek job pe 1 hi baar apply kar sake
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);