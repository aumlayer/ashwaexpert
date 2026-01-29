"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Image,
  Video,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Globe,
  Star,
  MessageSquare,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";

// Mock data
const contentItems = [
  {
    id: "1",
    title: "How RO Purification Works",
    type: "blog",
    status: "published",
    author: "Admin",
    updatedAt: "2024-01-28",
    views: 1234,
  },
  {
    id: "2",
    title: "Benefits of Copper Water",
    type: "blog",
    status: "published",
    author: "Admin",
    updatedAt: "2024-01-25",
    views: 892,
  },
  {
    id: "3",
    title: "Water Quality in Bangalore",
    type: "city",
    status: "published",
    author: "Admin",
    updatedAt: "2024-01-20",
    views: 2456,
  },
  {
    id: "4",
    title: "Summer Maintenance Tips",
    type: "blog",
    status: "draft",
    author: "Admin",
    updatedAt: "2024-01-27",
    views: 0,
  },
  {
    id: "5",
    title: "Customer Success: Priya's Story",
    type: "testimonial",
    status: "published",
    author: "Admin",
    updatedAt: "2024-01-15",
    views: 567,
  },
];

const contentTypes = [
  { id: "all", label: "All Content", icon: FileText, count: 5 },
  { id: "blog", label: "Blog Posts", icon: FileText, count: 3 },
  { id: "city", label: "City Pages", icon: Globe, count: 1 },
  { id: "testimonial", label: "Testimonials", icon: Star, count: 1 },
  { id: "faq", label: "FAQs", icon: MessageSquare, count: 0 },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  published: { color: "text-green-400", bg: "bg-green-500/20" },
  draft: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  archived: { color: "text-gray-400", bg: "bg-gray-500/20" },
};

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredContent = contentItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Content Management</h1>
          <p className="text-body text-gray-400">
            Manage blog posts, city pages, and other content
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-small text-gray-300">
            This page is currently showing sample data. API wiring for content management is pending.
          </div>
          <Badge variant="default">Sample</Badge>
        </div>
      </div>

      {/* Content Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {contentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setTypeFilter(type.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-small font-medium whitespace-nowrap transition-colors ${
              typeFilter === type.id
                ? "bg-primary text-white"
                : "bg-[#1E293B] text-gray-400 hover:text-white border border-[#334155]"
            }`}
          >
            <type.icon className="h-4 w-4" />
            {type.label}
            <span className={`px-1.5 py-0.5 rounded text-caption ${
              typeFilter === type.id ? "bg-white/20" : "bg-[#334155]"
            }`}>
              {type.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1E293B] rounded-lg border border-[#334155] max-w-md">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-small text-white placeholder:text-gray-500"
        />
      </div>

      {/* Content List */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Title</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Author</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Updated</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Views</th>
                <th className="text-right py-3 px-4 text-small font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((item) => {
                const status = statusConfig[item.status];
                return (
                  <tr key={item.id} className="border-b border-[#334155] hover:bg-[#334155]/50">
                    <td className="py-4 px-4">
                      <p className="text-body font-medium">{item.title}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-small text-gray-300 capitalize">{item.type}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${status.bg} ${status.color}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-small text-gray-300">{item.author}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-small text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-small text-gray-300">
                        <Eye className="h-3 w-3" />
                        {item.views.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 hover:bg-[#334155] rounded-lg">
                          <Edit className="h-4 w-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-[#334155] rounded-lg">
                          <Eye className="h-4 w-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-red-500/20 rounded-lg">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "New Blog Post", icon: FileText, href: "/admin/content/new?type=blog" },
          { label: "New City Page", icon: Globe, href: "/admin/content/new?type=city" },
          { label: "Add Testimonial", icon: Star, href: "/admin/content/new?type=testimonial" },
          { label: "Manage FAQs", icon: MessageSquare, href: "/admin/content/faqs" },
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
