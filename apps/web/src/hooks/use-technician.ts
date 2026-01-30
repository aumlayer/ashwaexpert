"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { getAuthToken } from "./use-auth";

export type AssignmentStatus = "assigned" | "accepted" | "rejected" | "unassigned" | "completed" | "in_progress";

export interface TechnicianAssignment {
  id: string;
  ticket_id: string;
  subscriber_id: string;
  technician_id: string;
  status: AssignmentStatus;
  assigned_by_user_id: string;
  notes?: string | null;
  assigned_at: string;
  updated_at: string;
}

type AssignmentListResponse = {
  items: TechnicianAssignment[];
  total: number;
};

export function useTechnicianAssignments(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ["tech", "assignments", params],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return { items: [], total: 0 } as AssignmentListResponse;

      const page = params?.page ?? 1;
      const limit = 50;
      const offset = Math.max(0, page - 1) * limit;

      return api.get<AssignmentListResponse>("/assignments/me", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: params?.status, limit, offset },
      });
    },
    staleTime: 15 * 1000,
  });
}

export function useAcceptAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      return api.post<TechnicianAssignment>(`/assignments/${assignmentId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
  });
}

export function useRejectAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      return api.post<TechnicianAssignment>(`/assignments/${assignmentId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
  });
}
