"use strict";
// src/controllers/transaction.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTransactionByTime = exports.fetchTransactionsByUserID = exports.EndTransaction = exports.StartTransaction = void 0;
const uuid_1 = require("uuid");
const user_model_1 = __importDefault(require("../models/user.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Use dynamic import for production to avoid type issues
let flw;
if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Flutterwave = require('flutterwave-node-v3');
    flw = new Flutterwave(String(process.env.FLUTTERWAVE_PUBLIC_KEY), String(process.env.FLUTTERWAVE_SECRET_KEY));
}
const StartTransaction = async (req, res) => {
    try {
        const { userId, amount, currency, narration } = req.body;
        const user = await user_model_1.default.getUserById(userId);
        const reference = (0, uuid_1.v4)();
        // Use the dynamic import for flutterwave only in production
        const flutterwaveResponse = process.env.NODE_ENV === 'production'
            ? await flw.Charge.bank_transfer({
                tx_ref: reference,
                amount: String(amount),
                email: user?.user.email,
                currency,
            })
            : {};
        if (flutterwaveResponse.status === 'success') {
            const newTransaction = await transaction_model_1.default.initiateTransaction(userId, amount, currency, reference, narration);
            res.json({
                status: true,
                message: 'Transaction initiated successfully. Make payment into this account:',
                paymentInfo: flutterwaveResponse.meta.authorization,
                data: {
                    transactionId: newTransaction?.transaction.id,
                    reference
                },
            });
        }
        else {
            console.log("Flutterwave failed..");
            res.status(500).json({
                status: false,
                message: 'Failed to initiate transaction',
                data: null,
            });
        }
    }
    catch (error) {
        console.error('Error starting transaction:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error',
            data: null,
        });
    }
};
exports.StartTransaction = StartTransaction;
const EndTransaction = async (req, res) => {
    try {
        const verif_hash = req.headers['verif-hash'];
        if (!verif_hash || verif_hash !== process.env.FLUTTERWAVE_VERIF_HASH) {
            return res.status(400).json({ status: 'error', message: 'Invalid verification hash' });
        }
        const webhookPayload = req.body; // Assuming the payload is in the request body
        console.log(webhookPayload);
        if (!webhookPayload) {
            return res.status(400).json({ status: 'error', message: 'Invalid webhook payload' });
        }
        if (webhookPayload.event === 'charge.completed' && webhookPayload.data.status === 'successful') {
            res.status(200).json({ status: 'success', message: 'Notification received' });
            const reference = webhookPayload.data.tx_ref;
            const transaction = await transaction_model_1.default.fetchTransactionByReference(reference);
            if (transaction) {
                const completedTransaction = await transaction_model_1.default.completeTransaction(reference, webhookPayload.data.status);
                if (completedTransaction) {
                    console.log("Transaction completed with tx_ref: ", completedTransaction.transaction.reference);
                }
                else {
                    console.log("Failed to complete the transaction with tx_ref: " + reference);
                }
            }
            else {
                console.log("Transaction not found with tx_ref: " + reference);
            }
        }
        else {
            console.log(" Charge failed with tx_ref: ", webhookPayload.data.tx_ref);
        }
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.EndTransaction = EndTransaction;
const fetchTransactionsByUserID = async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await transaction_model_1.default.getTransactionsByUser(parseInt(userId));
        const serializedTransactions = transactions.map(transaction => ({
            ...transaction,
            transaction: {
                ...transaction.transaction,
                initiationDateTime: Number(transaction.transaction.initiationDateTime),
                completionDateTime: Number(transaction.transaction.completionDateTime)
            }
        }));
        res.json(serializedTransactions);
    }
    catch (error) {
        console.error('Error fetching transactions by user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.fetchTransactionsByUserID = fetchTransactionsByUserID;
const fetchTransactionByTime = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jsonwebtoken_1.default.decode(token);
        if (typeof decodedToken === 'object' && decodedToken !== null) {
            const userId = decodedToken.user?.id;
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Start date and end date are required' });
            }
            const startTime = new Date(startDate).getTime();
            const endTime = new Date(endDate).getTime();
            const transactions = await transaction_model_1.default.getTransactionsByTime(startTime, endTime, parseInt(userId));
            const serializedTransactions = transactions.map(transaction => ({
                ...transaction,
                transaction: {
                    ...transaction.transaction,
                    initiationDateTime: Number(transaction.transaction.initiationDateTime),
                    completionDateTime: Number(transaction.transaction.completionDateTime)
                }
            }));
            res.json(serializedTransactions);
        }
    }
    catch (error) {
        console.error('Error fetching transactions by time:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.fetchTransactionByTime = fetchTransactionByTime;
