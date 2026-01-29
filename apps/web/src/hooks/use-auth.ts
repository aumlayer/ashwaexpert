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
      return api.post<SendOTPResponse>("/auth/otp/send", data);
    },
  });
}

// Verify OTP hook
export function useVerifyOTP() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: VerifyOTPRequest) => {
      return api.post<VerifyOTPResponse>("/auth/otp/verify", data);
    },
    onSuccess: (response) => {
      if (response.success && response.session) {
        setAuthTokens(response.session.accessToken, response.session.refreshToken);
        queryClient.setQueryData(["user"], response.session.user);
        
        if (response.isNewUser) {
          router.push("/signup/complete");
        } else {
          router.push("/app");
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
      
      return api.get<User>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
