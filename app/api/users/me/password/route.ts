// app/api/users/me/password/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as z from "zod";

// Schema de validação para a alteração de senha pelo próprio usuário
const changeMyPasswordSchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória."),
  newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres."),
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "A nova senha não pode ser igual à senha atual.",
  path: ["newPassword"],
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Proteção de Rota: Apenas usuários logados e autorizados podem alterar sua senha
    if (!session || !session.user?.id || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Você precisa estar logado.", { status: 401 });
    }

    const body = await request.json();
    // 2. Validação das senhas com Zod
    const validatedData = changeMyPasswordSchema.safeParse(body);

    if (!validatedData.success) {
      console.error("Erro de validação na API de alteração de senha:", validatedData.error.errors);
      return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const { currentPassword, newPassword } = validatedData.data;

    // 3. Busca o usuário no banco de dados para verificar a senha atual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      // Isso não deveria acontecer se a sessão for válida, mas é um fallback seguro
      return new NextResponse("Usuário não encontrado.", { status: 404 });
    }

    // 4. Compara a senha atual fornecida com o hash no DB
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return new NextResponse("Senha atual incorreta.", { status: 400 });
    }

    // 5. Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 6. Atualiza a senha no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
      },
    });

    return NextResponse.json({ message: "Senha alterada com sucesso." }, { status: 200 });
  } catch (error) {
    console.error("Erro ao alterar senha do usuário:", error);
    return new NextResponse("Erro interno do servidor ao alterar senha.", { status: 500 });
  }
}