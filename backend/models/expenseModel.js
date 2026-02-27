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
      enum: ["food", "transport", "utilities", "rent", "healthcare", "entertainment", "education", "other"],
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
    },
    source: {
      type: String,
      enum: ["manual", "bank_import", "pdf_import", "BANK_PDF"],
      default: "manual"
    }
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);
