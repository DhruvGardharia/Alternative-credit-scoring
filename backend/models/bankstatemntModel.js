import mongoose from "mongoose";

const bankStatementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    fileName: String,
    fileUrl: String,

    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("BankStatement", bankStatementSchema);
