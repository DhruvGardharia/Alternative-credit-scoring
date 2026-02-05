import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ["delivery", "driver", "freelancer"],
      required: true
    },
    phone: { type: String },
    profilePicture: { type: String }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
