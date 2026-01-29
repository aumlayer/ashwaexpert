"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Target,
  ArrowRight,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";

// Mock data
const funnelData = [
  { stage: "Website Visits", count: 45000, rate: 100 },
  { stage: "Pincode Checks", count: 12500, rate: 27.8 },
  { stage: "Plan Views", count: 8200, rate: 65.6 },
  { stage: "Checkout Started", count: 3100, rate: 37.8 },
  { stage: "Payment Initiated", count: 2400, rate: 77.4 },
  { stage: "Payment Success", count: 2100, rate: 87.5 },
  { stage: "Installation Done", count: 1950, rate: 92.9 },
];

const cohortData = [
  { month: "Jan 2024", m0: 100, m1: 95, m2: 92, m3: 89, m4: 87, m5: 85 },
  { month: "Feb 2024", m0: 100, m1: 94, m2: 91, m3: 88, m4: 86, m5: null },
  { month: "Mar 2024", m0: 100, m1: 96, m2: 93, m3: 90, m4: null, m5: null },
  { month: "Apr 2024", m0: 100, m1: 95, m2: 92, m3: null, m4: null, m5: null },
  { month: "May 2024", m0: 100, m1: 94, m2: null, m3: null, m4: null, m5: null },
  { month: "Jun 2024", m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null },
];

const campaignData = [
  { name: "Google Ads - Brand", visits: 12000, conversions: 450, cac: 890, revenue: 245000 },
  { name: "Google Ads - Generic", visits: 8500, conversions: 280, cac: 1200, revenue: 152000 },
  { name: "Facebook Ads", visits: 6200, conversions: 180, cac: 950, revenue: 98000 },
  { name: "Organic Search", visits: 15000, conversions: 520, cac: 0, revenue: 283000 },
  { name: "Referrals", visits: 3200, conversions: 420, cac: 500, revenue: 228000 },
  { name: "Direct", visits: 5100, conversions: 250, cac: 0, revenue: 136000 },
];

const kpis = [
  { label: "Overall Conversion", value: "4.67%", change: "+0.3%", trend: "up" },
  { label: "Avg CAC", value: "₹892", change: "-₹45", trend: "up" },
  { label: "LTV:CAC Ratio", value: "4.2x", change: "+0.2x", trend: "up" },
  { label: "Payback Period", value: "3.2 mo", change: "-0.3 mo", trend: "up" },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h3 font-heading font-bold text-white">
            Analytics
          </h1>
          <p className="text-body text-gray-400 mt-1">
            Funnel performance, cohorts, and campaign attribution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-btn text-white text-small"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-6 flex items-center justify-between gap-3">
          <div className="text-small text-gray-300">
            Analytics is currently showing sample data. API wiring for this module is pending.
          </div>
          <Badge variant="default">Sample</Badge>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <p className="text-small text-gray-400">{kpi.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-h3 font-heading font-bold text-white">
                  {kpi.value}
                </span>
                <span className={`text-small flex items-center ${
                  kpi.trend === "up" ? "text-green-400" : "text-red-400"
                }`}>
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {kpi.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-400" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((stage, idx) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-small font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-body text-white">{stage.stage}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-body font-semibold text-white">
                      {stage.count.toLocaleString()}
                    </span>
                    {idx > 0 && (
                      <Badge variant={stage.rate >= 50 ? "success" : "default"}>
                        {stage.rate}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all"
                    style={{ width: `${(stage.count / funnelData[0].count) * 100}%` }}
                  />
                </div>
                {idx < funnelData.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-4 w-4 text-gray-600 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cohort Analysis */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-400" />
            Retention Cohorts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-small font-medium text-gray-400 py-3 px-2">Cohort</th>
                  <th className="text-center text-small font-medium text-gray-400 py-3 px-2">M0</th>
                  <th className="text-center text-small font-medium text-gray-400 py-3 px-2">M1</th>
                  <th className="text-center text-small font-medium text-gray-400 py-3 px-2">M2</th>
                  <th className="text-center text-small font-medium text-gray-400 py-3 px-2">M3</th>
                  <th className="text-center text-small font-medium text-gray-400 py-3 px-2">M4</th>
                  <th className="text-center text-small font-medium text-gray-400 py-3 px-2">M5</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row) => (
                  <tr key={row.month} className="border-b border-gray-700/50">
                    <td className="text-small text-white py-3 px-2">{row.month}</td>
                    {[row.m0, row.m1, row.m2, row.m3, row.m4, row.m5].map((val, idx) => (
                      <td key={idx} className="text-center py-3 px-2">
                        {val !== null ? (
                          <span
                            className={`inline-block px-2 py-1 rounded text-small font-medium ${
                              val >= 90
                                ? "bg-green-500/20 text-green-400"
                                : val >= 80
                                ? "bg-teal-500/20 text-teal-400"
                                : val >= 70
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {val}%
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-caption text-gray-500 mt-4">
            Retention rate by month since subscription start. M0 = activation month.
          </p>
        </CardContent>
      </Card>

      {/* Campaign Attribution */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-400" />
            Campaign Attribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-small font-medium text-gray-400 py-3">Campaign</th>
                  <th className="text-right text-small font-medium text-gray-400 py-3">Visits</th>
                  <th className="text-right text-small font-medium text-gray-400 py-3">Conversions</th>
                  <th className="text-right text-small font-medium text-gray-400 py-3">Conv. Rate</th>
                  <th className="text-right text-small font-medium text-gray-400 py-3">CAC</th>
                  <th className="text-right text-small font-medium text-gray-400 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {campaignData.map((campaign) => (
                  <tr key={campaign.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="text-body text-white py-3">{campaign.name}</td>
                    <td className="text-body text-gray-300 py-3 text-right">
                      {campaign.visits.toLocaleString()}
                    </td>
                    <td className="text-body text-gray-300 py-3 text-right">
                      {campaign.conversions.toLocaleString()}
                    </td>
                    <td className="text-body text-gray-300 py-3 text-right">
                      {((campaign.conversions / campaign.visits) * 100).toFixed(1)}%
                    </td>
                    <td className="text-body py-3 text-right">
                      {campaign.cac === 0 ? (
                        <span className="text-green-400">Organic</span>
                      ) : (
                        <span className="text-gray-300">₹{campaign.cac}</span>
                      )}
                    </td>
                    <td className="text-body font-semibold text-white py-3 text-right">
                      ₹{(campaign.revenue / 1000).toFixed(0)}K
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-600">
                  <td className="text-body font-semibold text-white py-3">Total</td>
                  <td className="text-body font-semibold text-white py-3 text-right">
                    {campaignData.reduce((a, b) => a + b.visits, 0).toLocaleString()}
                  </td>
                  <td className="text-body font-semibold text-white py-3 text-right">
                    {campaignData.reduce((a, b) => a + b.conversions, 0).toLocaleString()}
                  </td>
                  <td className="text-body font-semibold text-white py-3 text-right">
                    {(
                      (campaignData.reduce((a, b) => a + b.conversions, 0) /
                        campaignData.reduce((a, b) => a + b.visits, 0)) *
                      100
                    ).toFixed(1)}%
                  </td>
                  <td className="text-body font-semibold text-white py-3 text-right">
                    ₹{Math.round(
                      campaignData.filter(c => c.cac > 0).reduce((a, b) => a + b.cac, 0) /
                      campaignData.filter(c => c.cac > 0).length
                    )}
                  </td>
                  <td className="text-body font-semibold text-white py-3 text-right">
                    ₹{(campaignData.reduce((a, b) => a + b.revenue, 0) / 1000).toFixed(0)}K
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
