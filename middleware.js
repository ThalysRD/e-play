import { NextResponse } from "next/server";
import { resolveHostname } from "nodemailer/lib/shared";

export function middleware(request) {
    const token = request.cookies.get('authToken')?.value;
    const { pathname } = request.nextUrl;

    if (token && (pathname.startsWith("/login") || pathname.startsWith("/cadastro"))) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login', '/cadastro'],
};