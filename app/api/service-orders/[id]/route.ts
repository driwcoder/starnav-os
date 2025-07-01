// app/api/service-orders/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { OrderStatus, Priority, UserRole, UserSector, SolutionType } from "@prisma/client"; // Importe SolutionType

// Schema de validação para o ID (comum para GET e PUT)
const idSchema = z.string().uuid("ID inválido.");

// Schema de Validação para a API de Atualização (PUT)
const updateServiceOrderSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional().nullable(),
  scopeOfService: z.string().optional().nullable(), // NOVO CAMPO
  ship: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  assignedToId: z.string().uuid("ID do responsável inválido.").optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["PENDENTE", "EM_ANALISE", "APROVADA", "RECUSADA", "EM_EXECUCAO", "AGUARDANDO_PECAS", "CONCLUIDA", "CANCELADA", "PLANEJADA", "AGUARDANDO_SUPRIMENTOS", "CONTRATADA"]).optional(),
  completedAt: z.string().datetime().optional().nullable(),
  // Novos campos de Planejamento
  plannedStartDate: z.string().datetime().optional().nullable(),
  plannedEndDate: z.string().datetime().optional().nullable(),
  solutionType: z.nativeEnum(SolutionType).optional().nullable(),
  responsibleCrew: z.string().optional().nullable(),
  coordinatorNotes: z.string().optional().nullable(),
  // Novos campos de Suprimentos
  contractedCompany: z.string().optional().nullable(),
  contractDate: z.string().datetime().optional().nullable(),
  serviceOrderCost: z.number().optional().nullable(), // Zod vai inferir de 'number' para float
  supplierNotes: z.string().optional().nullable(),
});

// Handler para Requisições GET por ID
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
        return new NextResponse("ID de Ordem de Serviço inválido.", { status: 400 });
    }

    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: validatedId.data },
      include: {
        createdBy: {
          select: { name: true, email: true, role: true },
        },
        assignedTo: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    if (!serviceOrder) {
      return new NextResponse("Ordem de Serviço não encontrada.", { status: 404 });
    }

    return NextResponse.json(serviceOrder, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar Ordem de Serviço por ID:", error);
    return new NextResponse("Erro interno do servidor ao buscar Ordem de Serviço.", { status: 500 });
  }
}

// Handler para Requisições PUT (Atualização)
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
        return new NextResponse("ID de Ordem de Serviço inválido para atualização.", { status: 400 });
    }

    const body = await request.json();

    const validatedData = updateServiceOrderSchema.safeParse(body);

    if (!validatedData.success) {
        console.error("Erro de validação na API de atualização de OS:", validatedData.error.errors);
        return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const {
      dueDate, status, completedAt, // Campos já existentes no update
      // Novos campos de Planejamento
      plannedStartDate, plannedEndDate, solutionType, responsibleCrew, coordinatorNotes,
      // Novos campos de Suprimentos
      contractedCompany, contractDate, serviceOrderCost, supplierNotes,
      ...dataToUpdate // O resto dos campos
    } = validatedData.data;

    let actualCompletedAt = completedAt ? new Date(completedAt) : null;
    if (status === "CONCLUIDA" && !actualCompletedAt) {
        actualCompletedAt = new Date();
    } else if (status !== "CONCLUIDA") {
        actualCompletedAt = null;
    }

    const updatedServiceOrder = await prisma.serviceOrder.update({
      where: { id: validatedId.data },
      data: {
        ...dataToUpdate, // Inclui title, description, ship, location, priority
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status ? (status as OrderStatus) : undefined,
        completedAt: actualCompletedAt,
        // ✅ Passar novos campos de Planejamento para o Prisma
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        solutionType: solutionType ? (solutionType as SolutionType) : undefined,
        responsibleCrew: responsibleCrew,
        coordinatorNotes: coordinatorNotes,
        // ✅ Passar novos campos de Suprimentos para o Prisma
        contractedCompany: contractedCompany,
        contractDate: contractDate ? new Date(contractDate) : null,
        serviceOrderCost: serviceOrderCost,
        supplierNotes: supplierNotes,
      },
    });

    return NextResponse.json(updatedServiceOrder, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar Ordem de Serviço:", error);
    return new NextResponse("Erro interno do servidor ao atualizar Ordem de Serviço.", { status: 500 });
  }
}

// Handler para Requisições DELETE (Exclusão)
export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br") || (session?.user?.role !== UserRole.ADMIN)) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID de Ordem de Serviço inválido para exclusão.", { status: 400 });
    }

    await prisma.serviceOrder.delete({
      where: { id: validatedId.data },
    });

    return new NextResponse("Ordem de Serviço excluída com sucesso.", { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
        return new NextResponse("Ordem de Serviço não encontrada para exclusão.", { status: 404 });
    }
    console.error("Erro ao excluir Ordem de Serviço:", error);
    return new NextResponse("Erro interno do servidor ao excluir Ordem de Serviço.", { status: 500 });
  }
}