# 💳 Nexpay — Fintech Transaction Dashboard

Visit: https://nexpay-fintech-dashboard.vercel.app/login

A production-ready MERN stack fintech dashboard with JWT authentication, OAuth login, role-based access control, multi-currency wallets, and comprehensive transaction management.

![Nexpay Dashboard](https://img.shields.io/badge/Status-Live-brightgreen) 

## 🏗 Architecture

```
nexpay-fintech-dashboard/
├── client/            # React frontend (Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth context provider
│   │   ├── pages/         # Route page components
│   │   └── services/      # Axios API service layer
│   └── ...
├── server/            # Express.js backend API
│   ├── src/
│   │   ├── config/        # DB & Passport configuration
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express route definitions
│   │   ├── validators/    # Zod validation schemas
│   │   └── utils/         # Helper functions
│   └── ...
└── README.md
```

## ✨ Features

### Authentication & Authorization
- **Email/Password** registration and login with bcrypt hashing
- **Google OAuth** and **GitHub OAuth** social login
- **JWT access tokens** (15-minute expiry) + **refresh token rotation** (7-day expiry)
- **Role-based access control**: User, Admin, Auditor

### Wallets
- Multi-currency wallets: **USD**, **BTC**, **ETH**
- Real-time balance display with USD equivalents
- Mock exchange rates: BTC = $43,250 | ETH = $2,280

### Transactions
- **Deposit** — Add funds to any wallet
- **Withdraw** — Remove funds with balance validation
- **Transfer** — Send USD to another user by email
- **Crypto Buy** — Purchase BTC/ETH using USD balance
- **Crypto Sell** — Sell BTC/ETH for USD
- Full transaction history with pagination and filters

### Admin Panel
- User management (view, search, paginate)
- Role management (assign user/admin/auditor)
- Account freeze/unfreeze
- View all system transactions

### Audit System
- Comprehensive audit logging of all actions
- Auditor role: read-only access to all transactions and audit logs
- Filterable, paginated audit trail

### Security
- Helmet.js for secure HTTP headers
- CORS restricted to frontend origin
- Rate limiting on auth endpoints (20 req/15 min)
- Input validation with Zod on all mutation endpoints
- HttpOnly cookies for refresh tokens

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/nexpay-fintech-dashboard.git
cd nexpay-fintech-dashboard
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd client
cp .env.example .env
# Edit .env if needed
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000`.

## 🔐 Environment Variables

### Server (`/server/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/nexpay` |
| `JWT_SECRET` | Secret for signing access tokens | `your-secret-key-min-32-chars` |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens | `your-refresh-secret-min-32-chars` |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-...` |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | `Iv1.abc123...` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | `abc123...` |
| `CLIENT_URL` | Frontend URL (for CORS and redirects) | `http://localhost:5173` |
| `SERVER_URL` | Backend URL (for OAuth callbacks) | `http://localhost:5000` |

### Client (`/client/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_APP_NAME` | Application name | `Nexpay` |

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login with email/password |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Auth | Logout and revoke refresh token |
| GET | `/api/auth/me` | Auth | Get current user profile |
| GET | `/api/auth/google` | Public | Google OAuth redirect |
| GET | `/api/auth/github` | Public | GitHub OAuth redirect |

### Wallets
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/wallets` | Auth | Get user's wallets |
| GET | `/api/wallets/:id` | Auth | Get specific wallet |

### Transactions
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/transactions` | Auth | Create transaction |
| GET | `/api/transactions` | Auth | Get user's transactions |
| GET | `/api/transactions/:id` | Auth | Get specific transaction |

### Users (Admin)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/:id` | Admin | Get user details |
| PATCH | `/api/users/:id/role` | Admin | Update user role |
| PATCH | `/api/users/:id/freeze` | Admin | Freeze/unfreeze user |
| GET | `/api/users/all-transactions` | Admin | All system transactions |

### Audit
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/audit` | Admin/Auditor | Get audit logs |
| GET | `/api/audit/transactions` | Auditor | Read-only transactions |

## 🌐 Deployment

### MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free M0 cluster. **Note: Multi-document transactions require a MongoDB Replica Set.** All Atlas clusters (including M0 Free Tier) are replica sets by default and fully support this feature.
3. Create a database user and whitelist `0.0.0.0/0`
4. Copy the connection string to `MONGO_URI`

### Backend on Render
1. Connect your GitHub repo to [Render](https://render.com)
2. Create a new Web Service pointing to `/server`
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add all environment variables from the table above

### Frontend on Vercel
1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set root directory to `client`
3. Set `VITE_API_URL` to your Render backend URL + `/api`
4. Deploy

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS 3, React Router 6, Recharts, Axios |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB (Atlas) |
| Auth | JWT, bcrypt, Passport.js (Google & GitHub OAuth) |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas |

