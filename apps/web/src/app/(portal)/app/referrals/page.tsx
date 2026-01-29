"use client";

import { useState } from "react";
import {
  Gift,
  Copy,
  Share2,
  CheckCircle2,
  Users,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, EmptyState, Skeleton } from "@/components/ui";
import { track } from "@/utils/analytics";
import { siteConfig } from "@/data/content";
import { useReferralCode } from "@/hooks/use-api";

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const referralCodeQuery = useReferralCode();
  const code = referralCodeQuery.data?.code || "";

  const shareUrl = `${siteConfig.url}/plans?ref=${encodeURIComponent(code)}`;

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    track("referral_copied", { code });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    const shareData = {
      title: "Get ₹500 off on Ashva Experts",
      text: `Use my referral code ${code} to get a discount on your first month!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        track("referral_shared", { method: "native" });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-foreground">
          Refer & Earn
        </h1>
        <p className="text-body text-foreground-muted mt-1">
          Share the gift of pure water and earn rewards
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="bg-gradient-to-r from-primary to-accent text-white overflow-hidden">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-small text-white/80">Your Referral Code</p>
              <div className="flex items-center gap-3 mt-2">
                {referralCodeQuery.isLoading ? (
                  <Skeleton className="h-10 w-44 bg-white/20" />
                ) : (
                  <span className="text-h2 font-heading font-bold tracking-wider">
                    {code || "—"}
                  </span>
                )}
                <button
                  onClick={handleCopyCode}
                  disabled={!code}
                  className="p-2 rounded-btn bg-white/20 hover:bg-white/30 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-small text-white/80 mt-2">
                Share this code with friends and family.
              </p>
            </div>
            <Button
              onClick={handleShare}
              disabled={!code}
              className="bg-white text-primary hover:bg-white/90"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {referralCodeQuery.isError ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Gift}
              title="Referrals not available"
              message="We couldn't load your referral code right now. Please retry or chat with support."
              primaryCta={{ label: "Retry", onClick: () => referralCodeQuery.refetch() }}
              secondaryCta={{
                label: "Chat on WhatsApp",
                href: `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                  "Hi Ashva Experts! I can't access my referral code in the portal. Please help."
                )}`,
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-body font-medium text-foreground">Referral stats coming soon</p>
              <p className="text-small text-foreground-muted mt-1">
                We'll show your referral count and earned credits here once the backend history is enabled.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: "Share Your Code", desc: "Share your unique referral code with friends and family" },
              { step: 2, title: "They Subscribe", desc: "When they subscribe using your code, they get ₹500 off" },
              { step: 3, title: "You Earn", desc: "Once their installation is complete, you earn ₹500" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h4 className="text-body font-semibold text-foreground mt-3">
                  {item.title}
                </h4>
                <p className="text-small text-foreground-muted mt-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Users}
            title="History coming soon"
            message="Your referral history will appear here once it is enabled."
            primaryCta={
              code
                ? {
                    label: "Copy Code",
                    onClick: handleCopyCode,
                  }
                : {
                    label: "Retry",
                    onClick: () => referralCodeQuery.refetch(),
                  }
            }
            secondaryCta={{ label: "View Plans", href: `/plans${code ? `?ref=${encodeURIComponent(code)}` : ""}` }}
          />
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardContent className="py-4">
          <p className="text-small text-foreground-muted">
            <strong>Terms:</strong> Referral rewards are credited after the referred customer 
            completes their first month of subscription. Maximum 10 referrals per month. 
            Rewards can be used as bill credits or withdrawn to bank account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
