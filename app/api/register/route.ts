// app/api/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Importe o Prisma Client
import bcrypt from "bcryptjs"; // Importe o bcryptjs
import { UserRole } from "@prisma/client"; // Importe o enum UserRole do Prisma

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password) {
      return new NextResponse("Email e senha são obrigatórios", { status: 400 });
    }

    // Verifica o sufixo do e-mail para registro
    if (!email.endsWith("@starnav.com.br")) {
      return new NextResponse("Registro permitido apenas para emails @starnav.com.br", { status: 403 });
    }

    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("Usuário com este email já existe", { status: 409 });
    }

    // Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10); // 10 é o saltRounds, um bom valor

    // Define o papel do usuário (role). Garante que o valor venha do enum.
    const userRole: UserRole = role && Object.values(UserRole).includes(role) ? role : UserRole.COMUM;


    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || "Novo Usuário", // Nome opcional, com default
        role: userRole,
      },
    });

    // Retorna um objeto de usuário simplificado, sem a senha
    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Erro no registro de usuário:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}