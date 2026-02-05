import mongoose from "mongoose";

const bankStatementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    fileName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    fileUrl: String, // Store Cloudinary URL or file path
    status: {
      type: String,
      enum: ["uploaded", "processing", "processed", "failed"],
      default: "uploaded"
    }
  },
  { timestamps: true }
);

export const BankStatement = mongoose.model("BankStatement", bankStatementSchema);
