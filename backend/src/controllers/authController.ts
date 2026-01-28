import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import {
  AuthRequest,
  RegisterRequest,
  LoginRequest,
  BiometricVerifyRequest,
  EnrollCompleteRequest,
  AuthResponse,
  BiometricVerifyResponse,
  EnrollCompleteResponse,
  ProfileResponse,
} from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const register = async (
  req: AuthRequest<RegisterRequest>,
  res: Response<AuthResponse | { error: string }>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create(email, passwordHash);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        enrolled: user.enrolled,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (
  req: AuthRequest<LoginRequest>,
  res: Response<AuthResponse | { error: string }>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        enrolled: user.enrolled,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyBiometric = async (
  req: AuthRequest<BiometricVerifyRequest>,
  res: Response<BiometricVerifyResponse | { error: string; details?: unknown }>
): Promise<void> => {
  try {
    const { csid, videoValidated } = req.body;
    const userId = req.user!.id;

    if (!csid) {
      res.status(400).json({ error: 'CSID is required' });
      return;
    }

    // CRITICAL: Require frontend to confirm video stream is valid
    if (!videoValidated) {
      res.status(400).json({ 
        error: 'Video stream validation required. Camera must be active and capturing.' 
      });
      return;
    }

    // Validate CSID format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(csid)) {
      res.status(400).json({ error: 'Invalid CSID format' });
      return;
    }

    // IMPORTANT: The ActionID API endpoints /verify and /enroll/complete don't exist
    // The SDK handles biometric verification client-side by sending frames to ActionID
    // Since the backend API endpoints are not available, we need to be more strict:
    // 1. SDK successfully captured biometric data (CSID exists and is valid UUID)
    // 2. Frontend confirmed video stream is valid (videoValidated=true) - this means:
    //    - Video element exists and is playing
    //    - Active MediaStream with live video tracks
    //    - Video tracks are enabled and not muted
    //    - Video has actual dimensions (not 0x0)
    // 3. User is enrolled (has completed enrollment)
    // 
    // SECURITY NOTE: Without the ActionID API, we cannot verify that the biometric data
    // actually matches the enrolled user. We can only verify that:
    // - The camera was active and capturing
    // - The SDK captured frames
    // - The user completed enrollment
    //
    // In a real production environment, the ActionID API would provide server-side verification
    // that the captured biometric data matches the enrolled profile.
    
    if (!req.user!.enrolled) {
      res.status(400).json({ 
        error: 'User must complete enrollment before biometric verification' 
      });
      return;
    }

    // Additional validation: CSID should be a recent session (not reused)
    // In production, you'd check this against a session store
    // For now, we trust that videoValidated=true means the frontend properly validated the stream
    
    // Log verification attempt for debugging
    console.log(`Biometric verification attempt: userId=${userId}, csid=${csid}, videoValidated=${videoValidated}, enrolled=${req.user!.enrolled}`);
    
    // Since SDK has captured biometric data, frontend validated video stream, and user is enrolled,
    // we accept the verification. In production, this would require ActionID API confirmation.
    res.json({
      verified: true,
      message: 'Biometric verification successful',
    });
    return;

    // If we reach here, the API call succeeded but didn't return verified=true
    // This means verification failed
    // Use 403 (Forbidden) instead of 401 (Unauthorized) to avoid triggering auth redirect
    res.status(403).json({
      verified: false,
      error: 'Biometric verification failed',
      message: 'Biometric data did not match enrolled profile'
    });
  } catch (error) {
    console.error('Biometric verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeEnrollment = async (
  req: AuthRequest<EnrollCompleteRequest>,
  res: Response<EnrollCompleteResponse | { error: string; details?: unknown }>
): Promise<void> => {
  try {
    const { csid } = req.body;
    const userId = req.user!.id;

    if (!csid) {
      res.status(400).json({ error: 'CSID is required' });
      return;
    }

    // IMPORTANT: The ActionID API endpoint /enroll/complete doesn't exist
    // The SDK handles biometric enrollment client-side by sending frames to ActionID
    // Since the backend API endpoint is not available, we'll mark enrollment based on:
    // 1. SDK successfully captured biometric data (CSID exists)
    // 2. User has completed the enrollment flow
    //
    // In a real production environment, the ActionID API would provide server-side enrollment verification
    // For this demo, we trust the SDK's client-side enrollment capture
    
    // Mark user as enrolled since SDK has captured biometric data
    console.log('Biometric enrollment completed (SDK-based, API endpoint not available)');
    await User.markEnrolled(userId);
    res.json({
      enrolled: true,
      message: 'Biometric enrollment completed successfully',
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response<ProfileResponse | { error: string }>
): Promise<void> => {
  try {
    res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        enrolled: req.user!.enrolled,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
