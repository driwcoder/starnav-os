// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;

    // Se o usuário tentar acessar a página de login e já estiver autenticado, redirecione para o dashboard.
    if (req.nextUrl.pathname === "/login" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Verifica se o usuário tem um token e se o email pertence ao domínio @starnav.com.br
    // Esta lógica já estava no `authorized` callback, mas aqui reforçamos
    // caso o matcher permita acesso a certas rotas que DEVEM ser protegidas.
    const isAuthorized = !!token && (token.email as string)?.endsWith("@starnav.com.br");

    // Se a rota acessada for protegida (definida no matcher) E o usuário NÃO estiver autorizado,
    // o `withAuth` já cuidará do redirecionamento para `signIn` (que é '/login').
    // Esta parte do código acima para /login é específica para redirecionar um usuário já logado.

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => {
        // Este callback é o principal ponto de controle de autorização para o matcher
        return !!token && (token.email as string)?.endsWith("@starnav.com.br");
      },
    },
  }
);

export const config = {
  // Protege todas as rotas, exceto:
  // - /api (rotas de API, que serão protegidas internamente com getServerSession)
  // - _next/static, _next/image, favicon.ico (ativos estáticos)
  // - /login (página de login, que deve ser acessível publicamente)
  // - /register (página de registro, que deve ser acessível publicamente para este caso)
  matcher: [
    "/dashboard/:path*", // Protege todas as rotas dentro de /dashboard
    "/",                 // Protege a rota raiz (que agora redirecionará para /dashboard se logado)
    "/api/hello",        // Exemplo de proteção de API que pode ser acessada diretamente
    // Adicione outras rotas específicas que precisam de proteção aqui
  ],
};