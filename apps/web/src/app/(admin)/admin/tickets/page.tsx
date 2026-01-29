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
import { Button, Skeleton } from "@/components/ui";
import { useAdminTickets } from "@/hooks/use-admin";

// Mock data
const tickets = [
  {
    id: "TKT-001",
    customer: { name: "Priya Sharma", phone: "9876543210" },
    category: "repair",
    title: "Water flow issue",
    status: "open",
    priority: "high",
    assignee: "Rajesh T.",
    createdAt: "2024-01-28T10:30:00",
    slaBreaching: true,
  },
  {
    id: "TKT-002",
    customer: { name: "Anita Patel", phone: "7654321098" },
    category: "maintenance",
    title: "Quarterly maintenance",
    status: "assigned",
    priority: "medium",
    assignee: "Suresh K.",
    createdAt: "2024-01-27T14:00:00",
    slaBreaching: false,
  },
  {
    id: "TKT-003",
    customer: { name: "Vikram Singh", phone: "6543210987" },
    category: "complaint",
    title: "Taste issue after filter change",
    status: "in_progress",
    priority: "high",
    assignee: "Amit P.",
    createdAt: "2024-01-27T09:15:00",
    slaBreaching: true,
  },
  {
    id: "TKT-004",
    customer: { name: "Meera Krishnan", phone: "5432109876" },
    category: "relocation",
    title: "Relocation request",
    status: "resolved",
    priority: "low",
    assignee: "Rajesh T.",
    createdAt: "2024-01-26T16:45:00",
    slaBreaching: false,
  },
  {
    id: "TKT-005",
    customer: { name: "Rajesh Kumar", phone: "8765432109" },
    category: "repair",
    title: "Leakage from tank",
    status: "closed",
    priority: "urgent",
    assignee: "Suresh K.",
    createdAt: "2024-01-25T11:00:00",
    slaBreaching: false,
  },
];

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

  const ticketsForUi = (ticketsQuery.data?.data && ticketsQuery.data.data.length > 0
    ? ticketsQuery.data.data.map((t) => ({
        id: t.id,
        customer: { name: t.customerName, phone: t.customerPhone },
        category: t.category,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assigneeName || "-",
        createdAt: t.createdAt,
        slaBreaching: t.slaBreaching,
      }))
    : tickets) as any[];

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
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Ticket</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Customer</th>
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
                const status = statusConfig[ticket.status];
                const priority = priorityConfig[ticket.priority];
                return (
                  <tr key={ticket.id} className={`border-b border-[#334155] hover:bg-[#334155]/50 ${ticket.slaBreaching ? "bg-red-500/5" : ""}`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {ticket.slaBreaching && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <span className="text-small font-mono text-primary">{ticket.id}</span>
                          <p className="text-caption text-gray-300 mt-0.5">{ticket.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-body font-medium">{ticket.customer.name}</p>
                      <p className="text-caption text-gray-400">{ticket.customer.phone}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-400" />
                        <span className="text-small capitalize">{ticket.category}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${priority.bg} ${priority.color}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${status.bg} ${status.color}`}>
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
            Showing {filteredTickets.length} of {ticketsForUi.length} tickets
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
    </div>
  );
}
