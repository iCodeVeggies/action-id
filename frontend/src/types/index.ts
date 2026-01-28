export interface User {
  id: string;
  email: string;
  enrolled: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface BiometricVerifyRequest {
  csid: string;
  actionID?: string;
  videoValidated?: boolean; // Frontend confirms video stream is active
}

export interface BiometricVerifyResponse {
  verified: boolean;
  message?: string;
  error?: string;
}

export interface EnrollCompleteRequest {
  csid: string;
}

export interface EnrollCompleteResponse {
  enrolled: boolean;
  message?: string;
  error?: string;
}

export interface ProfileResponse {
  user: User;
}

export interface ActionIDConfig {
  cid: string;
  baseURL: string;
  debug: boolean;
}

export interface BiometricSessionOptions {
  size?: string;
  opacity?: number;
  useVirtualAvatar?: boolean;
  frequency?: number;
  actionID?: string;
}

// ActionID SDK types (from window.Ironvest)
export interface IronvestInstance {
  setCsid(csid: string): void;
  setUid(uid: string): void;
  startBiometricSession(containerId: string, options: BiometricSessionOptions): void;
  stopBiometric(): void;
  destroy(): void;
}

export interface IronvestConstructor {
  new (config: {
    cid: string;
    csid: string;
    uid: string;
    baseURL: string;
    debug: boolean;
  }): IronvestInstance;
}

declare global {
  interface Window {
    Ironvest: IronvestConstructor;
  }
}
