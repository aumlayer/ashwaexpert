"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Globe,
  Star,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import {
  useAdminCaseStudies,
  usePublishCaseStudy,
  useUnpublishCaseStudy,
  useDeleteCaseStudy,
  type CaseStudyManageItem,
} from "@/hooks/use-admin";

const statusConfig: Record<string, { color: string; bg: string }> = {
  published: { color: "text-green-400", bg: "bg-green-500/20" },
  draft: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  archived: { color: "text-gray-400", bg: "bg-gray-500/20" },
};

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const caseStudiesQuery = useAdminCaseStudies({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    page: 1,
  });

  const publishMutation = usePublishCaseStudy();
  const unpublishMutation = useUnpublishCaseStudy();
  const deleteMutation = useDeleteCaseStudy();

  const caseStudies = caseStudiesQuery.data?.items ?? [];

  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  const handleUnpublish = (id: string) => {
    unpublishMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this case study?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Content Management</h1>
          <p className="text-body text-gray-400">
            Manage case studies and other content
          </p>
        </div>
        <Link href="/admin/content/case-studies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Case Study
          </Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "draft", "published"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-small font-medium whitespace-nowrap transition-colors ${
              statusFilter === status
                ? "bg-primary text-white"
                : "bg-[#1E293B] text-gray-400 hover:text-white border border-[#334155]"
            }`}
          >
            <FileText className="h-4 w-4" />
            {status === "all" ? "All Case Studies" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1E293B] rounded-lg border border-[#334155] max-w-md">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search case studies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-small text-white placeholder:text-gray-500"
        />
      </div>

      {/* Case Studies List */}
      {caseStudiesQuery.isLoading ? (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <div className="p-4">
            <Skeleton className="h-6 w-48 bg-white/10" />
            <Skeleton className="h-6 w-80 bg-white/10 mt-3" />
            <Skeleton className="h-6 w-72 bg-white/10 mt-3" />
          </div>
        </div>
      ) : caseStudiesQuery.isError ? (
        <EmptyState
          title="Unable to load case studies"
          message="Please try again. If the issue persists, contact support."
          primaryCta={{ label: "Retry", onClick: () => caseStudiesQuery.refetch() }}
        />
      ) : caseStudies.length === 0 ? (
        <EmptyState
          title="No case studies found"
          message="Create your first case study to showcase customer success stories."
          primaryCta={{ label: "Create Case Study", onClick: () => {} }}
        />
      ) : (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Title</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Slug</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Updated</th>
                  <th className="text-right py-3 px-4 text-small font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {caseStudies.map((item: CaseStudyManageItem) => {
                  const status = statusConfig[item.status] ?? statusConfig.draft;
                  return (
                    <tr key={item.id} className="border-b border-[#334155] hover:bg-[#334155]/50">
                      <td className="py-4 px-4">
                        <p className="text-body font-medium">{item.title}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-small text-gray-400 font-mono">{item.slug}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${status.bg} ${status.color}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-small text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.updated_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === "draft" ? (
                            <button
                              onClick={() => handlePublish(item.id)}
                              className="p-2 hover:bg-green-500/20 rounded-lg"
                              title="Publish"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpublish(item.id)}
                              className="p-2 hover:bg-yellow-500/20 rounded-lg"
                              title="Unpublish"
                            >
                              <XCircle className="h-4 w-4 text-yellow-400" />
                            </button>
                          )}
                          <Link href={`/admin/content/case-studies/${item.id}/edit`}>
                            <button className="p-2 hover:bg-[#334155] rounded-lg">
                              <Edit className="h-4 w-4 text-gray-400" />
                            </button>
                          </Link>
                          <Link href={`/case-studies/${item.slug}`} target="_blank">
                            <button className="p-2 hover:bg-[#334155] rounded-lg">
                              <Eye className="h-4 w-4 text-gray-400" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg"
                          >
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

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-[#334155]">
            <p className="text-small text-gray-400">
              Showing {caseStudies.length} of {caseStudiesQuery.data?.total ?? caseStudies.length} case studies
            </p>
          </div>
        </div>
      )}

      {/* Other Content Types - Not Implemented */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6">
        <h2 className="text-h4 font-heading font-bold mb-4">Other Content Types</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Blog Posts", icon: FileText, status: "Not implemented" },
            { label: "City Pages", icon: Globe, status: "Not implemented" },
            { label: "FAQs", icon: MessageSquare, status: "Not implemented" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-4 bg-[#0F172A] rounded-lg border border-[#334155]"
            >
              <item.icon className="h-5 w-5 text-gray-500" />
              <div>
                <span className="text-body font-medium text-gray-400">{item.label}</span>
                <p className="text-caption text-gray-500">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
