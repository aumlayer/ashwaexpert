import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Get subdomain from hostname
  const subdomain = getSubdomain(hostname);

  // Subdomain routing
  if (subdomain === "admin") {
    // Rewrite admin.domain.com to /admin routes
    if (!pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    }
  }

  if (subdomain === "cms") {
    // Rewrite cms.domain.com to /cms routes
    if (!pathname.startsWith("/cms")) {
      return NextResponse.rewrite(new URL(`/cms${pathname}`, request.url));
    }
  }

  if (subdomain === "app" || subdomain === "portal") {
    // Rewrite app.domain.com to /app routes
    if (!pathname.startsWith("/app")) {
      return NextResponse.rewrite(new URL(`/app${pathname}`, request.url));
    }
  }

  // Auth guards for protected routes
  const protectedPaths = ["/app", "/admin", "/cms"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // Check for auth token in cookies
    const authToken = request.cookies.get("auth_token");

    if (!authToken) {
      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // TODO: Validate token and check role permissions
    // For admin routes, verify admin role
    // For cms routes, verify editor/admin role
  }

  // Add correlation ID header for API requests
  const response = NextResponse.next();
  response.headers.set("x-correlation-id", crypto.randomUUID());

  return response;
}

function getSubdomain(hostname: string): string | null {
  // Handle localhost
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return null;
  }

  // Extract subdomain from hostname
  const parts = hostname.split(".");
  if (parts.length > 2) {
    const subdomain = parts[0];
    // Ignore www
    if (subdomain !== "www") {
      return subdomain;
    }
  }

  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
