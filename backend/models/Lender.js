import mongoose from "mongoose";

/**
 * Lender Model
 * 
 * Completely separate from the User (gig worker) model.
 * Represents authorized lending entities that can review and manage loan applications.
 */
const lenderSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        organization: { type: String, required: true },
        licenseNumber: { type: String },
        phone: { type: String },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export const Lender = mongoose.model("Lender", lenderSchema);
