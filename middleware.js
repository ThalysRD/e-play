import { NextResponse } from 'next/server';

/**
 * @param {import('next/server').NextRequest} request
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get('session_id')?.value;
  const isAuthenticated = !!sessionId;

  // Rotas que só usuários não autenticados podem acessar
  const publicOnlyRoutes = ['/login', '/cadastro'];
  // Rotas que precisam de autenticação
  const protectedRoutes = ['/item/criar', '/configuracoes', '/carrinho'];

  // Se está autenticado e tentando acessar página pública (login/cadastro)
  if (isAuthenticated && publicOnlyRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Se NÃO está autenticado e tentando acessar página protegida
  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/cadastro', '/item/criar', '/configuracoes/:path*', '/carrinho'],
};