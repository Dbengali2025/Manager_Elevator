import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Recovery route for dead sessions. When the backend rejects both the access
// and refresh tokens (revoked server-side but not yet expired), server pages
// cannot clear cookies during render — redirecting straight to /login would
// bounce back to /dashboard because the middleware only checks the token's
// expiry. This route CAN clear cookies, breaking the redirect loop.
export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("csrf_token");
  return NextResponse.redirect(new URL("/login", request.url));
}
