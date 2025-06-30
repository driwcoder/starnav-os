// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { UserRole } from "@prisma/client";

// Schema de validação para o ID (comum para GET e PUT)
const idSchema = z.string().uuid("ID de usuário inválido.");

// Schema de Validação para a API de Atualização (PUT)
const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email("Formato de e-mail inválido.").endsWith("@starnav.com.br", "O e-mail deve ser @starnav.com.br.").optional(),
  role: z.nativeEnum(UserRole, {
    required_error: "O papel do usuário é obrigatório.",
  }).optional(),
});

// Handler para Requisições GET por ID
export async function GET(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

    // 1. Proteção de Rota (Autenticação e Permissão de ADMIN)
    const session = await getServerSession(authOptions);
    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true },
    });
    if (currentUser?.role !== UserRole.ADMIN) {
      return new NextResponse("Acesso negado. Apenas administradores podem visualizar usuários.", { status: 403 });
    }

    // 2. Validação do ID
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID de usuário inválido.", { status: 400 });
    }

    // 3. Busca o Usuário específico no Banco de Dados
    const user = await prisma.user.findUnique({
      where: { id: validatedId.data },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      return new NextResponse("Usuário não encontrado.", { status: 404 });
    }

    // 4. Resposta de Sucesso
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error);
    return new NextResponse("Erro interno do servidor ao buscar usuário.", { status: 500 });
  }
}

// Handler para Requisições PUT (Atualização de Usuário)
export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

    // 1. Proteção de Rota (Autenticação e Permissão de ADMIN)
    const session = await getServerSession(authOptions);
    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true },
    });
    if (currentUser?.role !== UserRole.ADMIN) {
      return new NextResponse("Acesso negado. Apenas administradores podem editar usuários.", { status: 403 });
    }

    // 2. Validação do ID
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID de usuário inválido para atualização.", { status: 400 });
    }

    const body = await request.json();

    // 3. Validação dos dados de entrada com Zod
    const validatedData = updateUserSchema.safeParse(body);

    if (!validatedData.success) {
        console.error("Erro de validação na API de atualização de usuário:", validatedData.error.errors);
        return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const { email, ...dataToUpdate } = validatedData.data;

    const updatedUser = await prisma.user.update({
      where: { id: validatedId.data },
      data: {
        ...dataToUpdate,
        role: dataToUpdate.role as UserRole | undefined,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return new NextResponse("Erro interno do servidor ao atualizar usuário.", { status: 500 });
  }
}

// Handler para Requisições DELETE (Exclusão de Usuário)
export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({ // Adicionado para verificar o role do admin logado
      where: { email: session.user.email as string },
      select: { id: true, role: true }, // Obter também o ID do usuário logado
    });

    if (currentUser?.role !== UserRole.ADMIN) {
      return new NextResponse("Acesso negado. Apenas administradores podem excluir usuários.", { status: 403 });
    }

    // Não permite que o admin logado exclua a si mesmo
    if (currentUser.id === id) {
        return new NextResponse("Você não pode excluir sua própria conta.", { status: 403 });
    }

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID de usuário inválido para exclusão.", { status: 400 });
    }

    await prisma.user.delete({
      where: { id: validatedId.data },
    });

    return new NextResponse("Usuário excluído com sucesso.", { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
        return new NextResponse("Usuário não encontrado para exclusão.", { status: 404 });
    }
    console.error("Erro ao excluir usuário:", error);
    return new NextResponse("Erro interno do servidor ao excluir usuário.", { status: 500 });
  }
}