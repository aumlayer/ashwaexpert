"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Phone, MessageCircle, Download } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { siteConfig } from "@/data/content";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") || "ORD123456";

  return (
    <section className="py-18 lg:py-24 bg-surface-2 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <h1 className="text-h1 font-heading font-bold text-foreground">
              You're All Set!
            </h1>
            <p className="mt-4 text-body-lg text-foreground-muted">
              Your subscription has been confirmed. We'll see you soon!
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-small text-foreground-muted">Order ID</p>
                  <p className="text-body font-semibold text-foreground">{orderId}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-body font-semibold text-foreground">
                      Installation Scheduled
                    </p>
                    <p className="text-small text-foreground-muted">
                      Our technician will arrive within the selected time slot.
                      You'll receive an SMS with technician details 1 hour before.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-body font-semibold text-foreground">
                      Confirmation Call
                    </p>
                    <p className="text-small text-foreground-muted">
                      Our team will call you within 2 hours to confirm your
                      installation details.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="text-h4 font-heading font-semibold text-foreground mb-4">
                What Happens Next?
              </h3>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-small font-bold flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="text-body font-medium text-foreground">
                      Confirmation Call
                    </p>
                    <p className="text-small text-foreground-muted">
                      We'll call to verify your address and installation requirements
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-small font-bold flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="text-body font-medium text-foreground">
                      Installation Day
                    </p>
                    <p className="text-small text-foreground-muted">
                      Our certified technician will install your purifier (takes ~45 mins)
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-small font-bold flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="text-body font-medium text-foreground">
                      First Payment
                    </p>
                    <p className="text-small text-foreground-muted">
                      Your first monthly payment will be collected after successful installation
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/app"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
            >
              Go to My Dashboard
            </Link>
            <Link
              href="/support"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-primary text-primary font-semibold rounded-btn hover:bg-primary/5 transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with Support
            </Link>
          </div>

          {/* Help */}
          <div className="mt-8 text-center">
            <p className="text-small text-foreground-muted">
              Questions? Call us at{" "}
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="text-primary font-medium"
              >
                {siteConfig.phone}
              </a>{" "}
              or email{" "}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary font-medium">
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
