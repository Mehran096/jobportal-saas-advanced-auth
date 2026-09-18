import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  name: string; // virtual
  email: string;
  password?: string;
  role: "jobseeker" | "employer" | "admin";
  provider?: string; // <- ADD
  image?: string; // <- ADD
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      index: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // <- CHANGE to false
      select: false,
    },
    role: {
      type: String,
      enum: ["jobseeker", "employer", "admin"],
      default: "jobseeker",
      index: true,
    },
    provider: {
      type: String,
      default: "credentials",
    },
    image: {
      type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// full name virtual - KEEP as is
UserSchema.virtual("name").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// for dashboard stats
UserSchema.index({ role: 1, createdAt: -1 });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);