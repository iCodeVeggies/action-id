import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.js';

export interface ActionIDConfig {
  CLIENT_ID: string;
  BASE_URL: string;
  API_KEY: string;
}

export interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  enrolled: boolean;
  createdAt: Date;
}

export interface AuthRequest<B = any> extends Request<Record<string, string>, any, B> {
  user?: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface BiometricVerifyRequest {
  csid: string;
  actionID?: string;
  videoValidated?: boolean; // Frontend confirms video stream is active
}

export interface EnrollCompleteRequest {
  csid: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    enrolled: boolean;
  };
  token: string;
}

export interface BiometricVerifyResponse {
  verified: boolean;
  message?: string;
  error?: string;
}

export interface EnrollCompleteResponse {
  enrolled: boolean;
  message?: string;
  error?: string;
}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    enrolled: boolean;
  };
}

export interface ActionIDVerifyRequest {
  cid: string;
  csid: string;
  uid: string;
  actionID: string;
}

export interface ActionIDEnrollRequest {
  cid: string;
  csid: string;
  uid: string;
}

export interface ActionIDVerifyResponse {
  verified: boolean;
}

export interface ActionIDEnrollResponse {
  enrolled: boolean;
}

export type AuthHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
