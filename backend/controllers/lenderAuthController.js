/**
 * Lender Auth Controller
 * 
 * Completely separate auth system for lenders.
 * Does NOT share any logic with the gig worker auth.
 */

import { Lender } from "../models/Lender.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const LENDER_JWT_SECRET = process.env.LENDER_JWT_SECRET || "lender_secret_key_98765";

// Register new lender
export const lenderRegister = async (req, res) => {
    try {
        const { name, email, password, organization, licenseNumber, phone } = req.body;

        if (!name || !email || !password || !organization) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, and organization are required"
            });
        }

        const existingLender = await Lender.findOne({ email });
        if (existingLender) {
            return res.status(400).json({
                success: false,
                message: "A lender account already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const lender = await Lender.create({
            name,
            email,
            password: hashedPassword,
            organization,
            licenseNumber,
            phone
        });

        const token = jwt.sign(
            { id: lender._id, type: "lender" },
            LENDER_JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(201).json({
            success: true,
            message: "Lender registration successful",
            token,
            lender: {
                id: lender._id,
                name: lender.name,
                email: lender.email,
                organization: lender.organization
            }
        });
    } catch (error) {
        console.error("Lender register error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Registration failed"
        });
    }
};

// Login lender
export const lenderLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const lender = await Lender.findOne({ email });
        if (!lender) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, lender.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: lender._id, type: "lender" },
            LENDER_JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            lender: {
                id: lender._id,
                name: lender.name,
                email: lender.email,
                organization: lender.organization
            }
        });
    } catch (error) {
        console.error("Lender login error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Login failed"
        });
    }
};

// Get current lender
export const getLenderMe = async (req, res) => {
    try {
        const lender = await Lender.findById(req.lender.id).select("-password");

        if (!lender) {
            return res.status(404).json({
                success: false,
                message: "Lender not found"
            });
        }

        res.json({
            success: true,
            lender
        });
    } catch (error) {
        console.error("Get lender error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get lender info"
        });
    }
};
