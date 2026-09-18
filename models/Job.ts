import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  description: string;
  company: string;
  location: string;
  salary: number;
  type: string; // Full-time, Part-time, Remote, Contract, Internship
  salaryMin?: number;
  salaryMax?: number;
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true, index: true },
    salary: { type: Number, required: true, index: true },
    type: { 
      type: String, 
      required: true, 
      enum: ["Full-time", "Part-time", "Remote", "Contract", "Internship"],
      default: "Full-time",
      index: true 
    },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// For employer dashboard
JobSchema.index({ postedBy: 1, createdAt: -1 });

// For Indeed-style search
JobSchema.index({
  title: "text",
  company: "text",
  description: "text",
  location: "text",
});

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);