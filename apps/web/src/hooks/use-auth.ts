"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { ApiError } from "@/utils/api";
import type {
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  SignupRequest,
  SignupResponse,
  User,
  AuthSession,
} from "@/types/auth";

type BackendOtpRequestResponse = {
  message: string;
  expires_in_seconds: number;
};

type BackendTokenUser = {
  id: string;
  email?: string;
  phone?: string;
  role: string;
};

type BackendTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: BackendTokenUser;
};

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Helper to get/set tokens
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(accessToken)}; path=/`;
  document.cookie = `${REFRESH_TOKEN_KEY}=${encodeURIComponent(refreshToken)}; path=/`;
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; Max-Age=0; path=/`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; Max-Age=0; path=/`;
}

// Send OTP hook
export function useSendOTP() {
  return useMutation({
    mutationFn: async (data: SendOTPRequest) => {
      const purpose = data.type === "signup" ? "registration" : "login";
      const identifier = data.identifier;

      const res = await api.post<BackendOtpRequestResponse>("/auth/otp/request", {
        identifier,
        purpose,
      });

      const mapped: SendOTPResponse = {
        success: true,
        message: res.message,
        expiresIn: res.expires_in_seconds,
      };

      return mapped;
    },
  });
}

// Verify OTP hook
export function useVerifyOTP() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: VerifyOTPRequest) => {
      const purpose = data.type === "signup" ? "registration" : "login";
      const identifier = data.identifier;

      const res = await api.post<BackendTokenResponse>("/auth/otp/verify", {
        identifier,
        otp_code: data.otp,
        purpose,
      });

      const session: AuthSession = {
        user: {
          id: res.user.id,
          phone: res.user.phone || identifier,
          email: res.user.email,
          name: undefined,
          role: (res.user.role as User["role"]) || "subscriber",
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        expiresAt: new Date(Date.now() + res.expires_in * 1000).toISOString(),
      };

      const mapped: VerifyOTPResponse = {
        success: true,
        session,
        isNewUser: data.type === "signup",
      };

      return mapped;
    },
    onSuccess: (response) => {
      if (response.success && response.session) {
        setAuthTokens(response.session.accessToken, response.session.refreshToken);
        queryClient.setQueryData(["user"], response.session.user);
        
        if (response.isNewUser) {
          router.push("/signup/complete");
        } else {
          const role = response.session.user.role;
          router.push(role === "admin" ? "/admin" : role === "technician" ? "/tech" : "/app");
        }
      }
    },
  });
}

// Signup hook
export function useSignup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      return api.post<SignupResponse>("/auth/signup", data);
    },
    onSuccess: (response) => {
      if (response.success && response.session) {
        setAuthTokens(response.session.accessToken, response.session.refreshToken);
        queryClient.setQueryData(["user"], response.session.user);
        router.push("/app");
      }
    },
  });
}

// Get current user hook
export function useCurrentUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;

      // Backend /api/v1/auth/me returns: { id, email, phone, role, is_active, is_verified, ... }
      const me = await api.get<{ id: string; email?: string; phone?: string; role: string; is_verified?: boolean }>(
        "/auth/me",
        {
        headers: { Authorization: `Bearer ${token}` },
        }
      );

      const mapped: User = {
        id: me.id,
        phone: me.phone || "",
        email: me.email,
        name: undefined,
        role: (me.role as User["role"]) || "subscriber",
        isVerified: Boolean(me.is_verified),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return mapped;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

// Logout hook
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      if (token) {
        try {
          await api.post("/auth/logout", {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // Ignore logout API errors
        }
      }
      return true;
    },
    onSuccess: () => {
      clearAuthTokens();
      queryClient.clear();
      router.push("/login");
    },
  });
}

// Auth context hook for checking auth state
export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser();
  const logout = useLogout();

  const errorStatus = error instanceof ApiError ? error.status : null;

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error: error?.message || null,
    errorStatus,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}
