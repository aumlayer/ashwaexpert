"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { getAuthToken } from "./use-auth";

// Types
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  customer_type?: string | null;
  service_category?: string | null;
  state?: string | null;
  city?: string | null;
  locality?: string | null;
  preferred_datetime?: string | null;
  appliance_category?: string | null;
  appliance_brand?: string | null;
  appliance_model?: string | null;
  urgency?: string | null;
  preferred_contact_method?: string | null;
  message?: string | null;
  source: string;
  status: string;
  priority: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_period: string;
  auto_renew: boolean;
  start_at: string;
  renewal_anchor_at: string;
  next_renewal_at?: string | null;
  next_renewal_override_at?: string | null;
  end_at?: string | null;
  cancel_requested_at?: string | null;
  cancel_effective_at?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminInvoice {
  id: string;
  invoice_number: string;
  user_id: string;
  order_id?: string | null;
  invoice_type: string;
  subscription_id?: string | null;
  status: string;
  base_amount: number;
  discount_amount: number;
  credit_applied_amount: number;
  paid_amount: number;
  due_amount: number;
  amount_before_gst: number;
  gst_percent: number;
  gst_amount: number;
  total_amount: number;
  due_date?: string | null;
  pdf_media_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  subscriber_id: string;
  subscription_id?: string | null;
  title: string;
  description: string;
  ticket_type: string;
  priority: string;
  status: string;
  location_address?: string | null;
  assigned_technician_id?: string | null;
  sla_due_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseStudyManageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
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
      const headers = { Authorization: `Bearer ${token}` };

      const [leads, tickets, subs, invoices] = await Promise.all([
        api.get<{ items: Lead[]; total: number; page: number; limit: number }>("/leads", {
          headers,
          params: { page: 1, limit: 50 },
        }),
        api.get<{ items: ServiceTicket[]; total: number }>("/tickets/admin", {
          headers,
          params: { limit: 50, offset: 0 },
        }),
        api.get<{ items: AdminSubscription[]; total: number }>("/subscriptions/admin/subscriptions", {
          headers,
          params: { limit: 50, offset: 0 },
        }),
        api.get<{ items: AdminInvoice[]; total: number }>("/billing/admin/invoices", {
          headers,
          params: { limit: 50, offset: 0 },
        }),
      ]);

      const activeSubscriptions = subs.items.filter((s) => s.status === "active").length;
      const newLeads = leads.items.filter((l) => l.status === "new").length;
      const openTickets = tickets.items.filter((t) =>
        ["created", "assigned", "in_progress"].includes(t.status)
      ).length;
      const revenue = invoices.items
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (Number.isFinite(i.total_amount) ? i.total_amount : 0), 0);

      const res: DashboardStats = {
        activeSubscriptions,
        monthlyRevenue: revenue,
        newLeads,
        openTickets,
        subscriptionGrowth: 0,
        revenueGrowth: 0,
        leadGrowth: 0,
        ticketChange: 0,
      };

      return res;
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
      return api.get<{ items: Lead[]; total: number; page: number; limit: number }>("/leads", {
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
    mutationFn: async (data: Omit<Lead, "id" | "created_at" | "updated_at">) => {
      const token = getAuthToken();
      return api.post<Lead>("/leads", data, {
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
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = getAuthToken();
      return api.patch<Lead>(`/leads/${id}/status`, { status }, {
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
      const page = params?.page ?? 1;
      const limit = 50;
      const offset = Math.max(0, page - 1) * limit;
      return api.get<{ items: AdminSubscription[]; total: number }>("/subscriptions/admin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: params?.status, limit, offset },
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
      return api.patch(`/subscriptions/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    },
  });
}

// Invoices (Payments module)
export function useAdminInvoices(params?: { status?: string; page?: number; userId?: string }) {
  return useQuery({
    queryKey: ["admin", "invoices", params],
    queryFn: async () => {
      const token = getAuthToken();
      const page = params?.page ?? 1;
      const limit = 50;
      const offset = Math.max(0, page - 1) * limit;
      return api.get<{ items: AdminInvoice[]; total: number }>("/billing/admin/invoices", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: params?.status, user_id: params?.userId, limit, offset },
      });
    },
    staleTime: 30 * 1000,
  });
}

// Service Tickets
export function useAdminTickets(params?: { status?: string; priority?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "tickets", params],
    queryFn: async () => {
      const token = getAuthToken();
      const page = params?.page ?? 1;
      const limit = 50;
      const offset = Math.max(0, page - 1) * limit;
      return api.get<{ items: ServiceTicket[]; total: number }>("/tickets/admin", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: params?.status, priority: params?.priority, limit, offset },
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
    mutationFn: async ({
      ticketId,
      status,
      completionNotes,
    }: {
      ticketId: string;
      status: string;
      completionNotes?: string;
    }) => {
      const token = getAuthToken();
      return api.patch(`/tickets/${ticketId}`, { status, completion_notes: completionNotes }, {
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

// Case Studies (Content)
export function useAdminCaseStudies(params?: { status?: string; page?: number; search?: string }) {
  return useQuery({
    queryKey: ["admin", "case-studies", params],
    queryFn: async () => {
      const token = getAuthToken();
      return api.get<{ items: CaseStudyManageItem[]; total: number; page: number; limit: number }>(
        "/content/manage/case-studies",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: params?.status, page: params?.page ?? 1, limit: 50, search: params?.search },
        }
      );
    },
    staleTime: 30 * 1000,
  });
}

export function usePublishCaseStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken();
      return api.post(`/content/case-studies/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "case-studies"] });
    },
  });
}

export function useUnpublishCaseStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken();
      return api.post(`/content/case-studies/${id}/unpublish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "case-studies"] });
    },
  });
}

export function useDeleteCaseStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken();
      return api.delete(`/content/case-studies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "case-studies"] });
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
