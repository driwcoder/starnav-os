// app/api/service-orders/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import {
  OrderStatus,
  Priority,
  UserRole,
  UserSector,
  SolutionType,
} from "@prisma/client";

// Schema de validação para o ID (comum para GET e PUT)
const idSchema = z.string().uuid("ID inválido.");

// Schema de Validação para a API de Atualização (PUT)
const updateServiceOrderSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional().nullable(),
  scopeOfService: z.string().optional().nullable(),
  ship: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  assignedToId: z
    .string()
    .uuid("ID do responsável inválido.")
    .optional()
    .nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z
    .enum([
      "PENDENTE",
      "EM_ANALISE",
      "APROVADA",
      "RECUSADA",
      "EM_EXECUCAO",
      "AGUARDANDO_PECAS",
      "CONCLUIDA",
      "CANCELADA",
      "PLANEJADA",
      "AGUARDANDO_SUPRIMENTOS",
      "CONTRATADA",
    ])
    .optional(),
  completedAt: z.string().datetime().optional().nullable(),
  plannedStartDate: z.string().datetime().optional().nullable(),
  plannedEndDate: z.string().datetime().optional().nullable(),
  solutionType: z.nativeEnum(SolutionType).optional().nullable(),
  responsibleCrew: z.string().optional().nullable(),
  coordinatorNotes: z.string().optional().nullable(),
  contractedCompany: z.string().optional().nullable(),
  contractDate: z.string().datetime().optional().nullable(),
  serviceOrderCost: z.number().min(0).optional().nullable(),
  supplierNotes: z.string().optional().nullable(),
  reportAttachments: z.array(z.string().url()).optional(),
});

// Handler para Requisições GET por ID (Mantido igual, já estava funcionando)
export async function GET(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

    const session = await getServerSession(authOptions);
    const hasViewPermission = (
      userRole: UserRole | undefined,
      userSector: UserSector | undefined
    ) => {
      if (!userRole || !userSector) return false;
      if (userRole === UserRole.ADMIN) return true;

      const allowedRoles = [
        // ✅ REMOVIDA A TIPAGEM UserRole[] para permitir includes com 'any'
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
        // ✅ REMOVIDA A TIPAGEM UserSector[] para permitir includes com 'any'
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

      return (
        allowedRoles.includes(userRole) && allowedSectors.includes(userSector)
      );
    };

    if (
      !session ||
      !(session.user?.email as string)?.endsWith("@starnav.com.br") ||
      !hasViewPermission(session.user?.role, session.user?.sector)
    ) {
      return new NextResponse(
        "Não autorizado. Acesso restrito a funcionários StarNav.",
        { status: 403 }
      );
    }

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return new NextResponse("ID de Ordem de Serviço inválido.", {
        status: 400,
      });
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
      return new NextResponse("Ordem de Serviço não encontrada.", {
        status: 404,
      });
    }

    return NextResponse.json(serviceOrder, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar Ordem de Serviço por ID:", error);
    return new NextResponse(
      "Erro interno do servidor ao buscar Ordem de Serviço.",
      { status: 500 }
    );
  }
}

