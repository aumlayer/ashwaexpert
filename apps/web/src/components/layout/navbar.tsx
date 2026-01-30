"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Phone, User } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";
import { siteConfig } from "@/data/content";

const navLinks = [
  { href: "/plans", label: "Plans" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/service-promise", label: "Service Promise" },
  { href: "/support", label: "Support" },
];

export function Navbar() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-standard ease-out-expo",
        isScrolled
          ? "bg-surface/95 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-4"
      )}
    >
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-h4 font-heading font-bold text-primary">
              Ashva Experts
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body font-medium text-foreground-muted hover:text-primary transition-colors duration-micro"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-small font-medium text-foreground-muted hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>Call Us</span>
            </a>
            <Link
              href="/login"
              className="flex items-center gap-2 text-small font-medium text-foreground-muted hover:text-primary transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Login</span>
            </Link>
            <Button size="sm" onClick={() => router.push("/check-availability")}>
              Check Availability
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <div className="flex flex-col gap-4 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-body font-medium text-foreground-muted hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="flex items-center gap-2 text-body font-medium text-foreground-muted hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Login
              </Link>
              <Button
                className="mt-2"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/check-availability");
                }}
              >
                Check Availability
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
