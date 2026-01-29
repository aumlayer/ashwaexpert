"use client";

import { useState } from "react";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MessageSquare,
  Phone,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from "@/components/ui";
import { track } from "@/utils/analytics";
import { useCreateServiceTicket, useMaintenanceSchedule, useServiceTickets } from "@/hooks/use-service";
import { siteConfig } from "@/data/content";

// Mock service data - will be replaced with API
const serviceTickets = [
  {
    id: "TKT-001",
    category: "maintenance",
    title: "Quarterly Maintenance",
    status: "scheduled" as const,
    createdAt: "2024-01-20",
    scheduledDate: "2024-02-20",
    scheduledTime: "10:00 AM - 12:00 PM",
    description: "Regular quarterly maintenance visit",
  },
  {
    id: "TKT-002",
    category: "repair",
    title: "Water Flow Issue",
    status: "resolved" as const,
    createdAt: "2024-01-10",
    resolvedAt: "2024-01-11",
    description: "Low water flow from purifier",
    resolution: "Replaced pre-filter and cleaned membrane",
  },
  {
    id: "TKT-003",
    category: "complaint",
    title: "Taste Issue",
    status: "resolved" as const,
    createdAt: "2023-12-15",
    resolvedAt: "2023-12-16",
    description: "Water has slight metallic taste",
    resolution: "Replaced carbon filter",
  },
];

const upcomingMaintenance = {
  date: "Feb 20, 2024",
  time: "10:00 AM - 12:00 PM",
  type: "Quarterly Maintenance",
  technician: "Rajesh Kumar",
};

const categories = [
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "repair", label: "Repair", icon: AlertCircle },
  { id: "complaint", label: "Complaint", icon: MessageSquare },
  { id: "relocation", label: "Relocation", icon: Filter },
];

const statusConfig = {
  open: { color: "text-warning", bg: "bg-warning/10", label: "Open" },
  scheduled: { color: "text-primary", bg: "bg-primary/10", label: "Scheduled" },
  in_progress: { color: "text-accent", bg: "bg-accent/10", label: "In Progress" },
  resolved: { color: "text-success", bg: "bg-success/10", label: "Resolved" },
  closed: { color: "text-foreground-muted", bg: "bg-surface-2", label: "Closed" },
};

type TicketStatus = keyof typeof statusConfig;

type TicketForUi = {
  id: string;
  category: string;
  title: string;
  status: TicketStatus;
  createdAt: string;
  scheduledDate?: string;
  scheduledTime?: string;
  description: string;
  resolution?: string;
};

