import { User } from "../models/userModel.js";
import TryCatch from "../utils/TryCatch.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOtpEmail } from "../utils/sendEmail.js";

const TEMP_USERS = {};
const PASSWORD_RESET_TEMP = {};

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
      message: "User already exists",
    });
  }

  // Generate 6 digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Hash OTP using bcrypt
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Store temporarily
  TEMP_USERS[email] = {
    name,
    email,
    password,
    employmentType,
    phone,
    hashedOtp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  // Send OTP email via Resend
  await sendOtpEmail(email, otp);

  // Create temporary verification token
  const token = jwt.sign({ email }, process.env.JWT_SEC, {
    expiresIn: "5m",
  });

  res.status(200).json({
    success: true,
    message: "OTP sent to email",
    token,
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
    process.env.JWT_SEC || "secret_key_12345",
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

export const verifyOtp = TryCatch(async (req, res) => {
  const { otp } = req.body;
  const { token } = req.params;

  if (!otp || !token) {
    return res.status(400).json({
      message: "OTP and token required",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SEC);
  } catch (error) {
    return res.status(400).json({
      message: "Invalid or expired token",
    });
  }

  const email = decoded.email;
  const tempUser = TEMP_USERS[email];

  if (!tempUser) {
    return res.status(400).json({
      message: "No OTP request found",
    });
  }

  if (tempUser.expiresAt < Date.now()) {
    delete TEMP_USERS[email];
    return res.status(400).json({
      message: "OTP expired",
    });
  }

  const isMatch = await bcrypt.compare(otp, tempUser.hashedOtp);

  if (!isMatch) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(tempUser.password, 10);

  // Create user
  const user = await User.create({
    name: tempUser.name,
    email: tempUser.email,
    password: hashedPassword,
    employmentType: tempUser.employmentType,
    phone: tempUser.phone,
  });

  delete TEMP_USERS[email];

  // Generate login token
  const authToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SEC,
    { expiresIn: "30d" }
  );

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token: authToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "No user found with this email",
    });
  }

  // Generate OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Hash OTP
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Store temporarily
  PASSWORD_RESET_TEMP[email] = {
    hashedOtp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };

  // Send OTP Email
  await sendOtpEmail(email, otp);

  // Create short-lived token
  const token = jwt.sign({ email }, process.env.JWT_SEC, {
    expiresIn: "5m",
  });

  res.status(200).json({
    success: true,
    message: "OTP sent to your email",
    token,
  });
});
export const resetPassword = TryCatch(async (req, res) => {
  const { token } = req.params;
  const { otp, password } = req.body;

  if (!otp || !password) {
    return res.status(400).json({
      message: "OTP and new password required",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SEC);
  } catch (error) {
    return res.status(400).json({
      message: "Invalid or expired token",
    });
  }

  const email = decoded.email;
  const tempData = PASSWORD_RESET_TEMP[email];

  if (!tempData) {
    return res.status(400).json({
      message: "No reset request found",
    });
  }

  if (tempData.expiresAt < Date.now()) {
    delete PASSWORD_RESET_TEMP[email];
    return res.status(400).json({
      message: "OTP expired",
    });
  }

  const isMatch = await bcrypt.compare(otp, tempData.hashedOtp);

  if (!isMatch) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  // Update password
  const hashedPassword = await bcrypt.hash(password, 10);

  await User.findOneAndUpdate(
    { email },
    { password: hashedPassword }
  );

  delete PASSWORD_RESET_TEMP[email];

  res.status(200).json({
    success: true,
    message: "Password reset successful",
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
