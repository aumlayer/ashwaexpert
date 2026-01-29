"use client";

import Link from "next/link";
import {
  Droplets,
  CreditCard,
  Wrench,
  Calendar,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gift,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useMaintenanceSchedule } from "@/hooks/use-service";
import { usePayments } from "@/hooks/use-payments";
import { siteConfig } from "@/data/content";

const quickActions = [
  { name: "Raise Service Request", href: "/app/service", icon: Wrench, color: "text-accent" },
  { name: "View Invoices", href: "/app/payments", icon: CreditCard, color: "text-primary" },
  { name: "Explore Add-ons", href: "/app/addons", icon: Gift, color: "text-success" },
];

export default function PortalDashboard() {
  const { user } = useAuth();

  const subscriptionQuery = useSubscription();
  const maintenanceQuery = useMaintenanceSchedule();
  const paymentsQuery = usePayments();

  const subscription = subscriptionQuery.data;
  const nextVisit = maintenanceQuery.data?.nextVisit;
  const payments = paymentsQuery.data;

  const currentPlanName = subscription?.plan?.name;
  const currentStatus = subscription?.status;
  const monthlyAmount = subscription?.monthlyAmount;
  const nextBillingDate = subscription?.nextBillingDate;

  const upcomingType = nextVisit?.type;
  const upcomingDate = nextVisit?.date;
  const upcomingTimeSlot = nextVisit?.timeSlot;

  const recentPaymentsForUi = (payments ?? []).slice(0, 2).map((p) => ({
    id: p.id,
    date: p.date,
    amount: p.amount,
    status: p.status,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-card p-6 text-white">
        <h1 className="text-h3 font-heading font-bold">
          Welcome back, {user?.name || "Customer"}! 👋
        </h1>
        <p className="mt-1 text-body text-white/90">
          Your water purifier is working perfectly. Here's your dashboard overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subscription Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-small text-foreground-muted">Current Plan</p>
                {subscriptionQuery.isLoading ? (
                  <Skeleton className="h-7 w-40 mt-2" />
                ) : (
                  <p className="text-h4 font-heading font-bold text-foreground mt-1">
                    {currentPlanName ?? "No active subscription"}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  {currentStatus ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-small text-success font-medium capitalize">
                        {currentStatus}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-small text-warning font-medium">Inactive</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Link
              href="/app/subscription"
              className="mt-4 inline-flex items-center text-small text-primary font-medium hover:underline"
            >
              Manage subscription
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Next Billing */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-small text-foreground-muted">Next Billing</p>
                {subscriptionQuery.isLoading ? (
                  <Skeleton className="h-7 w-24 mt-2" />
                ) : (
                  <p className="text-h4 font-heading font-bold text-foreground mt-1">
                    {monthlyAmount != null ? `₹${monthlyAmount}` : "—"}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <Calendar className="h-4 w-4 text-foreground-muted" />
                  <span className="text-small text-foreground-muted">
                    {nextBillingDate ?? "No upcoming billing"}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-accent" />
              </div>
            </div>
            <Link
              href="/app/payments"
              className="mt-4 inline-flex items-center text-small text-primary font-medium hover:underline"
            >
              View payment history
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Visit */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-small text-foreground-muted">Upcoming Visit</p>
                {maintenanceQuery.isLoading ? (
                  <Skeleton className="h-7 w-44 mt-2" />
                ) : (
                  <p className="text-h4 font-heading font-bold text-foreground mt-1">
                    {upcomingType ?? "No visit scheduled"}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-4 w-4 text-foreground-muted" />
                  <span className="text-small text-foreground-muted">
                    {upcomingDate
                      ? `${upcomingDate}${upcomingTimeSlot ? ` • ${upcomingTimeSlot}` : ""}`
                      : "We'll notify you when your next visit is scheduled"}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-success" />
              </div>
            </div>
            <Link
              href="/app/service"
              className="mt-4 inline-flex items-center text-small text-primary font-medium hover:underline"
            >
              View service schedule
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-btn border border-border hover:bg-surface-2 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-body font-medium text-foreground">
                  {action.name}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-h4">Recent Payments</CardTitle>
          <Link
            href="/app/payments"
            className="text-small text-primary font-medium hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {paymentsQuery.isLoading ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 mt-2 ml-auto" />
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 mt-2 ml-auto" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPaymentsForUi.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No payments yet"
                  message="Your payment history will appear here once billed."
                  primaryCta={{ label: "View Plans", href: "/plans" }}
                  secondaryCta={{
                    label: "Chat on WhatsApp",
                    href: `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                      "Hi Ashva Experts! I need help with billing and payments."
                    )}`,
                  }}
                />
              ) : (
                recentPaymentsForUi.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-body font-medium text-foreground">
                        Monthly Subscription
                      </p>
                      <p className="text-small text-foreground-muted">{payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-body font-semibold text-foreground">
                      ₹{payment.amount}
                    </p>
                    <p className="text-small text-success capitalize">{payment.status}</p>
                  </div>
                </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-body font-medium text-foreground">
                💡 Did you know?
              </p>
              <p className="text-small text-foreground-muted mt-1">
                You can save up to 15% by switching to our annual prepaid plan. 
                <Link href="/app/subscription" className="text-primary font-medium ml-1 hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
