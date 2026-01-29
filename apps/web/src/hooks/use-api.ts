"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import type {
  AvailabilityCheckRequest,
  AvailabilityCheckResponse,
  Addon,
  Plan,
  CreateLeadRequest,
  Lead,
  CheckoutRequest,
  CheckoutResponse,
  Testimonial,
  FAQ,
  ReferralGenerateResponse,
  SubscriberMeResponse,
  SubscriberUpdateRequest,
} from "@/types/api";
import { getAuthToken } from "@/hooks/use-auth";

// ============ Availability Hooks ============
export function useCheckAvailability() {
  return useMutation({
    mutationFn: async (data: AvailabilityCheckRequest) => {
      return api.post<AvailabilityCheckResponse>("/availability/check", data);
    },
  });
}

// ============ Referrals Hooks (Portal) ==========
export function useReferralCode() {
  return useQuery({
    queryKey: ["referral_code"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;
      return api.post<ReferralGenerateResponse>("/coupons/referrals/generate", undefined, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ============ Plans Hooks ============
export function usePlans(category?: string) {
  return useQuery({
    queryKey: ["plans", category],
    queryFn: async () => {
      return api.get<Plan[]>("/plans", { params: category ? { category } : undefined });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlan(slug: string) {
  return useQuery({
    queryKey: ["plan", slug],
    queryFn: async () => {
      return api.get<Plan>(`/plans/${slug}`);
    },
    enabled: !!slug,
  });
}

// ============ Lead Hooks ============
export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateLeadRequest) => {
      return api.post<Lead>("/leads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// ============ Checkout Hooks ============
export function useCheckout() {
  return useMutation({
    mutationFn: async (data: CheckoutRequest) => {
      return api.post<CheckoutResponse>("/checkout", data);
    },
  });
}

// ============ Add-ons Hooks (Portal) ==========
export function useAddons() {
  return useQuery({
    queryKey: ["addons"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return [];
      return api.get<Addon[]>("/addons", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAddSubscriptionAddon(subscriptionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { addonId: string }) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      if (!subscriptionId) {
        throw new Error("Missing subscription id");
      }
      return api.post(`/subscriptions/${subscriptionId}/addons`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["addons"] });
    },
  });
}

export function useRemoveSubscriptionAddon(subscriptionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { addonId: string }) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      if (!subscriptionId) {
        throw new Error("Missing subscription id");
      }
      return api.delete(`/subscriptions/${subscriptionId}/addons/${encodeURIComponent(data.addonId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["addons"] });
    },
  });
}

// ============ Testimonials Hooks ============
export function useTestimonials(city?: string) {
  return useQuery({
    queryKey: ["testimonials", city],
    queryFn: async () => {
      return api.get<Testimonial[]>("/testimonials", { params: city ? { city } : undefined });
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============ FAQ Hooks ============
export function useFAQs(category?: string) {
  return useQuery({
    queryKey: ["faqs", category],
    queryFn: async () => {
      return api.get<FAQ[]>("/faqs", { params: category ? { category } : undefined });
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ============ Subscriber Profile Hooks (Portal) ==========
export function useSubscriberMe() {
  return useQuery({
    queryKey: ["subscriber_me"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;
      return api.get<SubscriberMeResponse>("/subscribers/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUpdateSubscriberMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubscriberUpdateRequest) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      return api.put<SubscriberMeResponse>("/subscribers/me", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriber_me"] });
    },
  });
}
