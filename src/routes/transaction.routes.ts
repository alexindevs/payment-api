import { Router } from "express";
import * as TransactionController from "../controllers/transaction.controller";
import { tokenVerification } from "../controllers/auth.controller";

const TransactionRouter = Router();

TransactionRouter.post("/initialize", tokenVerification, TransactionController.StartTransaction);
TransactionRouter.post("/verify", TransactionController.EndTransaction);
TransactionRouter.get("/user:userId", tokenVerification, TransactionController.fetchTransactionsByUserID);
TransactionRouter.get("/period", tokenVerification, TransactionController.fetchTransactionByTime);   

export default TransactionRouter