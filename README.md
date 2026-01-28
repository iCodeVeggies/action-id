# ActionID Authentication Application

A secure web application implementing biometric authentication using the ActionID SDK. Built with React (frontend) and Node.js/Express (backend).

## 📋 Overview

This application demonstrates a complete authentication flow with biometric enrollment and verification:

1. **User Registration** - New users can register with email and password
2. **Biometric Enrollment** - Users complete biometric enrollment after registration
3. **Login with Biometric** - Enrolled users can log in with biometric verification
4. **Protected Dashboard** - Access to a protected home page after authentication

## 🏗️ Architecture

### Frontend (React + Vite + TypeScript)
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **SDK Integration**: ActionID JavaScript SDK

### Backend (Node.js + Express + TypeScript)
- **Runtime**: Node.js (ES Modules)
- **Language**: TypeScript
- **Framework**: Express.js
- **Authentication**: JWT tokens
- **Password Hashing**: bcryptjs
- **API Integration**: Axios for ActionID API calls

### Key Components

#### Frontend Structure
```
frontend/
├── public/
│   └── ironvest-authentic-action-sdk.js  # ActionID SDK
├── src/
│   ├── components/
│   │   └── ProtectedRoute.tsx           # Route protection
│   ├── pages/
│   │   ├── Login.tsx                    # Login page with biometric
│   │   ├── Register.tsx                 # Registration page
│   │   ├── Enroll.tsx                   # Biometric enrollment
│   │   └── Home.tsx                     # Protected dashboard
│   ├── services/
│   │   ├── api.ts                       # Axios configuration
│   │   └── authService.ts               # Authentication service
│   ├── types/
│   │   └── index.ts                     # TypeScript type definitions
│   ├── utils/
│   │   └── useActionID.ts               # ActionID SDK React hook
│   ├── App.tsx                          # Main app component
│   └── main.tsx                         # Entry point
```

#### Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   └── actionid.ts                  # ActionID configuration
│   ├── controllers/
│   │   └── authController.ts            # Auth business logic
│   ├── db/
│   │   ├── connection.ts                # PostgreSQL connection pool
│   │   ├── init.ts                      # Database initialization
│   │   └── schema.sql                   # Database schema
│   ├── middleware/
│   │   └── auth.ts                      # JWT authentication
│   ├── models/
│   │   └── user.ts                      # User model (PostgreSQL)
│   ├── routes/
│   │   └── authRoutes.ts                # Auth routes
│   ├── types/
│   │   └── index.ts                     # TypeScript type definitions
│   └── server.ts                        # Express server
```

## 🚀 Setup Instructions

### Quick Start with Docker (Recommended)

The easiest way to run the application is using Docker Compose:

1. **Clone the repository** (if you haven't already)

2. **Create environment file**:
```bash
cp .env.example .env
# Edit .env if needed (defaults should work for local development)
```

3. **Start all services**:
```bash
docker-compose up -d
```

4. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

5. **View logs**:
```bash
docker-compose logs -f
```

6. **Stop services**:
```bash
docker-compose down
```

7. **Stop and remove volumes** (clean slate):
```bash
docker-compose down -v
```

### Manual Setup (Development)

#### Prerequisites
- Node.js 18+ (with ES Modules support)
- PostgreSQL 16+ (or use Docker for database only)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Build TypeScript:
```bash
npm run build
```

4. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=3001
ACTIONID_API_KEY=5000d0dc-9729-4273-b286-01ebb5a8fd7f
ACTIONID_BASE_URL=https://aa-api.a2.ironvest.com
ACTIONID_CLIENT_ID=ivengprod
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload (TypeScript):
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📚 API Endpoints

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
  - Body: `{ email, password }`
  - Returns: `{ user, token }`

- `POST /api/auth/login` - Login with email/password
  - Body: `{ email, password }`
  - Returns: `{ user, token }`

- `POST /api/auth/verify-biometric` - Verify biometric for login (protected)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ csid, actionID }`
  - Returns: `{ verified, message }`

