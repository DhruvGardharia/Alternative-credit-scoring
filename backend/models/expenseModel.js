import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category: {
      type: String,
      enum: ["food", "transport", "utilities", "rent", "healthcare", "entertainment", "other"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "wallet"],
      default: "cash"
    }
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);
