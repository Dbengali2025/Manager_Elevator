import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/reset-password"];

// Routes that are only for non-authenticated users (redirect to dashboard if logged in)
const AUTH_ONLY_ROUTES = ["/login", "/signup", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const hasAuth = !!accessToken;
  const hasRefresh = !!refreshToken;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If user has an access token and tries to visit auth-only pages, redirect to dashboard
  if (hasAuth && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user has no access token but has a refresh token, try to continue
  // (the actual refresh happens server-side when making API calls)
  // If they have neither token and are trying to access a protected route, redirect to login
  if (!hasAuth && !isPublicRoute) {
    if (hasRefresh) {
      // Let the request through — server actions will attempt to refresh the token
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
