import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ["delivery", "driver", "freelancer", "service_provider"],
      required: true
    },
    phone: { type: String },
    profilePicture: { type: String },
    
    // Platform Connections (for API integration)
    connectedPlatforms: {
      // Ride Platforms
      uber: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      ola: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      rapido: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      
      // Delivery Platforms
      swiggy: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      zomato: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      zepto: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      blinkit: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      dunzo: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      
      // Freelance Platforms
      fiverr: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      upwork: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      freelancer: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      urbanCompany: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date },
      meesho: { connected: { type: Boolean, default: false }, workType: String, lastSync: Date }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
