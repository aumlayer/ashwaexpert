"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Globe,
  CreditCard,
  Mail,
  Smartphone,
  Users,
  Key,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui";
import { siteConfig } from "@/data/content";

const settingsSections = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "api", label: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Settings</h1>
          <p className="text-body text-gray-400">
            Manage your application settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
        <div className="text-small text-gray-300">
          Settings are currently not persisted. This screen is using sample values until admin settings APIs are available.
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-[#1E293B] rounded-xl border border-[#334155] p-2">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-small font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-[#334155] hover:text-white"
                }`}
              >
                <section.icon className="h-5 w-5" />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === "general" && (
            <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
              <div className="p-4 border-b border-[#334155]">
                <h2 className="text-h4 font-heading font-bold">General Settings</h2>
              </div>
              <div className="p-4 space-y-6">
                {/* Company Info */}
                <div>
                  <h3 className="text-body font-semibold mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-small text-gray-400 mb-1.5">Company Name</label>
                      <input
                        type="text"
                        defaultValue={siteConfig.name}
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-small focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-small text-gray-400 mb-1.5">Support Email</label>
                      <input
                        type="email"
                        defaultValue={siteConfig.supportEmail}
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-small focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-small text-gray-400 mb-1.5">Support Phone</label>
                      <input
                        type="tel"
                        defaultValue={siteConfig.phone}
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-small focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-small text-gray-400 mb-1.5">Timezone</label>
                      <select className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-small focus:outline-none focus:border-primary">
                        <option>Asia/Kolkata (IST)</option>
                        <option>UTC</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Service Areas */}
                <div>
                  <h3 className="text-body font-semibold mb-4">Service Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Bangalore", "Hyderabad", "Mumbai", "Chennai", "Delhi NCR", "Pune"].map((city) => (
                      <span
                        key={city}
                        className="px-3 py-1.5 bg-[#334155] rounded-lg text-small text-gray-300"
                      >
                        {city}
                      </span>
                    ))}
                    <button className="px-3 py-1.5 border border-dashed border-[#334155] rounded-lg text-small text-gray-400 hover:border-primary hover:text-primary">
                      + Add City
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
              <div className="p-4 border-b border-[#334155]">
                <h2 className="text-h4 font-heading font-bold">Notification Settings</h2>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { id: "new_lead", label: "New Lead Alerts", desc: "Get notified when a new lead is captured" },
                  { id: "payment_failed", label: "Failed Payment Alerts", desc: "Alert when a payment fails" },
                  { id: "sla_breach", label: "SLA Breach Alerts", desc: "Alert when tickets breach SLA" },
                  { id: "low_stock", label: "Low Stock Alerts", desc: "Alert when inventory is low" },
                  { id: "daily_summary", label: "Daily Summary", desc: "Receive daily business summary" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-[#334155] last:border-0">
                    <div>
                      <p className="text-body font-medium">{item.label}</p>
                      <p className="text-small text-gray-400">{item.desc}</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-primary transition-colors">
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
              <div className="p-4 border-b border-[#334155]">
                <h2 className="text-h4 font-heading font-bold">Security Settings</h2>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-body font-semibold mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                    <div>
                      <p className="text-body font-medium">2FA Status</p>
                      <p className="text-small text-gray-400">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" className="border-[#334155]">Enable 2FA</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-body font-semibold mb-4">Session Management</h3>
                  <div className="p-4 bg-[#0F172A] rounded-lg">
                    <p className="text-small text-gray-400 mb-3">Active sessions: 2</p>
                    <Button variant="outline" size="sm" className="border-[#334155] text-red-400 hover:bg-red-500/20">
                      Sign out all other sessions
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
              <div className="p-4 border-b border-[#334155]">
                <h2 className="text-h4 font-heading font-bold">Billing Settings</h2>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-body font-semibold mb-4">Payment Gateway</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-small text-gray-400 mb-1.5">Razorpay Key ID</label>
                      <input
                        type="text"
                        defaultValue="rzp_live_xxxxx"
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-small focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-small text-gray-400 mb-1.5">Razorpay Secret</label>
                      <input
                        type="password"
                        defaultValue="••••••••••••"
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-small focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-body font-semibold mb-4">Invoice Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-small text-gray-400 mb-1.5">Invoice Prefix</label>
                      <input
                        type="text"
                        defaultValue="INV-"
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-small focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-small text-gray-400 mb-1.5">GST Number</label>
                      <input
                        type="text"
                        defaultValue="29AAAAA0000A1Z5"
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-small focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "team" && (
            <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
              <div className="p-4 border-b border-[#334155] flex items-center justify-between">
                <h2 className="text-h4 font-heading font-bold">Team Members</h2>
                <Button size="sm">Invite Member</Button>
              </div>
              <div className="divide-y divide-[#334155]">
                {[
                  { name: "Admin User", email: "admin@ashvaexperts.com", role: "Owner" },
                  { name: "Support Team", email: siteConfig.supportEmail, role: "Admin" },
                  { name: "Sales Team", email: "sales@ashvaexperts.com", role: "Member" },
                ].map((member) => (
                  <div key={member.email} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center">
                        <span className="text-small font-medium">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-body font-medium">{member.name}</p>
                        <p className="text-small text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-[#334155] rounded text-caption text-gray-300">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "api" && (
            <div className="bg-[#1E293B] rounded-xl border border-[#334155]">
              <div className="p-4 border-b border-[#334155] flex items-center justify-between">
                <h2 className="text-h4 font-heading font-bold">API Keys</h2>
                <Button size="sm">Generate New Key</Button>
              </div>
              <div className="p-4">
                <div className="p-4 bg-[#0F172A] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-body font-medium">Production API Key</p>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-caption">Active</span>
                  </div>
                  <code className="text-small text-gray-400 font-mono">ask_live_••••••••••••••••</code>
                  <p className="text-caption text-gray-500 mt-2">Created on Jan 15, 2024</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
