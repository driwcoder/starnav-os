// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;

    if (req.nextUrl.pathname === "/auth/login" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const isAuthorized = !!token && (token.email as string)?.endsWith("@starnav.com.br");

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/login",
    },
    callbacks: {
      authorized: ({ token }) => {
        return !!token && (token.email as string)?.endsWith("@starnav.com.br");
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/",
    "/api/users/:path*",
    "/api/service-orders/:path*",
    "/profile", // ✅ Adiciona proteção para a página de perfil
    "/api/users/me/:path*", // ✅ Adiciona proteção para as APIs do próprio usuário
    // Adicione outras rotas específicas que precisam de proteção aqui
  ],
};