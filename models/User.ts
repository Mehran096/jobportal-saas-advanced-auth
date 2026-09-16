import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  name: string; // virtual field
  email: string;
  password: string;
  role: "jobseeker" | "employer" | "admin";
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;

  // PROFILE FIELDS - NEW
  profileImage: string;
  resumeUrl: string;
  resumeName: string;
  bio: string;
  skills: string[];
  phone: string;
  location: string;
  headline: string;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
    index: true
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false
  },
  role: {
    type: String,
    enum: ["jobseeker", "employer", "admin"],
    default: "jobseeker",
    index: true
  },
  // FORGOT PASSWORD FIELDS
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },

  // PROFILE FIELDS - FOR UPLOADTHING
  profileImage: {
    type: String,
    default: "",
  },
  resumeUrl: {
    type: String,
    default: "",
  },
  resumeName: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
    maxlength: 500,
  },
  headline: {
    type: String,
    default: "",
    trim: true,
  },
  skills: {
    type: [String],
    default: [],
  },
  phone: {
    type: String,
    default: "",
    trim: true,
  },
  location: {
    type: String,
    default: "",
    trim: true,
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field: full name = firstName + lastName
UserSchema.virtual('name').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Compound index for dashboard aggregation
UserSchema.index({ role: 1, createdAt: -1 });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);