- `POST /api/auth/enroll/complete` - Complete biometric enrollment (protected)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ csid }`
  - Returns: `{ enrolled, message }`

- `GET /api/auth/profile` - Get current user profile (protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user }`

## 🔐 ActionID SDK Integration

### Key Implementation Details

1. **SDK Loading**: The SDK is loaded via script tag in `index.html` before the React app initializes.

2. **Initialization**: The SDK is initialized with:
   - `cid`: Client ID (ivengprod)
   - `csid`: Client Session ID (generated UUID)
   - `uid`: User ID
   - `baseURL`: ActionID API base URL

3. **Critical Steps**:
   - Must call `setCsid()` and `setUid()` after initialization
   - Use `size: 'fill'` in `startBiometricSession()` options
   - Always call `destroy()` for cleanup to prevent memory leaks

4. **React Hook**: The `useActionID` hook manages SDK lifecycle:
   - Automatic cleanup on component unmount
   - Singleton pattern enforcement
   - Proper error handling

### Biometric Flow

1. **Enrollment**:
   - User registers → Redirected to `/enroll`
   - SDK initialized with user ID
   - Camera capture started
   - User completes enrollment
   - CSID sent to backend for verification
   - User marked as enrolled

2. **Login**:
   - User enters credentials
   - If enrolled, biometric verification shown
   - Camera capture started
   - CSID sent to backend for verification
   - On success, user redirected to home

## 🎨 User Flow

1. **New User**:
   - Visit `/register` → Create account → Redirected to `/enroll` → Complete biometric enrollment → Access `/home`

2. **Enrolled User**:
   - Visit `/login` → Enter credentials → Biometric verification → Access `/home`

3. **Protected Routes**:
   - `/enroll` and `/home` require authentication
   - Unauthenticated users redirected to `/login`

## ⚠️ Important Notes

### Manual Steps Required

1. **ActionID API Integration**: The backend makes API calls to ActionID's verification endpoints. You may need to:
   - Verify the exact API endpoint URLs and request/response formats
   - Check if additional headers or authentication methods are required
   - Test the API endpoints with the provided credentials

2. **Database**: PostgreSQL is now integrated and used by default. The database schema is automatically initialized on first run.

3. **Environment Variables**: 
   - Update `JWT_SECRET` with a secure random string in production
   - Ensure all ActionID credentials are correct

4. **SDK File**: The SDK file (`ironvest-authentic-action-sdk.js`) is already copied to `frontend/public/`. If you need to update it:
   - Replace the file in `frontend/public/`
   - Ensure it's named correctly in `index.html`

5. **CORS Configuration**: Update `backend/src/server.js` with your frontend URL if deploying:
   ```javascript
   origin: process.env.FRONTEND_URL || 'http://localhost:5173'
   ```

### Known Limitations

- **API Endpoints**: ActionID API endpoints may need verification/adjustment based on actual API documentation
- **Error Handling**: Some edge cases may need additional error handling based on actual API responses

## 🧪 Testing

1. **Start both servers** (backend and frontend)
2. **Register a new user** at `/register`
3. **Complete enrollment** at `/enroll` (allow camera access)
4. **Logout and login** at `/login` (test biometric verification)
5. **Access protected home page** at `/home`

## 📝 Assumptions Made

1. **ActionID API Endpoints**: Assumed endpoints:
   - `POST /verify` for biometric verification
   - `POST /enroll/complete` for enrollment completion
   - These may need adjustment based on actual API documentation

2. **API Authentication**: Using `X-API-Key` header for API authentication

3. **Session Management**: Using JWT tokens stored in localStorage

4. **User Model**: PostgreSQL-based user model with email, password hash, and enrollment status

## 🛠️ Technologies Used

- **Frontend**: React, TypeScript, React Router, Vite, Tailwind CSS, Axios
- **Backend**: Node.js, TypeScript, Express, JWT, bcryptjs, Axios
- **Database**: PostgreSQL 16
- **SDK**: ActionID JavaScript SDK (IronVest)
- **Build Tools**: TypeScript, tsx (for development)
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (for frontend in production)

## 📄 License

MIT
