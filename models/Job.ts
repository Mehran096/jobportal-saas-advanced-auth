import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  description: string;
  company: string;
  location: string;
  salary: number;
  postedBy: mongoose.Types.ObjectId; // employer ka id
  createdAt: Date;
}

const JobSchema: Schema = new Schema({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: Number, required: true },
  postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true });

// Dashboard stats ke liye fast index
JobSchema.index({ postedBy: 1, createdAt: -1 });

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);