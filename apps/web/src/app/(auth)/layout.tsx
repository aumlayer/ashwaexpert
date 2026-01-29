import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-2 flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-accent to-mint">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1200&h=1600&fit=crop"
            alt="Pure water"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-h4 font-heading font-bold">Ashva Experts</span>
            </Link>
          </div>

          <div className="max-w-md">
            <h1 className="text-h1 font-heading font-bold leading-tight">
              Pure Water, Zero Hassle
            </h1>
            <p className="mt-4 text-body-lg text-white/90">
              Join 50,000+ families enjoying clean, healthy water with our subscription service. 
              Free installation, maintenance included.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-card p-4">
                <p className="text-h3 font-heading font-bold">₹399</p>
                <p className="text-small text-white/80">Starting price/month</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-card p-4">
                <p className="text-h3 font-heading font-bold">48hrs</p>
                <p className="text-small text-white/80">Installation time</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-small text-white/70">
            <span>© 2024 Ashva Experts</span>
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
