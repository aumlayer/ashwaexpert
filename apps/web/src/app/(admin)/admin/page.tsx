"use client";

import Link from "next/link";
import {
  Users,
  CreditCard,
  Droplets,
  Wrench,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Activity,
} from "lucide-react";
import { Skeleton } from "@/components/ui";
import { useAdminPayments, useAdminTickets, useDashboardStats, useLeads } from "@/hooks/use-admin";

// Mock data - will be replaced with API
const stats = [
  {
    name: "Active Subscriptions",
    value: "2,847",
    change: "+12%",
    trend: "up",
    icon: Droplets,
    color: "bg-blue-500",
  },
  {
    name: "Monthly Revenue",
    value: "₹15.6L",
    change: "+8%",
    trend: "up",
    icon: DollarSign,
    color: "bg-green-500",
  },
  {
    name: "New Leads",
    value: "342",
    change: "+23%",
    trend: "up",
    icon: Users,
    color: "bg-purple-500",
  },
  {
    name: "Open Tickets",
    value: "28",
    change: "-5%",
    trend: "down",
    icon: Wrench,
    color: "bg-orange-500",
  },
];

const recentLeads = [
  { id: "1", name: "Priya Sharma", phone: "98765xxxxx", city: "Bangalore", status: "new", time: "2 min ago" },
  { id: "2", name: "Rajesh Kumar", phone: "87654xxxxx", city: "Hyderabad", status: "contacted", time: "15 min ago" },
  { id: "3", name: "Anita Patel", phone: "76543xxxxx", city: "Mumbai", status: "new", time: "1 hour ago" },
  { id: "4", name: "Vikram Singh", phone: "65432xxxxx", city: "Delhi", status: "scheduled", time: "2 hours ago" },
];

const pendingActions = [
  { type: "payment", count: 12, label: "Failed payments need retry", severity: "high" },
  { type: "ticket", count: 5, label: "Tickets breaching SLA", severity: "high" },
  { type: "subscription", count: 8, label: "Subscriptions pending activation", severity: "medium" },
  { type: "lead", count: 23, label: "Leads awaiting follow-up", severity: "low" },
];

const recentPayments = [
  { id: "1", customer: "Priya S.", amount: 549, status: "success", time: "Just now" },
  { id: "2", customer: "Rajesh K.", amount: 749, status: "success", time: "5 min ago" },
  { id: "3", customer: "Anita P.", amount: 399, status: "failed", time: "10 min ago" },
  { id: "4", customer: "Vikram S.", amount: 549, status: "success", time: "15 min ago" },
];

const topCities = [
  { name: "Bangalore", subscriptions: 892, percentage: 31 },
  { name: "Hyderabad", subscriptions: 654, percentage: 23 },
  { name: "Mumbai", subscriptions: 521, percentage: 18 },
  { name: "Chennai", subscriptions: 412, percentage: 14 },
  { name: "Delhi NCR", subscriptions: 368, percentage: 13 },
];

