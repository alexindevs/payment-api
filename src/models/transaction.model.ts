import { PrismaClient, Transaction as PrismaTransaction } from '@prisma/client';

const prisma = new PrismaClient();



class Transaction {
  public transaction: PrismaTransaction;

  constructor(transaction: PrismaTransaction) {
    this.transaction = transaction;
  }

  /**
   * Initiates a new transaction with the provided details.
   *
   * @param {number} userId - The ID of the user initiating the transaction.
   * @param {number} amount - The amount of the transaction.
   * @param {string} currency - The currency of the transaction.
   * @param {string} reference - The unique reference for the transaction.
   * @param {string} narration - Additional information or notes about the transaction.
   * @return {Promise<Transaction | null>} A Promise that resolves to the created Transaction object if successful, or null if there was an error.
   */
  static async initiateTransaction(
    userId: number,
    amount: number,
    currency: string,
    reference: string,
    narration?: string
  ): Promise<Transaction | null> {
    try {
      const newTransaction = await prisma.transaction.create({
        data: {
          userId,
          amount,
          currency,
          status: 'pending',
          reference,
          initiationDateTime: Date.now(),
          narration,
        },
      });

      return new Transaction(newTransaction);
    } catch (error) {
      console.error('Error initiating transaction:', error);
      return null;
    }
  }

  /**
   * Fetches a transaction by its ID.
   *
   * @param {number} id - The ID of the transaction to fetch.
   * @return {Promise<Transaction | null>} A Promise that resolves to the Transaction object if found, otherwise null.
   */
  static async getTransactionById(id: number): Promise<Transaction | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });

      return transaction ? new Transaction(transaction) : null;
    } catch (error) {
      console.error('Error fetching transaction by ID:', error);
      return null;
    }
  }

  /**
   * Fetches all transactions for a given user.
   *
   * @param {number} userId - The ID of the user whose transactions are to be fetched.
   * @return {Promise<Transaction[]>} A Promise that resolves to an array of Transaction objects.
   */
  static async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId },
      });

      return transactions.map((transaction) => new Transaction(transaction));
    } catch (error) {
      console.error('Error fetching transactions by user:', error);
      return [];
    }
  }

  /**
   * Fetches a transaction by its reference.
   *
   * @param {string} reference - The reference of the transaction.
   * @return {Promise<Transaction | null>} A promise that resolves to the transaction if found, or null if not found.
   */
  static async fetchTransactionByReference(reference: string): Promise<Transaction | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { reference },
      });
      
      return transaction ? new Transaction(transaction) : null;
    } catch (error) {
      console.error('Error fetching transaction by reference:', error);
      return null;
    }
  }

  /**
   * Completes a transaction in the database.
   *
   * @param {string} reference - The reference of the transaction.
   * @param {string} status - The status to update the transaction to.
   * @return {Promise<Transaction | null>} The completed transaction or null if not found.
   */
  static async completeTransaction(reference: string, status: string): Promise<Transaction | null> {
    try {
      // Retrieve the transaction from the database using the reference
      const existingTransaction = await prisma.transaction.findUnique({
        where: { reference },
      });
  
      // Check if the transaction exists
      if (!existingTransaction) {
        console.error('Transaction not found');
        return null;
      }
  
      // Update the transaction status to "completed" in the database
      const updatedTransaction = await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: { status: status, completionDateTime: Date.now() },
      });
  
      return new Transaction(updatedTransaction);
    } catch (error) {
      console.error('Error completing transaction: ', error);
      return null;
    }
  }

  static async getTransactionsByTime(startDate: number, endDate: number): Promise<Transaction[]> { // Milliseconds
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          initiationDateTime: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      return transactions.map((transaction) => new Transaction(transaction));
    } catch (error) {
      console.error('Error fetching transactions by time:', error);
      return [];
    }
  }
}

export default Transaction;
