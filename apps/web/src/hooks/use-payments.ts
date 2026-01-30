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

type InvoiceItem = {
  id: string;
  invoice_number: string;
  status: "issued" | "paid" | "cancelled";
  total_amount: number;
  created_at: string;
};

type InvoiceListResponse = {
  items: InvoiceItem[];
  total: number;
};

// Get payment history
export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return [];

      const res = await api.get<InvoiceListResponse>("/billing/me/invoices", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50, offset: 0 },
      });

      return (res.items || []).map((inv): Payment => {
        const status: Payment["status"] =
          inv.status === "paid" ? "paid" : inv.status === "issued" ? "pending" : "failed";
        return {
          id: inv.id,
          date: inv.created_at,
          amount: inv.total_amount,
          status,
          method: "—",
          invoiceId: inv.invoice_number,
        };
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

      // Payment method management is not implemented in the current backend API.
      return [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Retry failed payment
export function useRetryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      return { paymentUrl: "" };
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
      void data;
      throw new Error("Payment methods are not available yet");
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
      void methodId;
      throw new Error("Payment methods are not available yet");
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
      void invoiceId;
      throw new Error("Invoice download is not available yet");
    },
  });
}
