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
    profilePicture: { type: String },
    
    // Platform Connections (for API integration)
    connectedPlatforms: {
      uber: {
        connected: { type: Boolean, default: false },
        token: String,
        lastSync: Date
      },
      ola: {
        connected: { type: Boolean, default: false },
        token: String,
        lastSync: Date
      },
      swiggy: {
        connected: { type: Boolean, default: false },
        token: String,
        lastSync: Date
      },
      zomato: {
        connected: { type: Boolean, default: false },
        token: String,
        lastSync: Date
      }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
