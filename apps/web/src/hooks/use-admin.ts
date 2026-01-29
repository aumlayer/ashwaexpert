"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { getAuthToken } from "./use-auth";

// Types
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  pincode: string;
  source: string;
  status: "new" | "contacted" | "scheduled" | "converted" | "lost";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscription {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  planId: string;
  planName: string;
  amount: number;
  status: "pending" | "active" | "paused" | "cancelled";
  startDate: string;
  nextBillingDate?: string;
  deviceSerial?: string;
  city: string;
}

export interface AdminPayment {
  id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: "success" | "pending" | "failed" | "refunded";
  method: string;
  date: string;
  invoiceId?: string;
}

export interface ServiceTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  subscriptionId: string;
  category: "maintenance" | "repair" | "complaint" | "relocation";
  title: string;
  description: string;
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  resolvedAt?: string;
  slaBreaching: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export interface DashboardStats {
  activeSubscriptions: number;
  monthlyRevenue: number;
  newLeads: number;
  openTickets: number;
  subscriptionGrowth: number;
  revenueGrowth: number;
  leadGrowth: number;
  ticketChange: number;
}

// Dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<DashboardStats>("/admin/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    staleTime: 60 * 1000,
  });
}

// Leads
export function useLeads(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "leads", params],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<{ data: Lead[]; total: number }>("/admin/leads", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {
      const token = getAuthToken();
      return api.post<Lead>("/admin/leads", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Lead> & { id: string }) => {
      const token = getAuthToken();
      return api.patch<Lead>(`/admin/leads/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
    },
  });
}

// Subscriptions
export function useAdminSubscriptions(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "subscriptions", params],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<{ data: AdminSubscription[]; total: number }>("/admin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    },
    staleTime: 30 * 1000,
  });
}

export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = getAuthToken();
      return api.patch(`/admin/subscriptions/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    },
  });
}

// Payments
export function useAdminPayments(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "payments", params],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<{ data: AdminPayment[]; total: number }>("/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    },
    staleTime: 30 * 1000,
  });
}

export function useRetryAdminPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const token = getAuthToken();
      return api.post(`/admin/payments/${paymentId}/retry`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const token = getAuthToken();
      return api.post(`/admin/payments/${paymentId}/refund`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
  });
}

// Service Tickets
export function useAdminTickets(params?: { status?: string; priority?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "tickets", params],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<{ data: ServiceTicket[]; total: number }>("/admin/tickets", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    },
    staleTime: 30 * 1000,
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) => {
      const token = getAuthToken();
      return api.post(`/admin/tickets/${ticketId}/assign`, { assigneeId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, status, resolution }: { ticketId: string; status: string; resolution?: string }) => {
      const token = getAuthToken();
      return api.patch(`/admin/tickets/${ticketId}/status`, { status, resolution }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
  });
}

// Inventory
export function useInventory(params?: { category?: string; status?: string }) {
  return useQuery({
    queryKey: ["admin", "inventory", params],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<{ data: InventoryItem[]; total: number }>("/admin/inventory", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const token = getAuthToken();
      return api.patch(`/admin/inventory/${id}`, { stock }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}

// Reports
export function useRevenueReport(params: { startDate: string; endDate: string; groupBy?: string }) {
  return useQuery({
    queryKey: ["admin", "reports", "revenue", params],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<{
        total: number;
        byCity: { city: string; revenue: number }[];
        byPlan: { plan: string; revenue: number }[];
        trend: { date: string; revenue: number }[];
      }>("/admin/reports/revenue", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscriptionReport(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["admin", "reports", "subscriptions", params],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<{
        newSubscriptions: number;
        cancellations: number;
        churnRate: number;
        byPlan: { plan: string; count: number }[];
        trend: { date: string; new: number; cancelled: number }[];
      }>("/admin/reports/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
