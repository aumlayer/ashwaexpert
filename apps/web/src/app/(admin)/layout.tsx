"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Droplets,
  Package,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  BarChart3,
  Tag,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Plans & Pricing", href: "/admin/plans", icon: Tag },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: Droplets },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Service Tickets", href: "/admin/tickets", icon: Wrench },
  { name: "Inventory", href: "/admin/inventory", icon: Package },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { name: "Content", href: "/admin/content", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut, isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const returnTo = pathname || "/admin";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-white/80 text-small">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-xl p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-h4 font-heading font-bold">Admin access required</h1>
              <p className="text-small text-gray-400 mt-1">
                Please sign in to continue.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Link
              href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-small font-medium"
            >
              Go to Login
            </Link>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#334155] text-gray-300 text-small font-medium hover:bg-[#334155]"
            >
              Back to Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-xl p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-h4 font-heading font-bold">Not authorized</h1>
              <p className="text-small text-gray-400 mt-1">
                Your account doesn’t have admin permissions.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-small font-medium disabled:opacity-50"
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
            <Link
              href="/app"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#334155] text-gray-300 text-small font-medium hover:bg-[#334155]"
            >
              Go to App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1E293B] border-r border-[#334155] transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-[#334155]">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <span className="text-body font-heading font-bold text-white">
                  Ashva Admin
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-[#334155]"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-small font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "text-gray-400 hover:bg-[#334155] hover:text-white hover:translate-x-1"
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <item.icon className="h-5 w-5" />
                    </motion.div>
                    {item.name}
                    {isActive && (
                      <motion.div
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                        layoutId="activeIndicator"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[#334155]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-small font-medium text-white truncate">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-caption text-gray-400 truncate">
                  Administrator
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-small font-medium text-gray-400 hover:bg-[#334155] hover:text-white transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#334155]"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>

            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#0F172A] rounded-lg border border-[#334155]">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-small text-white placeholder:text-gray-500 w-48"
              />
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-caption text-gray-500 bg-[#334155] rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-[#334155]">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Quick actions */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-small text-gray-400 hover:text-white"
            >
              View Site →
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 text-white">{children}</main>
      </div>
    </div>
  );
}
