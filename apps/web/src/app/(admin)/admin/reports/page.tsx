"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  Users,
  Droplets,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useRevenueReport, useSubscriptionReport } from "@/hooks/use-admin";

// Mock data
const kpis = [
  {
    name: "Monthly Revenue",
    value: "₹15.6L",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
    color: "text-green-400",
  },
  {
    name: "New Subscriptions",
    value: "234",
    change: "+18%",
    trend: "up",
    icon: Droplets,
    color: "text-blue-400",
  },
  {
    name: "Churn Rate",
    value: "2.3%",
    change: "-0.5%",
    trend: "down",
    icon: TrendingDown,
    color: "text-green-400",
  },
  {
    name: "Avg. Ticket Resolution",
    value: "4.2 hrs",
    change: "-15%",
    trend: "down",
    icon: Wrench,
    color: "text-green-400",
  },
];

const revenueByCity = [
  { city: "Bangalore", revenue: 520000, percentage: 33 },
  { city: "Hyderabad", revenue: 380000, percentage: 24 },
  { city: "Mumbai", revenue: 290000, percentage: 18 },
  { city: "Chennai", revenue: 220000, percentage: 14 },
  { city: "Delhi NCR", revenue: 170000, percentage: 11 },
];

const planDistribution = [
  { plan: "Basic RO", subscribers: 892, percentage: 31, color: "bg-blue-500" },
  { plan: "Advanced RO+UV", subscribers: 1456, percentage: 51, color: "bg-primary" },
  { plan: "Premium Copper+", subscribers: 345, percentage: 12, color: "bg-purple-500" },
  { plan: "Alkaline Pro", subscribers: 154, percentage: 6, color: "bg-green-500" },
];

const monthlyTrend = [
  { month: "Aug", revenue: 1120000, subscriptions: 180 },
  { month: "Sep", revenue: 1250000, subscriptions: 195 },
  { month: "Oct", revenue: 1380000, subscriptions: 210 },
  { month: "Nov", revenue: 1420000, subscriptions: 218 },
  { month: "Dec", revenue: 1490000, subscriptions: 225 },
  { month: "Jan", revenue: 1560000, subscriptions: 234 },
];

