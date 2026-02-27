import mongoose from "mongoose";

/**
 * Income/Earnings Model
 * 
 * Centralized storage for all earnings from gig platforms
 * Used by: Credit Engine, Insurance, Expense Tracking, Platform Integration
 */

const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Platform Details
    platform: {
      type: String,
      enum: ["uber", "ola", "rapido", "swiggy", "zomato", "zepto", "blinkit", "dunzo", 
             "fiverr", "upwork", "freelancer", "urbanCompany", "meesho", "other"],
      required: true
    },

    // Financial Details
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },

    // Transaction Details
    category: {
      type: String,
      enum: ["ride", "delivery", "bonus", "incentive", "tip", "other"],
      default: "other"
    },

    status: {
      type: String,
      enum: ["completed", "pending", "cancelled"],
      default: "completed"
    },

    // Platform-Specific Data (optional)
    platformData: {
      orderId: String,
      rideId: String,
      tripId: String,
      distance: Number,
      duration: Number,
      rating: Number
    },

    // Metadata
    description: String,
    source: {
      type: String,
      enum: ["api_sync", "manual", "csv_import"],
      default: "manual"
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for performance
incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ userId: 1, platform: 1 });
incomeSchema.index({ userId: 1, status: 1 });

// Get total income for a user
incomeSchema.statics.getTotalIncome = async function(userId, startDate = null, endDate = null) {
  const query = { userId, status: "completed" };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const result = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  return result.length > 0 ? result[0].total : 0;
};

// Get income by platform
incomeSchema.statics.getIncomeByPlatform = async function(userId) {
  return await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: "completed" } },
    { 
      $group: { 
        _id: "$platform", 
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      } 
    }
  ]);
};

export const Income = mongoose.model("Income", incomeSchema);
