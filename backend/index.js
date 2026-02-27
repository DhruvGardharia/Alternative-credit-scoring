import express from "express";
import dotenv from "dotenv";
import connectDb from "./database/db.js";
import bodyParser from "body-parser";
import path from "path";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import axios from "axios";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";
dotenv.config();
const port = process.env.PORT || 5005;

cloudinary.v2.config({
  cloud_name: process.env.Cloud_Name,
  api_key: process.env.Cloud_Api,
  api_secret: process.env.Cloud_Secret,
});

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import taxRoutes from "./routes/taxRoutes.js";

import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import statementRoutes from './routes/statementRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/tax", taxRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/statement', statementRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/summary', summaryRoutes);  

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

connectDb().then(() => {
  app.listen(process.env.PORT || port, () => {
    console.log(
      `Server is running on http://localhost:${process.env.PORT || port}`,
    );
  });
});