export default function AdminDashboard() {
  const statsQuery = useDashboardStats();
  const leadsQuery = useLeads({ page: 1, limit: 5 });
  const paymentsQuery = useAdminPayments({ page: 1 });
  const ticketsQuery = useAdminTickets({ page: 1, status: "open" });

  const dashboard = statsQuery.data;

  const leadsForUi = leadsQuery.data?.data?.slice(0, 4).map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone ? `${l.phone.slice(0, 5)}xxxxx` : "",
    city: l.city,
    status: l.status,
    time: "",
  })) || recentLeads;

  const paymentsForUi = paymentsQuery.data?.data?.slice(0, 4).map((p) => ({
    id: p.id,
    customer: p.customerName ? `${p.customerName.split(" ")[0]} ${p.customerName.split(" ")[1]?.charAt(0) || ""}.` : "Customer",
    amount: p.amount,
    status: p.status,
    time: "",
  })) || recentPayments;

  const derivedStats = dashboard
    ? [
        {
          name: "Active Subscriptions",
          value: dashboard.activeSubscriptions.toLocaleString(),
          change: `${dashboard.subscriptionGrowth >= 0 ? "+" : ""}${dashboard.subscriptionGrowth}%`,
          trend: dashboard.subscriptionGrowth >= 0 ? "up" : "down",
          icon: Droplets,
          color: "bg-blue-500",
        },
        {
          name: "Monthly Revenue",
          value: `₹${(dashboard.monthlyRevenue / 100000).toFixed(1)}L`,
          change: `${dashboard.revenueGrowth >= 0 ? "+" : ""}${dashboard.revenueGrowth}%`,
          trend: dashboard.revenueGrowth >= 0 ? "up" : "down",
          icon: DollarSign,
          color: "bg-green-500",
        },
        {
          name: "New Leads",
          value: dashboard.newLeads.toLocaleString(),
          change: `${dashboard.leadGrowth >= 0 ? "+" : ""}${dashboard.leadGrowth}%`,
          trend: dashboard.leadGrowth >= 0 ? "up" : "down",
          icon: Users,
          color: "bg-purple-500",
        },
        {
          name: "Open Tickets",
          value: dashboard.openTickets.toLocaleString(),
          change: `${dashboard.ticketChange >= 0 ? "+" : ""}${dashboard.ticketChange}%`,
          trend: dashboard.ticketChange >= 0 ? "up" : "down",
          icon: Wrench,
          color: "bg-orange-500",
        },
      ]
    : stats;

  const pendingActionsForUi = dashboard
    ? [
        {
          type: "payment",
          count: paymentsQuery.data?.data?.filter((p) => p.status === "failed").length ?? 0,
          label: "Failed payments need retry",
          severity: "high",
        },
        {
          type: "ticket",
          count: ticketsQuery.data?.data?.filter((t) => t.slaBreaching).length ?? 0,
          label: "Tickets breaching SLA",
          severity: "high",
        },
        { type: "subscription", count: 0, label: "Subscriptions pending activation", severity: "medium" },
        { type: "lead", count: leadsQuery.data?.total ?? 0, label: "Leads awaiting follow-up", severity: "low" },
      ]
    : pendingActions;

  const hasHighSeverity = pendingActionsForUi.some((a) => a.severity === "high" && a.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Dashboard</h1>
          <p className="text-body text-gray-400">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-small text-white">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {derivedStats.map((stat) => (
          <div
            key={stat.name}
            className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-small text-gray-400">{stat.name}</p>
                {statsQuery.isLoading ? (
                  <Skeleton className="h-8 w-28 mt-2 bg-white/10" />
                ) : (
                  <p className="text-h2 font-heading font-bold mt-1">{stat.value}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={`text-small font-medium ${
                      stat.trend === "up" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-caption text-gray-500">vs last month</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Actions */}
      {hasHighSeverity && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-body font-medium text-red-400">Attention Required</p>
              <div className="mt-2 flex flex-wrap gap-4">
                {pendingActionsForUi
                  .filter((a) => a.severity === "high")
                  .map((action) => (
                    <span key={action.type} className="text-small text-red-300">
                      • {action.count} {action.label}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
          <div className="flex items-center justify-between p-4 border-b border-[#334155]">
            <h2 className="text-h4 font-heading font-bold">Recent Leads</h2>
            <Link
              href="/admin/leads"
              className="text-small text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-[#334155]">
            {leadsForUi.map((lead) => (
              <div key={lead.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center">
                    <span className="text-small font-medium">{lead.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-body font-medium">{lead.name}</p>
                    <p className="text-small text-gray-400">{lead.city} • {lead.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${
                      lead.status === "new"
                        ? "bg-blue-500/20 text-blue-400"
                        : lead.status === "contacted"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {lead.status}
                  </span>
                  <p className="text-caption text-gray-500 mt-1">{lead.time || " "}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
          <div className="flex items-center justify-between p-4 border-b border-[#334155]">
            <h2 className="text-h4 font-heading font-bold">Recent Payments</h2>
            <Link
              href="/admin/payments"
              className="text-small text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-[#334155]">
            {paymentsForUi.map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payment.status === "success" ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                  >
                    {payment.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-body font-medium">{payment.customer}</p>
                    <p className="text-small text-gray-400">{payment.time || " "}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-body font-semibold">₹{payment.amount}</p>
                  <p
                    className={`text-caption ${
                      payment.status === "success" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Cities */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
        <div className="p-4 border-b border-[#334155]">
          <h2 className="text-h4 font-heading font-bold">Top Cities by Subscriptions</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {topCities.map((city) => (
              <div key={city.name} className="flex items-center gap-4">
                <div className="w-24 text-body font-medium">{city.name}</div>
                <div className="flex-1">
                  <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${city.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-body font-medium">{city.subscriptions}</span>
                  <span className="text-small text-gray-400 ml-1">({city.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Add Lead", href: "/admin/leads/new", icon: Users },
          { label: "Create Plan", href: "/admin/plans/new", icon: CreditCard },
          { label: "View Tickets", href: "/admin/tickets", icon: Wrench },
          { label: "Run Report", href: "/admin/reports", icon: Activity },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-4 bg-[#1E293B] rounded-xl border border-[#334155] hover:border-primary transition-colors"
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-body font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
