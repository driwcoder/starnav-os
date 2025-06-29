// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      // Garante que o usuário esteja logado (tenha um token)
      // E que o email no token termine com "@starnav.com.br"
      return !!token && (token.email as string)?.endsWith("@starnav.com.br");
    },
  },
});

export const config = {
  // Protege todas as rotas exceto /login, rotas da API de autenticação e arquivos estáticos.
  matcher: ["/", "/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};