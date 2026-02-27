/**
 * Lender Auth Middleware
 * 
 * Completely separate from the gig worker isAuth middleware.
 * Verifies lender JWT tokens using a separate secret.
 */

import jwt from "jsonwebtoken";
import { Lender } from "../models/Lender.js";

const LENDER_JWT_SECRET = process.env.LENDER_JWT_SECRET || "lender_secret_key_98765";

export const isLenderAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "No token provided. Please login as a lender.",
            });
        }

        const decoded = jwt.verify(token, LENDER_JWT_SECRET);

        // Ensure this is a lender token
        if (decoded.type !== "lender") {
            return res.status(401).json({
                message: "Invalid token type. Please login as a lender.",
            });
        }

        const lender = await Lender.findById(decoded.id).select("-password");

        if (!lender) {
            return res.status(401).json({
                message: "Invalid token. Lender not found.",
            });
        }

        if (!lender.isActive) {
            return res.status(403).json({
                message: "Lender account is deactivated.",
            });
        }

        req.lender = lender;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired lender token",
        });
    }
};
