// app/api/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { UserRole } from "@prisma/client";

// Schema de Validação para a API (Zod)
const createUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().endsWith("@starnav.com.br", "O e-mail deve ser @starnav.com.br."),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole, {
    required_error: "O papel do usuário é obrigatório.",
  }),
});

// Handler para Requisições POST (Criação de Usuário)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true },
    });
    if (currentUser?.role !== UserRole.ADMIN) {
      return new NextResponse("Acesso negado. Apenas administradores podem criar usuários.", { status: 403 });
    }

    const body = await request.json();

    const validatedData = createUserSchema.safeParse(body);

    if (!validatedData.success) {
      console.error("Erro de validação na API de criação de usuário:", validatedData.error.errors);
      return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const { name, email, password, role } = validatedData.data;

    if (email === process.env.ROOT_ADMIN_EMAIL) { // Protege o admin root de ser criado via API
      return new NextResponse("Não é possível criar o usuário ROOT_ADMIN_EMAIL via API.", { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("Usuário com este email já existe.", { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return new NextResponse("Erro interno do servidor ao criar usuário.", { status: 500 });
  }
}

// Handler para Requisições GET (Lista todos os usuários - para a página de listagem)
export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true },
    });
    if (currentUser?.role !== UserRole.ADMIN) {
      return new NextResponse("Acesso negado. Apenas administradores podem ver a lista de usuários.", { status: 403 });
    }

    const url = new URL(_request.url);
    const query = url.searchParams.get('query') || '';
    const roleFilter = url.searchParams.get('role') || '';

    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    if (roleFilter && roleFilter !== "TODOS") {
      if (Object.values(UserRole).includes(roleFilter as UserRole)) {
        whereClause.role = roleFilter;
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return new NextResponse("Erro interno do servidor ao buscar usuários.", { status: 500 });
  }
}