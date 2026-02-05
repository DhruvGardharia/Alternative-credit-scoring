import express from "express";
import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseStats,
} from "../controllers/expenseController.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuth, addExpense);
router.get("/", isAuth, getExpenses);
router.get("/stats", isAuth, getExpenseStats);
router.put("/:id", isAuth, updateExpense);
router.delete("/:id", isAuth, deleteExpense);

export default router;
