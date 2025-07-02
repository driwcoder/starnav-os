// app/api/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { UserRole, UserSector } from "@prisma/client";

// --- Schema de Validação para a API (Zod) ---
const createUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email("Formato de e-mail inválido.").endsWith("@starnav.com.br", "O e-mail deve ser @starnav.com.br."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  role: z.nativeEnum(UserRole, {
    required_error: "O papel do usuário é obrigatório.",
  }),
  sector: z.nativeEnum(UserSector, {
    required_error: "O setor do usuário é obrigatório.",
  }),
});

// Handler para Requisições POST (Criação de Usuário)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.safeParse(body);

    if (!validatedData.success) {
      console.error("Erro de validação na API de registro:", validatedData.error.errors);
      return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const { name, email, password, role, sector } = validatedData.data;

    // Impedir que o role ADMIN seja definido por registro público
    if (role === UserRole.ADMIN) {
      return new NextResponse("Não é possível registrar como ADMINISTRADOR diretamente. Contate um administrador existente.", { status: 403 });
    }

    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("Usuário com este email já existe.", { status: 409 });
    }

    // Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criação do Usuário no Banco de Dados
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        sector,
      },
    });

    // Resposta de Sucesso (sem a senha)
    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      sector: newUser.sector,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return new NextResponse("Erro interno do servidor ao registrar usuário.", { status: 500 });
  }
}

// O GET handler para /api/users está em app/api/users/route.ts, não aqui.
export async function GET(_request: Request) {
  return new NextResponse("Método não permitido.", { status: 405 });
}