const reportTypes = [
  { id: "revenue", name: "Revenue Report", description: "Monthly revenue breakdown by city, plan, and source" },
  { id: "subscriptions", name: "Subscription Report", description: "New, active, paused, and cancelled subscriptions" },
  { id: "leads", name: "Lead Funnel Report", description: "Lead sources, conversion rates, and follow-up metrics" },
  { id: "service", name: "Service Report", description: "Ticket volume, resolution times, and CSAT scores" },
  { id: "inventory", name: "Inventory Report", description: "Stock levels, usage patterns, and reorder alerts" },
  { id: "churn", name: "Churn Analysis", description: "Cancellation reasons and retention metrics" },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30d");

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  const start = new Date(now);
  if (dateRange === "7d") start.setDate(now.getDate() - 7);
  else if (dateRange === "30d") start.setDate(now.getDate() - 30);
  else if (dateRange === "90d") start.setDate(now.getDate() - 90);
  else if (dateRange === "12m") start.setFullYear(now.getFullYear() - 1);

  const revenueReportQuery = useRevenueReport({ startDate: formatDate(start), endDate: formatDate(now) });
  const subsReportQuery = useSubscriptionReport({ startDate: formatDate(start), endDate: formatDate(now) });

  const revenueByCityForUi = revenueReportQuery.data?.byCity?.length
    ? revenueReportQuery.data.byCity.map((c) => ({
        city: c.city,
        revenue: c.revenue,
        percentage: 0,
      }))
    : revenueByCity;

  const totalCityRevenue = revenueByCityForUi.reduce((sum, c) => sum + c.revenue, 0);
  const revenueByCityForUiWithPercent = revenueByCityForUi.map((c) => ({
    ...c,
    percentage: totalCityRevenue ? Math.round((c.revenue / totalCityRevenue) * 100) : 0,
  }));

  const planDistributionForUi = subsReportQuery.data?.byPlan?.length
    ? subsReportQuery.data.byPlan.map((p, idx) => ({
        plan: p.plan,
        subscribers: p.count,
        percentage: 0,
        color: ["bg-primary", "bg-blue-500", "bg-purple-500", "bg-green-500"][idx % 4],
      }))
    : planDistribution;

  const totalPlan = planDistributionForUi.reduce((sum, p) => sum + p.subscribers, 0);
  const planDistributionForUiWithPercent = planDistributionForUi.map((p) => ({
    ...p,
    percentage: totalPlan ? Math.round((p.subscribers / totalPlan) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Reports & Analytics</h1>
          <p className="text-body text-gray-400">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-small text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
          <Button variant="outline" className="border-[#334155] text-gray-300 hover:bg-[#334155]">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-small text-gray-400">{kpi.name}</p>
                <p className="text-h2 font-heading font-bold mt-1">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.trend === "up" ? (
                    <TrendingUp className={`h-4 w-4 ${kpi.color}`} />
                  ) : (
                    <TrendingDown className={`h-4 w-4 ${kpi.color}`} />
                  )}
                  <span className={`text-small font-medium ${kpi.color}`}>{kpi.change}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#334155] flex items-center justify-center">
                <kpi.icon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by City */}
        <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
          <div className="p-4 border-b border-[#334155]">
            <h2 className="text-h4 font-heading font-bold">Revenue by City</h2>
          </div>
          <div className="p-4 space-y-4">
            {revenueByCityForUiWithPercent.map((city) => (
              <div key={city.city} className="flex items-center gap-4">
                <div className="w-24 text-body font-medium">{city.city}</div>
                <div className="flex-1">
                  <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${city.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="text-body font-medium">₹{(city.revenue / 100000).toFixed(1)}L</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
          <div className="p-4 border-b border-[#334155]">
            <h2 className="text-h4 font-heading font-bold">Plan Distribution</h2>
          </div>
          <div className="p-4">
            <div className="flex h-4 rounded-full overflow-hidden mb-4">
              {planDistributionForUiWithPercent.map((plan) => (
                <div
                  key={plan.plan}
                  className={`${plan.color}`}
                  style={{ width: `${plan.percentage}%` }}
                />
              ))}
            </div>
            <div className="space-y-3">
              {planDistributionForUiWithPercent.map((plan) => (
                <div key={plan.plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                    <span className="text-small text-gray-300">{plan.plan}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-body font-medium">{plan.subscribers}</span>
                    <span className="text-small text-gray-500 ml-2">({plan.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
        <div className="p-4 border-b border-[#334155]">
          <h2 className="text-h4 font-heading font-bold">Monthly Trend</h2>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left py-2 px-4 text-small font-medium text-gray-400">Month</th>
                  <th className="text-right py-2 px-4 text-small font-medium text-gray-400">Revenue</th>
                  <th className="text-right py-2 px-4 text-small font-medium text-gray-400">New Subscriptions</th>
                  <th className="text-right py-2 px-4 text-small font-medium text-gray-400">Growth</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((month, idx) => {
                  const prevRevenue = idx > 0 ? monthlyTrend[idx - 1].revenue : month.revenue;
                  const growth = ((month.revenue - prevRevenue) / prevRevenue * 100).toFixed(1);
                  return (
                    <tr key={month.month} className="border-b border-[#334155]">
                      <td className="py-3 px-4 text-body font-medium">{month.month}</td>
                      <td className="py-3 px-4 text-right text-body">₹{(month.revenue / 100000).toFixed(1)}L</td>
                      <td className="py-3 px-4 text-right text-body">{month.subscriptions}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-small font-medium ${parseFloat(growth) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {parseFloat(growth) >= 0 ? "+" : ""}{growth}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div>
        <h2 className="text-h4 font-heading font-bold mb-4">Generate Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className="bg-[#1E293B] rounded-xl p-4 border border-[#334155] hover:border-primary transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-body font-semibold">{report.name}</h3>
                  <p className="text-small text-gray-400 mt-1">{report.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
