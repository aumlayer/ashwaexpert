"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { getAuthToken } from "./use-auth";
import type { Subscription, Plan } from "@/types/api";

// Get current subscription
export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;

      return api.get<Subscription>("/subscriptions/current", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Upgrade subscription
export function useUpgradeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { planId: string; tenureMonths?: number }) => {
      const token = getAuthToken();
      return api.post<Subscription>("/subscriptions/upgrade", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

// Cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { reason: string }) => {
      const token = getAuthToken();
      return api.post("/subscriptions/cancel", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

// Request relocation
export function useRequestRelocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      newAddress: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
      };
      preferredDate: string;
    }) => {
      const token = getAuthToken();
      return api.post("/subscriptions/relocation", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
