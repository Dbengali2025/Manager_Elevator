import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/reset-password"];

// Routes that are only for non-authenticated users (redirect to dashboard if logged in)
const AUTH_ONLY_ROUTES = ["/login", "/signup", "/reset-password"];

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY ?? "";

/**
 * Attempt to refresh the access token using the refresh token.
 * Returns { accessToken, refreshToken } on success, null on failure.
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  try {
    const res = await fetch(`${INSFORGE_URL}/api/auth/refresh?client_type=mobile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: INSFORGE_API_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.accessToken) return null;

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Reject tokens that are obviously unusable — not a JWT, no subject, or past
 * their expiry — without a network round-trip.
 *
 * This deliberately does NOT verify the signature: the signing secret is not
 * available here. It is a routing guard, not the security boundary. Every
 * server action independently validates the token against Insforge before
 * touching data, and row-level security backs that up in the database. What
 * this does buy is that an arbitrary or stale cookie value no longer renders
 * the authenticated shell, and an expired token now correctly falls through to
 * the refresh path instead of being waved through.
 */
function isUsableToken(token: string | undefined): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      atob(padded + "=".repeat((4 - (padded.length % 4)) % 4))
    );

    if (!payload?.sub) return false;
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const hasAuth = isUsableToken(accessToken);
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

  // If user has no access token but has a refresh token, attempt to refresh NOW
  // so all downstream server actions get a valid token
  if (!hasAuth && hasRefresh && !isPublicRoute) {
    const tokens = await refreshAccessToken(refreshToken);

    if (tokens) {
      // Refresh succeeded — set the new cookies on the response
      const response = NextResponse.next();
      const isProduction = process.env.NODE_ENV === "production";

      response.cookies.set("access_token", tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });

      if (tokens.refreshToken) {
        response.cookies.set("refresh_token", tokens.refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      return response;
    }

    // Refresh failed — redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // No auth at all and trying to access a protected route — redirect to login
  if (!hasAuth && !hasRefresh && !isPublicRoute) {
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
