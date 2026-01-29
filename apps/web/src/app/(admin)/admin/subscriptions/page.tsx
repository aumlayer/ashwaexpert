"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Droplets,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { useAdminSubscriptions } from "@/hooks/use-admin";

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  active: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20" },
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  paused: { icon: PauseCircle, color: "text-orange-400", bg: "bg-orange-500/20" },
  cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
};

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const subsQuery = useAdminSubscriptions({ status: statusFilter === "all" ? undefined : statusFilter, page: 1 });

  const subsForUi = subsQuery.data?.items ?? [];

  const filteredSubs = subsForUi.filter((sub) => {
    const matchesSearch =
      sub.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Subscriptions</h1>
          <p className="text-body text-gray-400">
            Manage all customer subscriptions
          </p>
        </div>
        <Button variant="outline" className="border-[#334155] text-gray-300 hover:bg-[#334155]">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active", count: subsForUi.filter((s) => s.status === "active").length, color: "text-green-400", icon: CheckCircle2 },
          { label: "Pending", count: subsForUi.filter((s) => s.status === "pending").length, color: "text-yellow-400", icon: Clock },
          { label: "Paused", count: subsForUi.filter((s) => s.status === "paused").length, color: "text-orange-400", icon: PauseCircle },
          { label: "Cancelled", count: subsForUi.filter((s) => s.status === "cancelled").length, color: "text-red-400", icon: XCircle },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <p className="text-small text-gray-400">{stat.label}</p>
            </div>
            {subsQuery.isLoading ? (
              <Skeleton className="h-7 w-14 mt-2 bg-white/10" />
            ) : (
              <p className={`text-h3 font-heading font-bold mt-2 ${stat.color}`}>{stat.count}</p>
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
            placeholder="Search by name, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-small text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "pending", "paused", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-small font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-[#1E293B] text-gray-400 hover:text-white border border-[#334155]"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {subsQuery.isLoading ? (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <div className="p-4">
            <Skeleton className="h-6 w-48 bg-white/10" />
            <Skeleton className="h-6 w-80 bg-white/10 mt-3" />
            <Skeleton className="h-6 w-72 bg-white/10 mt-3" />
          </div>
        </div>
      ) : subsQuery.isError ? (
        <EmptyState
          title="Unable to load subscriptions"
          message="Please try again. If the issue persists, contact support."
          primaryCta={{ label: "Retry", onClick: () => subsQuery.refetch() }}
        />
      ) : filteredSubs.length === 0 ? (
        <EmptyState
          title="No subscriptions found"
          message="No subscriptions match your filters."
        />
      ) : (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Subscription</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Plan</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Billing</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Next Renewal</th>
                  <th className="text-right py-3 px-4 text-small font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((sub) => {
                  const status = statusConfig[sub.status] ?? statusConfig.active;
                  return (
                    <tr key={sub.id} className="border-b border-[#334155] hover:bg-[#334155]/50">
                      <td className="py-4 px-4">
                        <span className="text-small font-mono text-primary">{sub.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-small font-mono text-gray-300">{sub.user_id}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-small font-mono text-gray-300">{sub.plan_id}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${status.bg}`}>
                          <status.icon className={`h-3 w-3 ${status.color}`} />
                          <span className={`text-caption font-medium ${status.color}`}>
                            {sub.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-small text-gray-300">{sub.billing_period}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-small text-gray-300">
                          <Calendar className="h-3 w-3" />
                          {sub.next_renewal_at
                            ? new Date(sub.next_renewal_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })
                            : "-"}
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
              Showing {filteredSubs.length} of {subsQuery.data?.total ?? subsForUi.length} subscriptions
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
