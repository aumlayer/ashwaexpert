import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/data/content";

const footerLinks = {
  product: [
    { href: "/plans", label: "Plans & Pricing" },
    { href: "/purifiers", label: "Purifiers" },
    { href: "/recommend", label: "Find Your Purifier" },
    { href: "/how-it-works", label: "How It Works" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/service-promise", label: "Service Promise" },
    { href: "/corporate", label: "For Business" },
    { href: "/support", label: "Support" },
  ],
  legal: [
    { href: "/legal/terms", label: "Terms of Service" },
    { href: "/legal/privacy", label: "Privacy Policy" },
    { href: "/legal/cancellation", label: "Cancellation Policy" },
    { href: "/legal/refund", label: "Refund Policy" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-surface-2 border-t border-border">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Contact */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-h4 font-heading font-bold text-primary">
                Ashva Experts
              </span>
            </Link>
            <p className="mt-4 text-body text-foreground-muted max-w-sm">
              Pure water on subscription. Installation, maintenance, and filter
              replacement included. Pay monthly.
            </p>
            <div className="mt-6 space-y-3">
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 text-small text-foreground-muted hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>{siteConfig.phone}</span>
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-3 text-small text-foreground-muted hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>{siteConfig.email}</span>
              </a>
              <div className="flex items-start gap-3 text-small text-foreground-muted">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {siteConfig.address.city}, {siteConfig.address.state}, {siteConfig.address.country}
                </span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-small font-semibold text-foreground mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-small font-semibold text-foreground mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-small font-semibold text-foreground mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-caption text-foreground-muted text-center">
            © {new Date().getFullYear()} Ashva Experts. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
