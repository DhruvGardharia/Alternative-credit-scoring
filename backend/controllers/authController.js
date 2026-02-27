import { User } from "../models/userModel.js";
import TryCatch from "../utils/TryCatch.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Register new user
export const register = TryCatch(async (req, res) => {
  const { name, email, password, employmentType, phone } = req.body;

  if (!name || !email || !password || !employmentType) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: "User already exists with this email",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    employmentType,
    phone,
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "secret_key_12345",
    {
      expiresIn: "30d",
    },
  );

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      employmentType: user.employmentType,
    },
  });
});

// Login user
export const login = TryCatch(async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email, password);
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required1",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password2",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid email or password3",
    });
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "secret_key_12345",
    {
      expiresIn: "30d",
    },
  );

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      employmentType: user.employmentType,
    },
  });
});

// Get current user
export const getMe = TryCatch(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.json({
    success: true,
    user,
  });
});
