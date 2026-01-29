"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import type {
  AvailabilityCheckRequest,
  AvailabilityCheckResponse,
  Plan,
  CreateLeadRequest,
  Lead,
  CheckoutRequest,
  CheckoutResponse,
  Testimonial,
  FAQ,
} from "@/types/api";

// ============ Availability Hooks ============
export function useCheckAvailability() {
  return useMutation({
    mutationFn: async (data: AvailabilityCheckRequest) => {
      return api.post<AvailabilityCheckResponse>("/availability/check", data);
    },
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
