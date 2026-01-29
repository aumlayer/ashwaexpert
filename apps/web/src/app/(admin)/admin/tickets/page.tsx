"use client";

import { useState } from "react";
import {
  Search,
  MoreVertical,
  Wrench,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Filter,
} from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { useAdminTickets } from "@/hooks/use-admin";

const statusConfig: Record<string, { color: string; bg: string }> = {
  open: { color: "text-blue-400", bg: "bg-blue-500/20" },
  assigned: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  in_progress: { color: "text-purple-400", bg: "bg-purple-500/20" },
  resolved: { color: "text-green-400", bg: "bg-green-500/20" },
  closed: { color: "text-gray-400", bg: "bg-gray-500/20" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: "text-gray-400", bg: "bg-gray-500/20" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  high: { color: "text-orange-400", bg: "bg-orange-500/20" },
  urgent: { color: "text-red-400", bg: "bg-red-500/20" },
};

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const ticketsQuery = useAdminTickets({ status: statusFilter === "all" ? undefined : statusFilter, page: 1 });

  const ticketsForUi = (ticketsQuery.data?.items ?? []).map((t) => {
    const now = Date.now();
    const slaBreaching =
      !!t.sla_due_at &&
      new Date(t.sla_due_at).getTime() < now &&
      !["closed", "completed", "cancelled"].includes(t.status);

    const uiStatus =
      t.status === "created"
        ? "open"
        : t.status === "completed"
        ? "resolved"
        : t.status;

    return {
      id: t.ticket_number || t.id,
      customer: { name: t.subscriber_id, phone: "" },
      category: t.ticket_type,
      title: t.title,
      status: uiStatus,
      priority: t.priority,
      assignee: t.assigned_technician_id || "-",
      createdAt: t.created_at,
      slaBreaching,
    };
  });

  const filteredTickets = ticketsForUi.filter((ticket) => {
    const matchesSearch =
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const slaBreachingCount = ticketsForUi.filter((t) => t.slaBreaching).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Service Tickets</h1>
          <p className="text-body text-gray-400">
            Manage and track service requests
          </p>
        </div>
      </div>

      {/* SLA Warning */}
      {slaBreachingCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-body font-medium text-red-400">
                {slaBreachingCount} tickets breaching SLA
              </p>
              <p className="text-small text-red-300">
                These tickets need immediate attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Open", count: ticketsForUi.filter((t) => t.status === "open").length, color: "text-blue-400" },
          { label: "Assigned", count: ticketsForUi.filter((t) => t.status === "assigned").length, color: "text-yellow-400" },
          { label: "In Progress", count: ticketsForUi.filter((t) => t.status === "in_progress").length, color: "text-purple-400" },
          { label: "Resolved", count: ticketsForUi.filter((t) => t.status === "resolved").length, color: "text-green-400" },
          { label: "Closed", count: ticketsForUi.filter((t) => t.status === "closed").length, color: "text-gray-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
            <p className="text-small text-gray-400">{stat.label}</p>
            {ticketsQuery.isLoading ? (
              <Skeleton className="h-7 w-14 mt-2 bg-white/10" />
            ) : (
              <p className={`text-h3 font-heading font-bold ${stat.color}`}>{stat.count}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#1E293B] rounded-lg border border-[#334155]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-small text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {["all", "open", "assigned", "in_progress", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-small font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-[#1E293B] text-gray-400 hover:text-white border border-[#334155]"
              }`}
            >
              {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {ticketsQuery.isLoading ? (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <div className="p-4">
            <Skeleton className="h-6 w-48 bg-white/10" />
            <Skeleton className="h-6 w-80 bg-white/10 mt-3" />
            <Skeleton className="h-6 w-72 bg-white/10 mt-3" />
          </div>
        </div>
      ) : ticketsQuery.isError ? (
        <EmptyState
          title="Unable to load tickets"
          message="Please try again. If the issue persists, contact support."
          primaryCta={{ label: "Retry", onClick: () => ticketsQuery.refetch() }}
        />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          title="No tickets found"
          message="No tickets match your filters."
        />
      ) : (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Ticket</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Subscriber</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Category</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Priority</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Assignee</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Created</th>
                  <th className="text-right py-3 px-4 text-small font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const status = statusConfig[ticket.status] ?? statusConfig.open;
                  const priority = priorityConfig[ticket.priority] ?? priorityConfig.medium;
                  return (
                    <tr
                      key={ticket.id}
                      className={`border-b border-[#334155] hover:bg-[#334155]/50 ${
                        ticket.slaBreaching ? "bg-red-500/5" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {ticket.slaBreaching ? <AlertTriangle className="h-4 w-4 text-red-500" /> : null}
                          <div>
                            <span className="text-small font-mono text-primary">{ticket.id}</span>
                            <p className="text-caption text-gray-300 mt-0.5">{ticket.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-small font-mono text-gray-300">{ticket.customer.name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          <span className="text-small capitalize">{ticket.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${priority.bg} ${priority.color}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${status.bg} ${status.color}`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-small">{ticket.assignee}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-small text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="p-2 hover:bg-[#334155] rounded-lg">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-[#334155]">
            <p className="text-small text-gray-400">
              Showing {filteredTickets.length} of {ticketsQuery.data?.total ?? ticketsForUi.length} tickets
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-[#334155] text-gray-400 hover:text-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-small text-white">1</span>
              <button className="p-2 rounded-lg bg-[#334155] text-gray-400 hover:text-white">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
