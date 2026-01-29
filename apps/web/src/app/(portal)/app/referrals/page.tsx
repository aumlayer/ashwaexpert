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
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { track } from "@/utils/analytics";
import { siteConfig } from "@/data/content";

// Mock data
const referralData = {
  code: "PRIYA2024",
  totalReferrals: 5,
  successfulReferrals: 3,
  pendingReferrals: 2,
  totalEarnings: 1500,
  pendingEarnings: 1000,
  rewardPerReferral: 500,
};

const referralHistory = [
  { id: "1", name: "Rajesh K.", status: "completed", date: "Jan 25, 2024", reward: 500 },
  { id: "2", name: "Anita P.", status: "completed", date: "Jan 20, 2024", reward: 500 },
  { id: "3", name: "Vikram S.", status: "completed", date: "Jan 15, 2024", reward: 500 },
  { id: "4", name: "Meera K.", status: "pending", date: "Jan 28, 2024", reward: 500 },
  { id: "5", name: "Suresh R.", status: "pending", date: "Jan 27, 2024", reward: 500 },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralData.code);
    setCopied(true);
    track("referral_copied", { code: referralData.code });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Get ₹500 off on Ashva Experts",
      text: `Use my referral code ${referralData.code} to get ₹500 off on your first month!`,
      url: `${siteConfig.url}/plans?ref=${referralData.code}`,
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
                <span className="text-h2 font-heading font-bold tracking-wider">
                  {referralData.code}
                </span>
                <button
                  onClick={handleCopyCode}
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
                Share this code and earn ₹{referralData.rewardPerReferral} for each successful referral
              </p>
            </div>
            <Button
              onClick={handleShare}
              className="bg-white text-primary hover:bg-white/90"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-small text-foreground-muted">Total Referrals</p>
                <p className="text-h3 font-heading font-bold text-foreground">
                  {referralData.totalReferrals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-small text-foreground-muted">Successful</p>
                <p className="text-h3 font-heading font-bold text-success">
                  {referralData.successfulReferrals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-small text-foreground-muted">Total Earned</p>
                <p className="text-h3 font-heading font-bold text-foreground">
                  ₹{referralData.totalEarnings}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          {referralHistory.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <p className="text-body font-medium text-foreground">No referrals yet</p>
              <p className="text-small text-foreground-muted mt-1">
                Share your code to start earning rewards
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralHistory.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center">
                      <span className="text-small font-medium text-foreground">
                        {referral.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-body font-medium text-foreground">{referral.name}</p>
                      <p className="text-small text-foreground-muted">{referral.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={referral.status === "completed" ? "success" : "default"}>
                      {referral.status}
                    </Badge>
                    <p className="text-body font-semibold text-foreground mt-1">
                      {referral.status === "completed" ? `+₹${referral.reward}` : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