// Handler para Requisições PUT (Atualização)
export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const userSector = session?.user?.sector;

    // 1. Verificação de autenticação básica
    if (
      !session ||
      !(session.user?.email as string)?.endsWith("@starnav.com.br")
    ) {
      return new NextResponse(
        "Não autorizado. Acesso restrito a funcionários StarNav.",
        { status: 403 }
      );
    }

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return new NextResponse(
        "ID de Ordem de Serviço inválido para atualização.",
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateServiceOrderSchema.safeParse(body);

    if (!validatedData.success) {
      console.error(
        "Erro de validação na API de atualização de OS:",
        validatedData.error.errors
      );
      return new NextResponse(
        "Dados inválidos: " + JSON.stringify(validatedData.error.errors),
        { status: 400 }
      );
    }

    // 2. Buscar a OS existente para verificar o status atual e o criador
    const existingOs = await prisma.serviceOrder.findUnique({
      where: { id: validatedId.data },
      select: { status: true, createdById: true },
    });

    if (!existingOs) {
      return new NextResponse("Ordem de Serviço não encontrada.", {
        status: 404,
      });
    }

    // 3. Lógica de permissão detalhada baseada em ROLE, SETOR e STATUS da OS
    let canEdit = false;

    // ADMIN: Sempre pode editar
    if (userRole === UserRole.ADMIN) {
      canEdit = true;
    }
    // COORDENADORES / GESTORES / SUPERVISORES (Manutenção/Operação):
    else if (
      [UserRole.GESTOR, UserRole.SUPERVISOR, UserRole.COORDENADOR].includes(
        userRole as any
      ) && // ✅ Adicionado 'as any'
      [UserSector.MANUTENCAO, UserSector.OPERACAO].includes(userSector as any)
    ) {
      // ✅ Adicionado 'as any'
      const allowedCoordinatorStatuses = [
        OrderStatus.PENDENTE,
        OrderStatus.EM_ANALISE,
        OrderStatus.PLANEJADA,
        OrderStatus.EM_EXECUCAO,
        OrderStatus.AGUARDANDO_PECAS,
        OrderStatus.RECUSADA,
        OrderStatus.AGUARDANDO_SUPRIMENTOS,
        OrderStatus.CONTRATADA,
        OrderStatus.APROVADA,
        OrderStatus.CONCLUIDA,
        OrderStatus.CANCELADA,
      ];
      if (allowedCoordinatorStatuses.includes(existingOs.status)) {
        canEdit = true;
      }
    }
    // COMPRADORES (Suprimentos):
    else if (
      [
        UserRole.COMPRADOR_JUNIOR,
        UserRole.COMPRADOR_PLENO,
        UserRole.COMPRADOR_SENIOR,
      ].includes(userRole as any) && // ✅ Adicionado 'as any'
      userSector === UserSector.SUPRIMENTOS
    ) {
      const allowedBuyerStatuses: OrderStatus[] = [
        OrderStatus.AGUARDANDO_SUPRIMENTOS,
        OrderStatus.CONTRATADA,
      ];
      if (allowedBuyerStatuses.includes(existingOs.status)) {
        canEdit = true;
      }
    }
    // OUTROS CARGOS (Tripulação, Assistentes, Auxiliares, Estagiários):
    else if (
      [
        UserRole.COMANDANTE,
        UserRole.IMEDIATO,
        UserRole.OQN,
        UserRole.CHEFE_MAQUINAS,
        UserRole.SUB_CHEFE_MAQUINAS,
        UserRole.OQM,
        UserRole.ASSISTENTE,
        UserRole.AUXILIAR,
        UserRole.ESTAGIARIO,
      ].includes(userRole as any)
    ) {
      // ✅ Adicionado 'as any'
      const allowedOtherStatuses: OrderStatus[] = [
        OrderStatus.PENDENTE, // Apenas PENDENTE para criadores ou tripulação inicial
      ];
      // Podem editar se forem o CRIADOR da OS E a OS estiver em status PENDENTE
      if (
        session.user?.id === existingOs.createdById &&
        allowedOtherStatuses.includes(existingOs.status as OrderStatus)
      ) {
        canEdit = true;
      }
    }
    // Setores como RH, TI, Almoxarifado, Nao_Definido não devem editar por padrão, a menos que especificado.
    // Apenas Administracao para o ADMIN.

    if (!canEdit) {
      return new NextResponse(
        "Acesso negado. Você não tem permissão para editar esta Ordem de Serviço com o status atual.",
        { status: 403 }
      );
    }

    const { dueDate, status, completedAt, ...dataToUpdate } =
      validatedData.data;

    let actualCompletedAt = completedAt ? new Date(completedAt) : null;
    if (status === "CONCLUIDA" && !actualCompletedAt) {
      actualCompletedAt = new Date();
    } else if (status !== "CONCLUIDA") {
      actualCompletedAt = null;
    }

    const updatedServiceOrder = await prisma.serviceOrder.update({
      where: { id: validatedId.data },
      data: {
        ...dataToUpdate,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status ? (status as OrderStatus) : undefined,
        completedAt: actualCompletedAt,
        plannedStartDate: validatedData.data.plannedStartDate
          ? new Date(validatedData.data.plannedStartDate)
          : null,
        plannedEndDate: validatedData.data.plannedEndDate
          ? new Date(validatedData.data.plannedEndDate)
          : null,
        solutionType: validatedData.data.solutionType
          ? (validatedData.data.solutionType as SolutionType)
          : undefined,
        responsibleCrew: validatedData.data.responsibleCrew,
        coordinatorNotes: validatedData.data.coordinatorNotes,
        contractedCompany: validatedData.data.contractedCompany,
        contractDate: validatedData.data.contractDate
          ? new Date(validatedData.data.contractDate)
          : null,
        serviceOrderCost: validatedData.data.serviceOrderCost,
        supplierNotes: validatedData.data.supplierNotes,
          reportAttachments: validatedData.data.reportAttachments ?? [], // ✅ Salva os anexos

      },
    });

    return NextResponse.json(updatedServiceOrder, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar Ordem de Serviço:", error);
    return new NextResponse(
      "Erro interno do servidor ao atualizar Ordem de Serviço.",
      { status: 500 }
    );
  }
}

// Handler para Requisições DELETE (Exclusão)
export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

    const session = await getServerSession(authOptions);

    if (
      !session ||
      !(session.user?.email as string)?.endsWith("@starnav.com.br") ||
      session?.user?.role !== UserRole.ADMIN
    ) {
      return new NextResponse(
        "Não autorizado. Acesso restrito a funcionários StarNav.",
        { status: 403 }
      );
    }

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return new NextResponse(
        "ID de Ordem de Serviço inválido para exclusão.",
        { status: 400 }
      );
    }

    await prisma.serviceOrder.delete({
      where: { id: validatedId.data },
    });

    return new NextResponse("Ordem de Serviço excluída com sucesso.", {
      status: 200,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return new NextResponse(
        "Ordem de Serviço não encontrada para exclusão.",
        { status: 404 }
      );
    }
    console.error("Erro ao excluir Ordem de Serviço:", error);
    return new NextResponse(
      "Erro interno do servidor ao excluir Ordem de Serviço.",
      { status: 500 }
    );
  }
}
