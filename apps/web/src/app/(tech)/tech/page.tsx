"use client";

import { useState } from "react";
import { Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton, Badge } from "@/components/ui";
import {
  useAcceptAssignment,
  useRejectAssignment,
  useTechnicianAssignments,
  type TechnicianAssignment,
} from "@/hooks/use-technician";

const statusVariant: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" }>
  = {
    assigned: { label: "Assigned", variant: "default" },
    accepted: { label: "Accepted", variant: "success" },
    in_progress: { label: "In Progress", variant: "warning" },
    completed: { label: "Completed", variant: "success" },
    rejected: { label: "Rejected", variant: "error" },
    unassigned: { label: "Unassigned", variant: "error" },
  };

export default function TechnicianAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const assignmentsQuery = useTechnicianAssignments({ status: statusFilter, page: 1 });
  const acceptMutation = useAcceptAssignment();
  const rejectMutation = useRejectAssignment();

  const items: TechnicianAssignment[] = assignmentsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">My Assignments</h1>
          <p className="text-body text-white/70 mt-1">
            View and manage assigned service jobs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter ?? ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-3 py-2 bg-[#0F172A] border border-[#1F2937] rounded-lg text-small text-white cursor-pointer"
          >
            <option value="">Active (default)</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Card className="bg-[#0F172A] border-[#1F2937]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-h4 text-white">Assignments</CardTitle>
          <span className="text-small text-white/60">{assignmentsQuery.data?.total ?? 0} total</span>
        </CardHeader>
        <CardContent>
          {assignmentsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full bg-white/10" />
              <Skeleton className="h-16 w-full bg-white/10" />
              <Skeleton className="h-16 w-full bg-white/10" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={Briefcase}
                title="No assignments"
                message="You have no assigned jobs right now."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((a) => {
                const meta = statusVariant[a.status] || { label: a.status, variant: "default" as const };
                const canAccept = a.status === "assigned";
                const canReject = a.status === "assigned" || a.status === "accepted";

                return (
                  <div
                    key={a.id}
                    className="p-4 rounded-lg border border-[#1F2937] bg-[#0B1220]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-body font-semibold text-white">Ticket {String(a.ticket_id).slice(0, 8)}…</p>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </div>
                        <p className="text-small text-white/60 mt-1">
                          Assigned {new Date(a.assigned_at).toLocaleString("en-IN")}
                        </p>
                        {a.notes ? (
                          <p className="text-small text-white/70 mt-2">{a.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canReject || rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(a.id)}
                          className="border-[#334155] text-white hover:bg-white/5"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!canAccept || acceptMutation.isPending}
                          onClick={() => acceptMutation.mutate(a.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
