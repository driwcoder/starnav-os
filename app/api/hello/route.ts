// app/api/hello/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth"; // Importe as opções de autenticação

export async function GET() {
  const session = await getServerSession(authOptions);

  // 1. Verifica se há sessão (usuário logado)
  if (!session) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  // 2. Opcional: Verifica se o email da sessão pertence ao domínio permitido
  // Embora o middleware já faça isso para rotas de página, é uma camada extra para APIs.
  if (!(session.user?.email as string)?.endsWith("@starnav.com.br")) {
    return new NextResponse("Acesso negado: domínio de email inválido.", { status: 403 });
  }

  return NextResponse.json({ message: "Dados confidenciais acessados!", user: session.user });
}