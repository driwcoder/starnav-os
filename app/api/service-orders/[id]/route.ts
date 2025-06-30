// app/api/service-orders/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { OrderStatus } from "@prisma/client";
// Nao precisamos de OrderStatus, Priority, UserRole aqui para GET por ID

// Schema de validação para o ID (se necessário)
const idSchema = z.string().uuid("ID inválido.");

// Handler para Requisições GET por ID
export async function GET(request: Request, { params }: { params: any }) { // params tipado como any
  try {
    const actualParams = await params; // await params aqui
    const id = actualParams.id as string; // Use actualParams

    // 1. Proteção de Rota (Autenticação e Domínio)
    const session = await getServerSession(authOptions);
    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    // Opcional: Validação do ID
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID da Ordem de Serviço inválido.", { status: 400 });
    }

    // 2. Busca a Ordem de Serviço específica no Banco de Dados
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: validatedId.data }, // Usa o ID validado
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

    // 3. Resposta de Sucesso
    return NextResponse.json(serviceOrder, { status: 200 }); // Retorna JSON da OS
  } catch (error) {
    console.error("Erro ao buscar Ordem de Serviço por ID:", error);
    return new NextResponse("Erro interno do servidor ao buscar Ordem de Serviço.", { status: 500 });
  }
}


// Handler para Requisições PUT (Atualização)
const updateServiceOrderSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional().nullable(),
  ship: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  assignedToId: z.string().uuid("ID do responsável inválido.").optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["PENDENTE", "EM_ANALISE", "APROVADA", "RECUSADA", "EM_EXECUCAO", "AGUARDANDO_PECAS", "CONCLUIDA", "CANCELADA"]).optional(),
  completedAt: z.string().datetime().optional().nullable(),
});

export async function PUT(request: Request, { params }: { params: any }) { // params tipado como any
  try {
    const actualParams = await params; // await params aqui
    const id = actualParams.id as string; // Use actualParams

    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
        return new NextResponse("ID da Ordem de Serviço inválido para atualização.", { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateServiceOrderSchema.safeParse(body);

    if (!validatedData.success) {
        console.error("Erro de validação na API de atualização de OS:", validatedData.error.errors);
        return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const { dueDate, status, completedAt, ...dataToUpdate } = validatedData.data;

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
        status: status as OrderStatus | undefined,
        completedAt: actualCompletedAt,
      },
    });

    return NextResponse.json(updatedServiceOrder, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar Ordem de Serviço por ID:", error);
    return new NextResponse("Erro interno do servidor ao atualizar Ordem de Serviço.", { status: 500 });
  }
}