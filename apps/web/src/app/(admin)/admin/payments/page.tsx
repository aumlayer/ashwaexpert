"use client";

import { useState } from "react";
import {
  Search,
  MoreVertical,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { useAdminInvoices } from "@/hooks/use-admin";

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const invoicesQuery = useAdminInvoices({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
  });

  const invoicesForUi = invoicesQuery.data?.items ?? [];

  const filteredInvoices = invoicesForUi.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoicesForUi
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + (Number.isFinite(i.total_amount) ? i.total_amount : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Payments</h1>
          <p className="text-body text-gray-400">
            Track and manage all payment transactions
          </p>
        </div>
        <Button variant="outline" className="border-[#334155] text-gray-300 hover:bg-[#334155]">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <p className="text-small text-gray-400">Total Revenue</p>
          </div>
          {invoicesQuery.isLoading ? (
            <Skeleton className="h-7 w-28 mt-2 bg-white/10" />
          ) : (
            <p className="text-h3 font-heading font-bold text-green-400 mt-2">₹{totalRevenue.toLocaleString()}</p>
          )}
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="text-small text-gray-400">Paid</p>
          </div>
          <p className="text-h3 font-heading font-bold text-white mt-2">
            {invoicesForUi.filter((i) => i.status === "paid").length}
          </p>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="text-small text-gray-400">Overdue</p>
          </div>
          <p className="text-h3 font-heading font-bold text-red-400 mt-2">
            {invoicesForUi.filter((i) => i.status === "overdue").length}
          </p>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-small text-gray-400">Paid Rate</p>
          </div>
          <p className="text-h3 font-heading font-bold text-white mt-2">
            {invoicesForUi.length > 0
              ? Math.round((invoicesForUi.filter((i) => i.status === "paid").length / invoicesForUi.length) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#1E293B] rounded-lg border border-[#334155]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or payment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-small text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2">
          {["all", "paid", "issued", "overdue", "draft", "cancelled"].map((status) => (
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
      {invoicesQuery.isLoading ? (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <div className="p-4">
            <Skeleton className="h-6 w-48 bg-white/10" />
            <Skeleton className="h-6 w-80 bg-white/10 mt-3" />
            <Skeleton className="h-6 w-72 bg-white/10 mt-3" />
          </div>
        </div>
      ) : invoicesQuery.isError ? (
        <EmptyState
          title="Unable to load invoices"
          message="Please try again. If the issue persists, contact support."
          primaryCta={{ label: "Retry", onClick: () => invoicesQuery.refetch() }}
        />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          message="No invoices match your filters."
        />
      ) : (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Invoice</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Total</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Created</th>
                  <th className="text-right py-3 px-4 text-small font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#334155] hover:bg-[#334155]/50">
                    <td className="py-4 px-4">
                      <p className="text-small font-mono text-primary">{inv.invoice_number}</p>
                      <p className="text-caption text-gray-400 mt-0.5">{inv.id}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-small font-mono text-gray-300">{inv.user_id}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-body font-semibold">₹{inv.total_amount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-small text-gray-300">{inv.status}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-small text-gray-300">
                        <Calendar className="h-3 w-3" />
                        {new Date(inv.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="p-2 hover:bg-[#334155] rounded-lg">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-[#334155]">
            <p className="text-small text-gray-400">
              Showing {filteredInvoices.length} of {invoicesQuery.data?.total ?? invoicesForUi.length} invoices
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
