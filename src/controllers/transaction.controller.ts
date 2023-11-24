const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(String(process.env.FLUTTERWAVE_PUBLIC_KEY), String(process.env.FLUTTERWAVE_SECRET_KEY));
import Transaction from "../models/transaction.model";
import User from "../models/user.model";

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
export const StartTransaction = async (req: Request, res: Response) => {
  try {
    const { userId, amount, currency, narration } = req.body;
    const user = await User.getUserById(userId);

    const reference = uuidv4();

    const flutterwaveResponse = await flw.Charge.bank_transfer({
      tx_ref: reference,
      amount: String(amount),
      email: user?.user.email,
      currency,
    });

    if (flutterwaveResponse.status === 'success') {
      const newTransaction = await Transaction.initiateTransaction(userId, amount, currency, reference, narration);
      res.json({
        status: true,
        message: 'Transaction initiated successfully. Make payment into this account:',
        paymentInfo: flutterwaveResponse.meta.authorization,
        data: {
          transactionId: newTransaction?.transaction.id,
          reference
        },
      });
    } else {
      res.status(500).json({
        status: false,
        message: 'Failed to initiate transaction',
        data: null,
      });
    }
  } catch (error) {
    console.error('Error starting transaction:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      data: null,
    });
  }
};

export const EndTransaction = async (req: Request, res: Response) => {
  try {
    const webhookPayload = req.body; // Assuming the payload is in the request body
    console.log(webhookPayload);
    if (!webhookPayload) {
      return res.status(400).json({ status: 'error', message: 'Invalid webhook payload' });
    }
    // Check if the webhook event indicates a successful charge
    if (webhookPayload.event === 'charge.completed' && webhookPayload.data.status === 'successful') {
      const reference = webhookPayload.data.tx_ref;

      // Fetch the transaction by reference
      const transaction = await Transaction.fetchTransactionByReference(reference);

      if (transaction) {
        // Update the transaction status to "completed"
        const completedTransaction = await Transaction.completeTransaction(reference, webhookPayload.data.status);

        if (completedTransaction) {
          // Transaction was successfully completed
          return res.json({ status: 'success', message: 'Transaction completed successfully' });
        } else {
          // Failed to complete the transaction after retries
          return res.status(500).json({ status: 'error', message: 'Failed to complete transaction' });
        }
      } else {
        // Transaction not found
        return res.status(404).json({ status: 'error', message: 'Transaction not found' });
      }
    } else {
      // Ignore non-successful charge events
      return res.json({ status: 'success', message: 'Webhook event ignored' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};



export const fetchTransactionsByUserID = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const transactions = await Transaction.getTransactionsByUser(parseInt(userId));
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions by user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const fetchTransactionByTime = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string, endDate: string };
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    const transactions = await Transaction.getTransactionsByTime(startTime, endTime);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions by time:', error);
    res.status(500).json({ message: 'Internal server error' });    
  }
  
}