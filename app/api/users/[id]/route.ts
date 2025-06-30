// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { UserRole } from "@prisma/client";

const idSchema = z.string().uuid("ID de usuário inválido.");

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email("Formato de e-mail inválido.").endsWith("@starnav.com.br", "O e-mail deve ser @starnav.com.br.").optional(),
  role: z.nativeEnum(UserRole, {
    required_error: "O papel do usuário é obrigatório.",
  }).optional(),
});

export async function GET(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

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

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID de usuário inválido.", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: validatedId.data },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      return new NextResponse("Usuário não encontrado.", { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error);
    return new NextResponse("Erro interno do servidor ao buscar usuário.", { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

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

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID de usuário inválido para atualização.", { status: 400 });
    }

    const body = await request.json();

    const validatedData = updateUserSchema.safeParse(body);

    if (!validatedData.success) {
        console.error("Erro de validação na API de atualização de usuário:", validatedData.error.errors);
        return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, ...dataToUpdate } = validatedData.data; // Adicione o comentário ou remova a desestruturação se 'email' não for necessário para nada aqui

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