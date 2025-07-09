// app/api/service-orders/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { OrderStatus, SolutionType } from "@prisma/client";
import { hasViewPermission, canEditOs, canDeleteOs, isValidStatusTransition } from "@/lib/permissions";

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
  assignedToId: z.string().uuid("ID do responsável inválido.").optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["PENDENTE", "EM_ANALISE", "APROVADA", "RECUSADA", "EM_EXECUCAO", "AGUARDANDO_MATERIAL", "CONCLUIDA", "CANCELADA", "PLANEJADA", "AGUARDANDO_SUPRIMENTOS", "CONTRATADA"]).optional(),
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
  reportAttachments: z.array(z.string()).optional(),
});

// Handler para Requisições GET por ID
export async function GET(request: Request, { params }: { params: any }) {
  try {
    const actualParams = await params;
    const id = actualParams.id as string;

    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br") || !hasViewPermission(session.user as any)) {
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

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
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

    const existingOs = await prisma.serviceOrder.findUnique({
      where: { id: validatedId.data },
      select: { status: true, createdById: true },
    });

    if (!existingOs) {
      return new NextResponse("Ordem de Serviço não encontrada.", { status: 404 });
    }

    // Usar a função canEditOs centralizada para a validação real da permissão de edição
    if (!canEditOs(existingOs.status, existingOs.createdById, session.user as any)) {
      return new NextResponse("Acesso negado. Você não tem permissão para editar esta Ordem de Serviço com o status atual.", { status: 403 });
    }

    const { dueDate, status, completedAt, reportAttachments, ...dataToUpdate } = validatedData.data;

    // ✅ NOVO: Validação da transição de status
    if (status && status !== existingOs.status) { // Se o status está sendo alterado
        if (!isValidStatusTransition(existingOs.status, status, session.user as any)) {
            return new NextResponse(`Transição de status de '${existingOs.status.replace(/_/g, ' ')}' para '${status.replace(/_/g, ' ')}' não permitida para o seu perfil.`, { status: 403 });
        }
    }

    let actualCompletedAt = completedAt ? new Date(completedAt) : null;
    if (status === OrderStatus.CONCLUIDA && !actualCompletedAt) {
        actualCompletedAt = new Date();
    } else if (status !== OrderStatus.CONCLUIDA) {
        actualCompletedAt = null;
    }

    const updatedServiceOrder = await prisma.serviceOrder.update({
      where: { id: validatedId.data },
      data: {
        ...dataToUpdate,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status ? (status as OrderStatus) : undefined,
        completedAt: actualCompletedAt,
        plannedStartDate: validatedData.data.plannedStartDate ? new Date(validatedData.data.plannedStartDate) : null,
        plannedEndDate: validatedData.data.plannedEndDate ? new Date(validatedData.data.plannedEndDate) : null,
        solutionType: validatedData.data.solutionType ? (validatedData.data.solutionType as SolutionType) : undefined,
        responsibleCrew: validatedData.data.responsibleCrew,
        coordinatorNotes: validatedData.data.coordinatorNotes,
        contractedCompany: validatedData.data.contractedCompany,
        contractDate: validatedData.data.contractDate ? new Date(validatedData.data.contractDate) : null,
        serviceOrderCost: validatedData.data.serviceOrderCost,
        supplierNotes: validatedData.data.supplierNotes,
        reportAttachments: reportAttachments ?? [],
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

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br") || !canDeleteOs(session.user as any)) {
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