import { NextResponse } from 'next/server';

/**
 * @param {import('next/server').NextRequest} request
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;

    const sessionId = request.cookies.get('session_id')?.value;
    const isAuthenticated = !!sessionId;

    if (isAuthenticated && (pathname === '/login' || pathname === '/cadastro')) {
        console.log("Redirecionando usuário autenticado para /");
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).)',
    ],
};