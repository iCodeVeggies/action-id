import express from 'express';
import {
  register,
  login,
  verifyBiometric,
  completeEnrollment,
  getProfile,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-biometric', authenticateToken, verifyBiometric);
router.post('/enroll/complete', authenticateToken, completeEnrollment);
router.get('/profile', authenticateToken, getProfile);

export default router;
