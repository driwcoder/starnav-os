// app/api/users/[id]/password/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { UserRole } from "@prisma/client";

// Schema de validação para a nova senha
const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres."),
});

// Schema de validação para o ID do usuário
const userIdSchema = z.string().uuid("ID de usuário inválido.");

export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string; // ID do usuário que terá a senha alterada

    const session = await getServerSession(authOptions);

    // 1. Proteção de Rota: Apenas ADMIN pode redefinir senhas
    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true },
    });
    if (currentUser?.role !== UserRole.ADMIN) {
      return new NextResponse("Acesso negado. Apenas administradores podem redefinir senhas.", { status: 403 });
    }

    // 2. Validação do ID do usuário a ser alterado
    const validatedUserId = userIdSchema.safeParse(id);
    if (!validatedUserId.success) {
      return new NextResponse("ID de usuário inválido para redefinição de senha.", { status: 400 });
    }

    const body = await request.json();
    // 3. Validação da nova senha
    const validatedData = updatePasswordSchema.safeParse(body);

    if (!validatedData.success) {
      console.error("Erro de validação da nova senha:", validatedData.error.errors);
      return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const { newPassword } = validatedData.data;

    // 4. Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Atualiza a senha no banco de dados
    const updatedUser = await prisma.user.update({
      where: { id: validatedUserId.data },
      data: {
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true }, // Retorna apenas dados básicos do usuário
    });

    return NextResponse.json({ message: "Senha atualizada com sucesso.", user: updatedUser }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new NextResponse("Usuário não encontrado para redefinição de senha.", { status: 404 });
    }
    console.error("Erro ao redefinir senha do usuário:", error);
    return new NextResponse("Erro interno do servidor ao redefinir senha.", { status: 500 });
  }
}