# QA & Code Audit Report
**Project:** Nexpay Fintech Dashboard
**Date:** July 24, 2026

## ✅ Working Correctly

### 1. Project Structure & Config
- **Monorepo Separation:** `/client` and `/server` are correctly separated.
- **Git Config:** `.gitignore` properly excludes `node_modules`, `dist`, and `.env` files.
- **Documentation:** `README.md` provides excellent setup instructions, architecture breakdown, and environment variable documentation.

### 2. Authentication & Authorization
- **JWT & Hashing:** Passwords are securely hashed with bcrypt (salt 12). JWTs are generated securely using environment variables (`JWT_SECRET`).
- **Token Rotation:** Refresh tokens are securely issued as `httpOnly` cookies and successfully rotated/invalidated on logout or refresh.
- **Role Enforcement:** The `authorize` middleware successfully restricts admin routes. When tested with a standard user token, `/api/users` correctly rejected the request with a `403 Forbidden` response.
- **Route Protection:** Direct hits to protected routes without a token correctly return `401 Unauthorized`.

### 3. API Functional Testing (Live Deployment)
End-to-end API tests on the live Render deployment (`https://nexpay-api-11oo.onrender.com/api`) all passed:
- Registering a new user works (201). Duplicate emails are rejected (400).
- Login works and issues JWTs (200). Wrong passwords return proper errors (401).
- Fetching user profiles (`/api/auth/me`) works perfectly (200).
- Deposit transactions correctly increase wallet balances (201).
- Attempting to buy crypto without sufficient USD balance properly rejects the request (400).
- CORS headers correctly return `Access-Control-Allow-Origin: https://nexpay-fintech-dashboard.vercel.app`.

---

## ⚠️ Working but needs improvement

### 1. Render Free-Tier Cold Starts
- **Observation:** Render free-tier instances sleep after 15 minutes of inactivity. When a user visits the app after it goes to sleep, the initial API request (e.g., login or fetching the dashboard) can take **30 to 60 seconds** to resolve. 
- **Suggestion:** Add a loading spinner on the frontend that specifically mentions "Waking up server..." if a request takes longer than 5 seconds, so users don't think the app is broken.

---

## ✅ Fixed (Security & Logic Bugs)

### 1. Severe Race Condition in Transactions
- **Fix Applied:** Refactored `server/src/controllers/transaction.controller.js` to use MongoDB atomic `$inc` operators and Mongoose Database Sessions/Transactions. Concurrent requests now safely abort with WriteConflicts rather than double-spending.

### 2. Global Rate Limiting & Incorrect IP Logging (Proxy Issue)
- **Fix Applied:** Added `app.set('trust proxy', 1);` in `src/index.js` so that Render's reverse proxy IP is bypassed and the actual user's IP is correctly logged for rate-limiting and auditing.

### 3. Error Handler Leaking Stack Traces (Edge Case)
- **Fix Applied:** Updated the error handler in `src/index.js` to use a strict `process.env.NODE_ENV !== 'production'` fallback, ensuring stack traces are never exposed if the environment variable goes missing.
