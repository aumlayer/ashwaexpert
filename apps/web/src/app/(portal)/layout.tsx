"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  CreditCard,
  Droplets,
  Wrench,
  Gift,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/app", icon: Home },
  { name: "Subscription", href: "/app/subscription", icon: Droplets },
  { name: "Payments", href: "/app/payments", icon: CreditCard },
  { name: "Service", href: "/app/service", icon: Wrench },
  { name: "Add-ons", href: "/app/addons", icon: Gift },
  { name: "Profile", href: "/app/profile", icon: User },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoggingOut, isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const returnTo = pathname || "/app";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (user?.role === "admin") {
      router.replace("/admin");
      return;
    }
    if (user?.role === "technician") {
      router.replace("/tech");
    }
  }, [isAuthenticated, isLoading, router, returnTo, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="text-foreground-muted text-small">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="text-foreground-muted text-small">Redirecting...</div>
      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="text-foreground-muted text-small">Redirecting...</div>
      </div>
    );
  }

  if (user?.role === "technician") {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="text-foreground-muted text-small">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link href="/app" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-body font-heading font-bold text-foreground">
                Ashva Experts
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-btn hover:bg-surface-2"
            >
              <X className="h-5 w-5 text-foreground-muted" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-btn text-small font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-small font-medium text-foreground truncate">
                  {user?.name || "Customer"}
                </p>
                <p className="text-caption text-foreground-muted truncate">
                  {user?.phone || "+91 XXXXXXXXXX"}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-btn text-small font-medium text-foreground-muted hover:bg-surface-2 hover:text-foreground transition-colors disabled:opacity-50"
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
        <header className="sticky top-0 z-30 h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-btn hover:bg-surface-2"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-body font-semibold text-foreground">
              {navigation.find((n) => n.href === pathname)?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-btn hover:bg-surface-2">
              <Bell className="h-5 w-5 text-foreground-muted" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </button>

            {/* Help */}
            <Link
              href="/support"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-small text-foreground-muted hover:text-foreground"
            >
              Need help?
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
