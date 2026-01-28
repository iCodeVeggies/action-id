# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn installed

## Step 1: Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (defaults should work)
npm start
```

Backend will run on `http://localhost:3001`

## Step 2: Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

## Step 3: Test the Application

1. Open `http://localhost:5173` in your browser
2. Click "Register" to create a new account
3. After registration, you'll be redirected to enrollment
4. Click "Start Enrollment" and allow camera access
5. Look at the camera, then click "Complete Enrollment"
6. You'll be redirected to the home page
7. Logout and login again to test biometric verification

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Node.js version is 18+
- Check that all dependencies are installed

### Frontend won't start
- Check if port 5173 is available
- Verify all dependencies are installed
- Check browser console for errors

### Camera not working
- Ensure you've granted camera permissions
- Check browser console for SDK errors
- Verify the SDK file is in `frontend/public/`

### API errors
- Verify backend is running
- Check backend console for errors
- Verify ActionID API credentials in `.env`
- **Important**: ActionID API endpoints may need verification (see IMPLEMENTATION.md)

## Next Steps

1. Review `README.md` for detailed documentation
2. Review `IMPLEMENTATION.md` for what needs manual configuration
3. Test the complete flow
4. Verify ActionID API integration
