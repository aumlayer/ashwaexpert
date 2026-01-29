"use client";

import { useState } from "react";
import {
  CreditCard,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Calendar,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton, EmptyState } from "@/components/ui";
import { track } from "@/utils/analytics";
import {
  usePayments,
  usePaymentMethods,
  useRetryPayment,
  useDownloadInvoice,
} from "@/hooks/use-payments";
import { useSubscription } from "@/hooks/use-subscription";
import { siteConfig } from "@/data/content";

// Mock payment data - will be replaced with API

const statusConfig = {
  paid: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Paid" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  failed: { icon: XCircle, color: "text-error", bg: "bg-error/10", label: "Failed" },
};

export default function PaymentsPage() {
  const [selectedTab, setSelectedTab] = useState<"history" | "methods">("history");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(null);

  const subscriptionQuery = useSubscription();
  const paymentsQuery = usePayments();
  const methodsQuery = usePaymentMethods();
  const retryMutation = useRetryPayment();
  const downloadInvoiceMutation = useDownloadInvoice();

  const paymentsForUi = (paymentsQuery.data ?? []).map((p) => ({
    ...p,
    status: p.status as "paid" | "pending" | "failed",
  }));

  const paymentMethodsForUi = (methodsQuery.data ?? []).map((m) => ({
    id: m.id,
    name: m.type === "card" && m.lastFour ? `Card ending ${m.lastFour}` : m.name,
    icon: m.type === "upi" ? "📱" : m.type === "card" ? "💳" : "🏦",
    isDefault: m.isDefault,
  }));

  const upcomingPayment = subscriptionQuery.data?.nextBillingDate && subscriptionQuery.data?.monthlyAmount
    ? {
        amount: subscriptionQuery.data.monthlyAmount,
        dueDate: subscriptionQuery.data.nextBillingDate,
        plan: subscriptionQuery.data.plan?.name || "",
      }
    : null;

  const handleDownloadInvoice = (invoiceId: string) => {
    track("invoice_downloaded", { invoice_id: invoiceId });
    setDownloadingInvoiceId(invoiceId);
    downloadInvoiceMutation.mutate(invoiceId, {
      onSettled: () => setDownloadingInvoiceId(null),
    });
  };

  const handleRetryPayment = async (paymentId: string) => {
    track("payment_retry_clicked", { payment_id: paymentId });
    setRetryingPaymentId(paymentId);
    try {
      const res = await retryMutation.mutateAsync(paymentId);
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } finally {
      setRetryingPaymentId(null);
    }
  };

  const totalPaid = paymentsForUi
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Upcoming Payment Banner */}
      {upcomingPayment ? (
        <Card className="bg-gradient-to-r from-primary to-accent text-white">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-small text-white/80">Next Payment Due</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-h2 font-heading font-bold">₹{upcomingPayment.amount}</span>
                  <span className="text-body text-white/80">
                    on {new Date(upcomingPayment.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {upcomingPayment.plan ? (
                  <p className="text-small text-white/70 mt-1">{upcomingPayment.plan} subscription</p>
                ) : null}
              </div>
              <Button className="bg-white text-primary hover:bg-white/90">
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-small text-foreground-muted">Total Paid</p>
                <p className="text-h4 font-heading font-bold text-foreground">₹{totalPaid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-small text-foreground-muted">Invoices</p>
                <p className="text-h4 font-heading font-bold text-foreground">{paymentsForUi.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-small text-foreground-muted">Member Since</p>
                <p className="text-h4 font-heading font-bold text-foreground">
                  {subscriptionQuery.isLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : subscriptionQuery.data?.startDate ? (
                    new Date(subscriptionQuery.data.startDate).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setSelectedTab("history")}
          className={`px-4 py-2 text-body font-medium border-b-2 transition-colors ${
            selectedTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Payment History
        </button>
        <button
          onClick={() => setSelectedTab("methods")}
          className={`px-4 py-2 text-body font-medium border-b-2 transition-colors ${
            selectedTab === "methods"
              ? "border-primary text-primary"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Payment Methods
        </button>
      </div>

      {selectedTab === "history" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : paymentsForUi.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No payments yet"
                message="Your invoices will appear here once you have a billed payment."
                primaryCta={{ label: "View Plans", href: "/plans" }}
                secondaryCta={{
                  label: "Chat on WhatsApp",
                  href: `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                    "Hi Ashva Experts! I need help with billing and payments."
                  )}`,
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-small font-medium text-foreground-muted">Date</th>
                      <th className="text-left py-3 px-4 text-small font-medium text-foreground-muted">Invoice</th>
                      <th className="text-left py-3 px-4 text-small font-medium text-foreground-muted">Method</th>
                      <th className="text-left py-3 px-4 text-small font-medium text-foreground-muted">Status</th>
                      <th className="text-right py-3 px-4 text-small font-medium text-foreground-muted">Amount</th>
                      <th className="text-right py-3 px-4 text-small font-medium text-foreground-muted">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsForUi.map((payment) => {
                      const status = statusConfig[payment.status];
                      const invoiceId = payment.invoiceId || "";
                      return (
                        <tr key={payment.id} className="border-b border-border last:border-0">
                          <td className="py-4 px-4">
                            <p className="text-body text-foreground">
                              {new Date(payment.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-body text-foreground">{invoiceId || "—"}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-body text-foreground-muted">{payment.method}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <status.icon className={`h-4 w-4 ${status.color}`} />
                              <span className={`text-small font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <p className="text-body font-semibold text-foreground">₹{payment.amount}</p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {payment.status === "failed" ? (
                              <button
                                onClick={() => handleRetryPayment(payment.id)}
                                className="inline-flex items-center gap-1 text-small text-primary hover:underline"
                                disabled={retryingPaymentId === payment.id || retryMutation.isPending}
                              >
                                <RefreshCw className="h-4 w-4" />
                                {retryingPaymentId === payment.id ? "Retrying..." : "Retry"}
                              </button>
                            ) : invoiceId ? (
                              <button
                                onClick={() => handleDownloadInvoice(invoiceId)}
                                className="inline-flex items-center gap-1 text-small text-primary hover:underline"
                                disabled={
                                  downloadingInvoiceId === invoiceId ||
                                  downloadInvoiceMutation.isPending
                                }
                              >
                                <Download className="h-4 w-4" />
                                {downloadingInvoiceId === invoiceId ? "Downloading..." : "Download"}
                              </button>
                            ) : (
                              <span className="text-small text-foreground-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-h4">Saved Payment Methods</CardTitle>
            <Button variant="outline" size="sm">
              Add New
            </Button>
          </CardHeader>
          <CardContent>
            {methodsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : paymentMethodsForUi.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No saved payment methods"
                message="Add a payment method to enable auto-pay."
                primaryCta={{ label: "View Plans", href: "/plans" }}
                secondaryCta={{
                  label: "Chat on WhatsApp",
                  href: `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                    "Hi Ashva Experts! I want to set up auto-pay."
                  )}`,
                }}
              />
            ) : (
              <div className="space-y-3">
                {paymentMethodsForUi.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 rounded-btn border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="text-body font-medium text-foreground">{method.name}</p>
                        {method.isDefault && (
                          <p className="text-small text-primary">Default</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button variant="ghost" size="sm">
                          Set Default
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-error hover:text-error">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Auto-pay info */}
            <div className="mt-6 p-4 rounded-btn bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-body font-medium text-foreground">Auto-pay Enabled</p>
                  <p className="text-small text-foreground-muted mt-1">
                    Your subscription will be automatically renewed using your default payment method.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-foreground-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium text-foreground">Need help with payments?</p>
              <p className="text-small text-foreground-muted mt-1">
                Contact our support team for any payment-related queries.{" "}
                <a href="/support" className="text-primary hover:underline">
                  Get Help
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
