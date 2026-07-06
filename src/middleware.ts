import { NextRequest, NextResponse } from "next/server";

// Exposes the current pathname to server components (via a request header) so
// the app layout can enforce per-module route authorization centrally.
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    // Run on app pages, skip static assets and API routes.
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
