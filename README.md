# Payment API

This API was built for an interview with Thrindle. It provides endpoints for initializing and managing transactions, verifying and completing transactions, and fetching transaction details based on user ID and time periods.

## Overview

The Payment API is designed to facilitate secure and efficient transaction processing. It leverages Flutterwave for transaction handling and provides a range of functionalities for managing transactions. The API requires authentication using a Bearer token, and certain endpoints are protected for authorized access only.

## Endpoints

1. **Initialize Transaction**
   - Endpoint: `POST /transfers/initialize`
   - Description: Initiates a new transaction with the specified details. Returns payment information for completing the transaction. Requires authentication.

2. **Verify Transaction**
   - Endpoint: `POST /transfers/verify`
   - Description: Verifies and completes a transaction based on the Flutterwave webhook payload. Handles successful and failed charge events.
   - NOT FOR PUBLIC USAGE

3. **Fetch Transactions by User ID**
   - Endpoint: `GET /transfers/user/:userId`
   - Description: Retrieves a list of transactions associated with the specified user ID. Requires authentication.

4. **Fetch Transactions by Time Period**
   - Endpoint: `GET /transfers/period`
   - Description: Fetches transactions within a specified time range. Requires authentication.

## Authentication

All protected endpoints require a Bearer token for authentication. Include the token in the `Authorization` header of your requests.

## Testing

To test the API, you can use the provided Postman collection. Ensure to replace placeholders with the appropriate values.

For detailed API documentation, refer to the [Postman Documentation](https://documenter.getpostman.com/view/28783766/2s9YeD9Dja).
The endpoint is also publicly available at [Deployment](https://payment-api-89jt.onrender.com) for further testing.

## Contributions

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

Happy coding!