export default function ServicePage() {
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredSlot, setPreferredSlot] = useState<"morning" | "afternoon" | "evening" | "">("");

  const maintenanceQuery = useMaintenanceSchedule();

  const statusToApiStatus: Record<string, string | undefined> = {
    all: undefined,
    scheduled: "assigned",
    in_progress: "in_progress",
    resolved: "resolved",
  };

  const ticketsQuery = useServiceTickets(statusToApiStatus[filterStatus]);
  const createTicketMutation = useCreateServiceTicket();

  const handleCreateTicket = () => {
    track("service_request_started", {});
    setShowNewTicket(true);
  };

  const handleSubmitNewTicket = async () => {
    if (!selectedCategory) return;
    if (!description.trim()) return;

    try {
      await createTicketMutation.mutateAsync({
        category: selectedCategory as any,
        description: description.trim(),
        preferredSlot:
          preferredDate && preferredSlot
            ? {
                date: preferredDate,
                timeSlot: preferredSlot,
              }
            : undefined,
      });
      track("ticket_created", {
        category: selectedCategory,
        has_preferred_slot: Boolean(preferredDate && preferredSlot),
      });
      setShowNewTicket(false);
      setSelectedCategory(null);
      setDescription("");
      setPreferredDate("");
      setPreferredSlot("");
    } catch {}
  };

  const upcoming = maintenanceQuery.data?.nextVisit
    ? {
        date: maintenanceQuery.data.nextVisit.date,
        time: maintenanceQuery.data.nextVisit.timeSlot,
        type: maintenanceQuery.data.nextVisit.type,
        technician: maintenanceQuery.data.nextVisit.technician || upcomingMaintenance.technician,
      }
    : upcomingMaintenance;

  const ticketsForUi: TicketForUi[] = (
    ticketsQuery.data && ticketsQuery.data.length > 0 ? ticketsQuery.data : serviceTickets
  ).map((t: any): TicketForUi => {
    if ("scheduledDate" in t) {
      return {
        id: t.id,
        category: t.category,
        title: t.title,
        status: t.status as TicketStatus,
        createdAt: t.createdAt,
        scheduledDate: t.scheduledDate,
        scheduledTime: t.scheduledTime,
        description: t.description,
        resolution: t.resolution,
      };
    }

    const createdAt = t.createdAt || new Date().toISOString();
    const slot = t.preferredSlot;
    const scheduledDate = slot?.date;
    const scheduledTime =
      slot?.timeSlot === "morning"
        ? "9:00 AM - 12:00 PM"
        : slot?.timeSlot === "afternoon"
        ? "12:00 PM - 4:00 PM"
        : slot?.timeSlot === "evening"
        ? "4:00 PM - 7:00 PM"
        : undefined;

    const title =
      t.category === "maintenance"
        ? "Maintenance"
        : t.category === "repair"
        ? "Repair"
        : t.category === "complaint"
        ? "Complaint"
        : t.category === "relocation"
        ? "Relocation"
        : "Service Request";

    const mappedStatus: TicketStatus =
      t.status === "assigned"
        ? "scheduled"
        : t.status === "in_progress"
        ? "in_progress"
        : t.status === "resolved"
        ? "resolved"
        : t.status === "closed"
        ? "closed"
        : t.status === "scheduled"
        ? "scheduled"
        : "open";

    return {
      id: t.id,
      category: t.category,
      title,
      status: mappedStatus,
      createdAt,
      scheduledDate,
      scheduledTime,
      description: t.description,
      resolution: undefined,
    };
  });

  const filteredTickets = ticketsForUi.filter((ticket) => {
    if (filterStatus === "all") return true;
    return ticket.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Upcoming Maintenance Banner */}
      {upcoming && (
        <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-small text-foreground-muted">Upcoming Visit</p>
                  <p className="text-h4 font-heading font-bold text-foreground">
                    {maintenanceQuery.isLoading ? <Skeleton className="h-6 w-40" /> : upcoming.type}
                  </p>
                  <p className="text-body text-foreground-muted mt-1">
                    {maintenanceQuery.isLoading ? (
                      <Skeleton className="h-4 w-56 mt-2" />
                    ) : (
                      <>
                        {upcoming.date} • {upcoming.time}
                      </>
                    )}
                  </p>
                  <p className="text-small text-foreground-muted mt-1">
                    Technician: {upcoming.technician}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Reschedule</Button>
                <Button variant="ghost" className="text-error hover:text-error">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-h4 font-heading font-bold text-foreground">Service Requests</h2>
        <Button onClick={handleCreateTicket}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* New Ticket Form */}
      {showNewTicket && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Create Service Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-small font-medium text-foreground mb-2">
                  What do you need help with?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-btn border transition-colors ${
                        selectedCategory === cat.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <cat.icon
                        className={`h-6 w-6 ${
                          selectedCategory === cat.id ? "text-primary" : "text-foreground-muted"
                        }`}
                      />
                      <span
                        className={`text-small font-medium ${
                          selectedCategory === cat.id ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategory && (
                <>
                  <div>
                    <label className="block text-small font-medium text-foreground mb-1.5">
                      Describe the issue
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Please describe your issue in detail..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-btn border border-border bg-surface text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-small font-medium text-foreground mb-1.5">
                      Preferred Date & Time
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                      />
                      <select
                        value={preferredSlot}
                        onChange={(e) => setPreferredSlot(e.target.value as any)}
                        className="px-4 py-3 rounded-btn border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                      >
                        <option value="">Select slot</option>
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                        <option value="evening">Evening (4 PM - 7 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1"
                      onClick={handleSubmitNewTicket}
                      isLoading={createTicketMutation.isPending}
                      disabled={!selectedCategory || !description.trim()}
                    >
                      Submit Request
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewTicket(false);
                        setSelectedCategory(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "scheduled", "in_progress", "resolved"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-btn text-small font-medium whitespace-nowrap transition-colors ${
              filterStatus === status
                ? "bg-primary text-white"
                : "bg-surface border border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            {status === "all" ? "All Requests" : statusConfig[status as keyof typeof statusConfig]?.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {ticketsQuery.isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="space-y-3">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-64" />
              </div>
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <p className="text-body font-medium text-foreground">No service requests</p>
              <p className="text-small text-foreground-muted mt-1">
                You haven't raised any service requests yet.
              </p>
              <Button className="mt-4" onClick={handleCreateTicket}>
                Create Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center`}>
                        {ticket.status === "resolved" ? (
                          <CheckCircle2 className={`h-5 w-5 ${status.color}`} />
                        ) : ticket.status === "scheduled" ? (
                          <Calendar className={`h-5 w-5 ${status.color}`} />
                        ) : (
                          <Clock className={`h-5 w-5 ${status.color}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-body font-medium text-foreground">{ticket.title}</p>
                          <Badge
                            variant={ticket.status === "resolved" ? "success" : "default"}
                            className="text-caption"
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-small text-foreground-muted mt-1">
                          {ticket.id} • Created {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        {ticket.scheduledDate && (
                          <p className="text-small text-primary mt-1">
                            Scheduled: {ticket.scheduledDate} • {ticket.scheduledTime}
                          </p>
                        )}
                        {ticket.resolution && (
                          <p className="text-small text-success mt-1">
                            ✓ {ticket.resolution}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-foreground-muted flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Contact Support */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body font-medium text-foreground">Need urgent help?</p>
                <p className="text-small text-foreground-muted">
                  Call our 24/7 support line for immediate assistance.
                </p>
              </div>
            </div>
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center h-11 px-6 rounded-btn border-2 border-primary text-primary bg-transparent hover:bg-primary/5 active:scale-[0.98] font-semibold transition-all duration-standard ease-out-expo"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Support
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
