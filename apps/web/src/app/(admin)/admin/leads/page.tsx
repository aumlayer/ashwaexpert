"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { useLeads } from "@/hooks/use-admin";

// Mock data
const leads = [
  {
    id: "1",
    name: "Priya Sharma",
    phone: "9876543210",
    email: "priya@example.com",
    city: "Bangalore",
    pincode: "560001",
    source: "website",
    status: "new",
    createdAt: "2024-01-28T10:30:00",
    notes: "Interested in RO+UV plan",
  },
  {
    id: "2",
    name: "Rajesh Kumar",
    phone: "8765432109",
    email: "rajesh@example.com",
    city: "Hyderabad",
    pincode: "500001",
    source: "whatsapp",
    status: "contacted",
    createdAt: "2024-01-28T09:15:00",
    notes: "Called back, scheduled demo",
  },
  {
    id: "3",
    name: "Anita Patel",
    phone: "7654321098",
    email: "anita@example.com",
    city: "Mumbai",
    pincode: "400001",
    source: "callback",
    status: "scheduled",
    createdAt: "2024-01-27T16:45:00",
    notes: "Installation scheduled for Feb 1",
  },
  {
    id: "4",
    name: "Vikram Singh",
    phone: "6543210987",
    email: "vikram@example.com",
    city: "Delhi",
    pincode: "110001",
    source: "corporate",
    status: "converted",
    createdAt: "2024-01-27T14:20:00",
    notes: "Converted to Advanced RO+UV",
  },
  {
    id: "5",
    name: "Meera Krishnan",
    phone: "5432109876",
    email: "meera@example.com",
    city: "Chennai",
    pincode: "600001",
    source: "website",
    status: "lost",
    createdAt: "2024-01-26T11:00:00",
    notes: "Not interested - already has purifier",
  },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  contacted: "bg-yellow-500/20 text-yellow-400",
  scheduled: "bg-purple-500/20 text-purple-400",
  converted: "bg-green-500/20 text-green-400",
  lost: "bg-gray-500/20 text-gray-400",
};

const sourceLabels: Record<string, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  callback: "Callback",
  corporate: "Corporate",
  exit_intent: "Exit Intent",
};

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const leadsQuery = useLeads({ status: statusFilter === "all" ? undefined : statusFilter, page: 1, limit: 50 });

  const leadsForUi = (leadsQuery.data?.data && leadsQuery.data.data.length > 0
    ? leadsQuery.data.data
    : leads) as any[];

  const filteredLeads = leadsForUi.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Leads</h1>
          <p className="text-body text-gray-400">
            Manage and follow up on potential customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#334155] text-gray-300 hover:bg-[#334155]">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#1E293B] rounded-lg border border-[#334155]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-small text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2">
          {["all", "new", "contacted", "scheduled", "converted", "lost"].map((status) => (
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total", count: leadsForUi.length, color: "text-white" },
          { label: "New", count: leadsForUi.filter((l) => l.status === "new").length, color: "text-blue-400" },
          { label: "Contacted", count: leadsForUi.filter((l) => l.status === "contacted").length, color: "text-yellow-400" },
          { label: "Scheduled", count: leadsForUi.filter((l) => l.status === "scheduled").length, color: "text-purple-400" },
          { label: "Converted", count: leadsForUi.filter((l) => l.status === "converted").length, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
            <p className="text-small text-gray-400">{stat.label}</p>
            {leadsQuery.isLoading ? (
              <Skeleton className="h-8 w-14 mt-2 bg-white/10" />
            ) : (
              <p className={`text-h3 font-heading font-bold ${stat.color}`}>{stat.count}</p>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-500"
                  />
                </th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Contact</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Location</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Source</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Created</th>
                <th className="text-right py-3 px-4 text-small font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-[#334155] hover:bg-[#334155]/50">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="rounded border-gray-500"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center">
                        <span className="text-small font-medium">{lead.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-body font-medium">{lead.name}</p>
                        <p className="text-caption text-gray-400 truncate max-w-[150px]">{lead.notes}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-small text-gray-300">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </div>
                      <div className="flex items-center gap-1 text-caption text-gray-400">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-small text-gray-300">
                      <MapPin className="h-3 w-3" />
                      {lead.city} - {lead.pincode}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-small text-gray-300">{sourceLabels[lead.source]}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-small text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(lead.createdAt).toLocaleDateString("en-IN", {
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-[#334155]">
          <p className="text-small text-gray-400">
            Showing {filteredLeads.length} of {leadsForUi.length} leads
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-[#334155] text-gray-400 hover:text-white disabled:opacity-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-small text-white">1</span>
            <button className="p-2 rounded-lg bg-[#334155] text-gray-400 hover:text-white disabled:opacity-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
