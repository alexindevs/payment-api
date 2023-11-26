// startTransaction.test.ts

import { Request, Response } from 'express';
import { StartTransaction } from '../../src/controllers/transaction.controller' // Update this with the correct path
import User from '../../src/models/user.model'; // Update this with the correct path
import Transaction from '../../src/models/transaction.model'; // Update this with the correct path

jest.mock('../../src/models/user.model'); // Mock the User model
jest.mock('../../src/models/transaction.model'); // Mock the Transaction model

const mockRequest = {} as Request;
const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as unknown as Response;

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

const mockFlutterwaveResponse = {
  status: 'success',
  meta: {
    authorization: {
      transfer_reference: 'test-reference',
      transfer_account: '7825397990',
      transfer_bank: 'WEMA BANK',
      transfer_amount: 100,
      mode: 'banktransfer',
    },
  },
};
const mockFlutterwaveCharge = jest.fn().mockResolvedValue(mockFlutterwaveResponse);
jest.mock('flutterwave-node-v3', () => ({
  __esModule: false,
  default: jest.fn().mockImplementation(() => ({
    Charge: { bank_transfer: mockFlutterwaveCharge },
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
});


jest.mock('../../src/models/user.model', () => ({
  __esModule: true,
  default: {
    getUserById: jest.fn().mockResolvedValue({
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpassword',
      },
    }),
  },
}));

jest.mock('../../src/models/transaction.model', () => ({
  __esModule: true,
  default: {
    initiateTransaction: jest.fn().mockResolvedValue({
      transaction: {
        id: 1,
        userId: 1,
        amount: 100,
        currency: 'NGN',
        status: 'pending',
        reference: 'test-reference',
        initiationDateTime: Date.now(),
      },
    }),
  },
}));

test('StartTransaction initiates a successful transaction', async () => {
  mockRequest.body = {
    userId: 1,
    amount: 100,
    currency: 'USD',
    narration: 'Test transaction',
  };

  try {
    await StartTransaction(mockRequest, mockResponse);

    // Assertions
    console.log('Mock Flutterwave Charge Calls:', mockFlutterwaveCharge.mock.calls);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: true,
      message: 'Transaction initiated successfully. Make payment into this account:',
      paymentInfo: mockFlutterwaveResponse.meta.authorization,
      data: {
        transactionId: 1,
        reference: expect.any(String),
      },
    });
  } catch (error) {
    console.error('Test Error:', error);
  }
}, 100000);

