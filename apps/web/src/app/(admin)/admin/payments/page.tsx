"use client";

import { useState } from "react";
import {
  Search,
  MoreVertical,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { useAdminPayments } from "@/hooks/use-admin";

// Mock data
const payments = [
  {
    id: "PAY-001",
    customer: { name: "Priya Sharma", phone: "9876543210" },
    subscriptionId: "SUB-001",
    amount: 549,
    status: "success",
    method: "UPI",
    date: "2024-01-28T10:30:00",
    invoiceId: "INV-2024-001",
  },
  {
    id: "PAY-002",
    customer: { name: "Rajesh Kumar", phone: "8765432109" },
    subscriptionId: "SUB-002",
    amount: 749,
    status: "success",
    method: "Card",
    date: "2024-01-28T09:15:00",
    invoiceId: "INV-2024-002",
  },
  {
    id: "PAY-003",
    customer: { name: "Anita Patel", phone: "7654321098" },
    subscriptionId: "SUB-003",
    amount: 399,
    status: "failed",
    method: "UPI",
    date: "2024-01-27T16:45:00",
    invoiceId: null,
  },
  {
    id: "PAY-004",
    customer: { name: "Vikram Singh", phone: "6543210987" },
    subscriptionId: "SUB-004",
    amount: 549,
    status: "pending",
    method: "Net Banking",
    date: "2024-01-27T14:20:00",
    invoiceId: null,
  },
  {
    id: "PAY-005",
    customer: { name: "Meera Krishnan", phone: "5432109876" },
    subscriptionId: "SUB-005",
    amount: 649,
    status: "refunded",
    method: "Card",
    date: "2024-01-26T11:00:00",
    invoiceId: "INV-2024-003",
  },
];

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20" },
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
  refunded: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/20" },
};

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const paymentsQuery = useAdminPayments({ status: statusFilter === "all" ? undefined : statusFilter, page: 1 });

  const paymentsForUi = (paymentsQuery.data?.data && paymentsQuery.data.data.length > 0
    ? paymentsQuery.data.data.map((p) => ({
        id: p.id,
        customer: { name: p.customerName, phone: "" },
        subscriptionId: p.subscriptionId,
        amount: p.amount,
        status: p.status,
        method: p.method,
        date: p.date,
        invoiceId: p.invoiceId ?? null,
      }))
    : payments) as any[];

  const filteredPayments = paymentsForUi.filter((payment) => {
    const matchesSearch =
      payment.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = paymentsForUi
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  const failedAmount = paymentsForUi
    .filter((p) => p.status === "failed")
    .reduce((sum, p) => sum + p.amount, 0);

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
          {paymentsQuery.isLoading ? (
            <Skeleton className="h-7 w-28 mt-2 bg-white/10" />
          ) : (
            <p className="text-h3 font-heading font-bold text-green-400 mt-2">₹{totalRevenue.toLocaleString()}</p>
          )}
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="text-small text-gray-400">Successful</p>
          </div>
          <p className="text-h3 font-heading font-bold text-white mt-2">
            {paymentsForUi.filter((p) => p.status === "success").length}
          </p>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="text-small text-gray-400">Failed</p>
          </div>
          <p className="text-h3 font-heading font-bold text-red-400 mt-2">
            {paymentsForUi.filter((p) => p.status === "failed").length}
          </p>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-small text-gray-400">Success Rate</p>
          </div>
          <p className="text-h3 font-heading font-bold text-white mt-2">
            {Math.round((paymentsForUi.filter((p) => p.status === "success").length / paymentsForUi.length) * 100)}%
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
          {["all", "success", "pending", "failed", "refunded"].map((status) => (
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
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Payment ID</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Customer</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Method</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Invoice</th>
                <th className="text-right py-3 px-4 text-small font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const status = statusConfig[payment.status];
                return (
                  <tr key={payment.id} className="border-b border-[#334155] hover:bg-[#334155]/50">
                    <td className="py-4 px-4">
                      <span className="text-small font-mono text-primary">{payment.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-body font-medium">{payment.customer.name}</p>
                      <p className="text-caption text-gray-400">{payment.subscriptionId}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-body font-semibold">₹{payment.amount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-small">{payment.method}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${status.bg}`}>
                        <status.icon className={`h-3 w-3 ${status.color}`} />
                        <span className={`text-caption font-medium ${status.color}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-small text-gray-300">
                        <Calendar className="h-3 w-3" />
                        {new Date(payment.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {payment.invoiceId ? (
                        <button className="text-small text-primary hover:underline">
                          {payment.invoiceId}
                        </button>
                      ) : (
                        <span className="text-small text-gray-500">-</span>
                      )}
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
            Showing {filteredPayments.length} of {payments.length} payments
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
