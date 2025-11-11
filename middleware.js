import { NextResponse } from "next/server";

/**
 * @param {import('next/server').NextRequest} request
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get("session_id")?.value;
  const isAuthenticated = !!sessionId;

  const publicOnlyRoutes = ["/login", "/cadastro"];
  const protectedRoutes = ["/item/criar", "/configuracoes"];

  if (isAuthenticated && publicOnlyRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    !isAuthenticated &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/cadastro",
    "/item/criar",
    "/configuracoes/:path*",
    "/carrinho",
  ],
};
