# Web3 Message Signer & Verifier

A full-stack Web3 application that allows users to authenticate via Dynamic.xyz's headless email wallet, sign custom messages, verify signatures on a Node.js/Express backend, and manage multi-factor authentication (MFA). Built with React (TypeScript), Tailwind CSS, Node.js (TypeScript), Express, ethers.js, and Joi for validation.

## Features

- **Frontend**:
  - Headless email authentication using Dynamic.xyz embedded wallets
  - Sign custom messages with connected wallet
  - Display signature verification results (validity, signer address)
  - Persist signing history in localStorage
  - Beautiful, responsive UI with Tailwind CSS
  - Bonus: Headless MFA with TOTP (QR code, OTP verification, backup codes)
- **Backend**:
  - REST API (`POST /verify-signature`) to validate signatures using ethers.js
  - Joi validation for secure request handling
  - Returns signature validity, signer address, and original message
- **Testing**: Jest tests for frontend (snapshot, component) and backend (API validation)

## Prerequisites

- **Node.js** v18 or higher
- **Dynamic.xyz account**: Get your `environmentId` from the [Dynamic dashboard](https://app.dynamic.xyz/)
  - Enable embedded wallets and email authentication in your project settings

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update `.env` with your Dynamic `VITE_APP_DYNAMIC_ID` and `VITE_APP_SERVER` with your server url:
   ```typescript
   VITE_APP_DYNAMIC_ID: "YOUR_ENVIRONMENT_ID"; // Replace with your ID
   VITE_APP_SERVER: "YOUR_BACKEND_URL"; // Replace with your Server URL
   ```
4. Run the frontend:
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`.

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Initialize a new Node.js project:
   ```bash
   npm install
   ```
3. Run the backend:
   ```bash
   npm start
   ```
   The server will run at `http://localhost:5000`.

### Testing

     ```bash
     cd backend
     npm test
     ```

## Usage

1. **Login**: Enter your email, receive an OTP, and verify to connect your embedded wallet.
2. **Sign Message**: Input a message, click "Sign & Verify" to sign with your wallet and send to the backend.
3. **View Results**: See signature validity and signer address. History persists across sessions.
4. **MFA (Bonus)**: Add a TOTP device by scanning a QR code, verify OTP, and view backup codes.

## Notes

- Ensure your Dynamic.xyz project has embedded wallets and email auth enabled.
- Backend assumes Ethereum signatures; extend Joi schema for other chains if needed.
- Tests cover basic functionality; expand for edge cases in production.

For questions or issues, refer to the [Dynamic.xyz docs](https://docs.dynamic.xyz/) or contact support.
