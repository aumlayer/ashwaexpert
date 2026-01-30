// Auth Types for Ashva Experts

export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: "admin" | "subscriber" | "technician" | "cms_user";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Request/Response types
export interface SendOTPRequest {
  identifier: string;
  type: "login" | "signup" | "reset";
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresIn: number; // seconds until OTP expires
  retryAfter?: number; // seconds until can resend
}

export interface VerifyOTPRequest {
  identifier: string;
  otp: string;
  type: "login" | "signup";
}

export interface VerifyOTPResponse {
  success: boolean;
  session?: AuthSession;
  isNewUser?: boolean;
  message?: string;
}

export interface SignupRequest {
  phone: string;
  otp: string;
  name: string;
  email?: string;
}

export interface SignupResponse {
  success: boolean;
  session?: AuthSession;
  message?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresAt: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

// Auth state for context
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_RESET_ERROR" };
