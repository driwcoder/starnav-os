// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { UserRole, UserSector } from "@prisma/client";

const idSchema = z.string().uuid("ID de usuário inválido.");
const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email("Formato de e-mail inválido.").endsWith("@starnav.com.br", "O e-mail deve ser @starnav.com.br.").optional(),
  role: z.nativeEnum(UserRole, {
    required_error: "O papel do usuário é obrigatório.",
  }).optional(),
  sector: z.nativeEnum(UserSector, {
    required_error: "O setor do usuário é obrigatório.",
  }).optional(),
});

export async function GET(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;
    const session = await getServerSession(authOptions);
    const hasViewPermission = (userRole: UserRole | undefined, userSector: UserSector | undefined) => {
      if (!userRole || !userSector) return false;
      if (userRole === UserRole.ADMIN) return true;

      const allowedRoles = [
        UserRole.GESTOR,
        UserRole.SUPERVISOR,
        UserRole.COORDENADOR,
        UserRole.COMPRADOR_JUNIOR,
        UserRole.COMPRADOR_PLENO,
        UserRole.COMPRADOR_SENIOR,
        UserRole.COMANDANTE,
        UserRole.IMEDIATO,
        UserRole.OQN,
        UserRole.CHEFE_MAQUINAS,
        UserRole.SUB_CHEFE_MAQUINAS,
        UserRole.OQM,
        UserRole.ASSISTENTE,
        UserRole.AUXILIAR,
        UserRole.ESTAGIARIO,
      ];
      const allowedSectors = [
        UserSector.ADMINISTRACAO,
        UserSector.MANUTENCAO,
        UserSector.OPERACAO,
        UserSector.SUPRIMENTOS,
        UserSector.TRIPULACAO,
        UserSector.ALMOXARIFADO,
        UserSector.RH,
        UserSector.TI,
        UserSector.NAO_DEFINIDO,
      ];

      return allowedRoles.includes(userRole) && allowedSectors.includes(userSector);
    };

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br") || !hasViewPermission(session.user?.role, session.user?.sector)) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID de usuário inválido.", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: validatedId.data },
      select: { id: true, name: true, email: true, role: true, sector: true, createdAt: true, updatedAt: true },
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
    const hasEditPermission = (userRole: UserRole | undefined, userSector: UserSector | undefined) => {
      if (!userRole || !userSector) return false;
      if (userRole === UserRole.ADMIN) return true;

      const allowedEditRoles = [
        UserRole.GESTOR,
        UserRole.SUPERVISOR,
        UserRole.COORDENADOR,
        UserRole.COMPRADOR_JUNIOR,
        UserRole.COMPRADOR_PLENO,
        UserRole.COMPRADOR_SENIOR,
        UserRole.COMANDANTE,
        UserRole.IMEDIATO,
        UserRole.OQN,
        UserRole.CHEFE_MAQUINAS,
        UserRole.SUB_CHEFE_MAQUINAS,
        UserRole.OQM,
        UserRole.ASSISTENTE,
        UserRole.AUXILIAR,
        UserRole.ESTAGIARIO,
      ];
      const allowedEditSectors = [
        UserSector.ADMINISTRACAO,
        UserSector.MANUTENCAO,
        UserSector.OPERACAO,
        UserSector.SUPRIMENTOS,
        UserSector.TRIPULACAO,
        UserSector.ALMOXARIFADO,
        UserSector.RH,
        UserSector.TI,
        UserSector.NAO_DEFINIDO,
      ];

      return allowedEditRoles.includes(userRole) && allowedEditSectors.includes(userSector);
    };

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br") || !hasEditPermission(session.user?.role, session.user?.sector)) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
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

    const { email, ...dataToUpdate } = validatedData.data;
    const updatedUser = await prisma.user.update({
      where: { id: validatedId.data },
      data: {
        ...dataToUpdate,
        role: dataToUpdate.role as UserRole | undefined,
        sector: dataToUpdate.sector as UserSector | undefined, // Incluir o setor na atualização
      },
      select: { id: true, name: true, email: true, role: true, sector: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return new NextResponse("Erro interno do servidor ao atualizar usuário.", { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;
    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br") || (session?.user?.role !== UserRole.ADMIN)) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true },
    });

    if (currentUser?.role !== UserRole.ADMIN) {
      return new NextResponse("Acesso negado. Apenas administradores podem excluir usuários.", { status: 403 });
    }

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