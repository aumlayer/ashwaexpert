"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { getAuthToken } from "./use-auth";

export interface Payment {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  method: string;
  invoiceId: string;
  invoiceUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: "upi" | "card" | "netbanking";
  name: string;
  isDefault: boolean;
  lastFour?: string;
}

// Get payment history
export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return [];

      return api.get<Payment[]>("/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get payment methods
export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return [];

      return api.get<PaymentMethod[]>("/payments/methods", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Retry failed payment
export function useRetryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const token = getAuthToken();
      return api.post<{ paymentUrl: string }>(`/payments/${paymentId}/retry`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

// Add payment method
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { type: string; token: string }) => {
      const token = getAuthToken();
      return api.post<PaymentMethod>("/payments/methods", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

// Set default payment method
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (methodId: string) => {
      const token = getAuthToken();
      return api.post(`/payments/methods/${methodId}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

// Download invoice
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const token = getAuthToken();
      const response = await api.get<{ url: string }>(`/payments/invoices/${invoiceId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Open invoice URL in new tab
      if (response.url) {
        window.open(response.url, "_blank");
      }
      return response;
    },
  });
}
