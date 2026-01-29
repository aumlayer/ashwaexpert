"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { getAuthToken } from "./use-auth";
import type { ServiceTicket, InstallationSlot } from "@/types/api";

// Get service tickets
export function useServiceTickets(status?: string) {
  return useQuery({
    queryKey: ["service-tickets", status],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return [];

      return api.get<ServiceTicket[]>("/service/tickets", {
        headers: { Authorization: `Bearer ${token}` },
        params: status ? { status } : undefined,
      });
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Get single ticket
export function useServiceTicket(ticketId: string) {
  return useQuery({
    queryKey: ["service-ticket", ticketId],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;

      return api.get<ServiceTicket>(`/service/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    enabled: !!ticketId,
  });
}

// Create service ticket
export function useCreateServiceTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category: ServiceTicket["category"];
      description: string;
      preferredSlot?: InstallationSlot;
    }) => {
      const token = getAuthToken();
      return api.post<ServiceTicket>("/service/tickets", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
    },
  });
}

// Reschedule ticket
export function useRescheduleTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticketId: string; newSlot: InstallationSlot }) => {
      const token = getAuthToken();
      return api.post(`/service/tickets/${data.ticketId}/reschedule`, {
        preferredSlot: data.newSlot,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
    },
  });
}

// Cancel ticket
export function useCancelTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const token = getAuthToken();
      return api.post(`/service/tickets/${ticketId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
    },
  });
}

// Submit CSAT rating
export function useSubmitCSAT() {
  return useMutation({
    mutationFn: async (data: { ticketId: string; rating: number; feedback?: string }) => {
      const token = getAuthToken();
      return api.post(`/service/tickets/${data.ticketId}/csat`, {
        rating: data.rating,
        feedback: data.feedback,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  });
}

// Get upcoming maintenance schedule
export function useMaintenanceSchedule() {
  return useQuery({
    queryKey: ["maintenance-schedule"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;

      return api.get<{
        nextVisit: {
          date: string;
          timeSlot: string;
          type: string;
          technician?: string;
        } | null;
        history: Array<{
          date: string;
          type: string;
          technician: string;
          notes?: string;
        }>;
      }>("/service/maintenance", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
