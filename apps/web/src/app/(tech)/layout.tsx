"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, ClipboardList, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "My Assignments", href: "/tech", icon: ClipboardList },
];

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoggingOut, isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const returnTo = pathname || "/tech";

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

    if (user?.role !== "technician") {
      router.replace("/app");
    }
  }, [isAuthenticated, isLoading, router, returnTo, user?.role]);

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-white/80 text-small">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "technician") {
    return (
      <div className="dark min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-white/80 text-small">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-[#0B1220] text-white">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] border-r border-[#1F2937] transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-[#1F2937]">
            <Link href="/tech" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="text-body font-heading font-bold text-white">Technician</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-white/5"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-small font-medium transition-colors ${
                    isActive ? "bg-primary text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#1F2937]">
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-small font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-[#0F172A] border-b border-[#1F2937] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-body font-semibold">{navigation.find((n) => n.href === pathname)?.name || "Technician"}</h1>
          </div>
          <div className="text-small text-white/70 truncate max-w-[50%]">
            {user?.email || user?.phone || ""}
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
