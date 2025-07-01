// app/api/service-orders/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { OrderStatus, Priority } from "@prisma/client";

// --- Schema de Validação para a API de Criação (POST) ---
const createServiceOrderSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional().nullable(),
  scopeOfService: z.string().optional().nullable(), // ✅ NOVO CAMPO: Escopo de Serviço
  ship: z.string().min(1),
  location: z.string().optional().nullable(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  createdById: z.string().uuid("ID do criador inválido."),
  assignedToId: z.string().uuid("ID do responsável inválido.").optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

// Handler para Requisições POST (Criação)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    const body = await request.json();

    const validatedData = createServiceOrderSchema.safeParse(body);

    if (!validatedData.success) {
      console.error("Erro de validação na API de criação de OS:", validatedData.error.errors);
      return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const { title, description, scopeOfService, ship, location, priority, createdById, assignedToId, dueDate } = validatedData.data; // ✅ Desestruturar scopeOfService

    if (createdById !== session.user.id) {
      return new NextResponse("ID do criador não corresponde ao usuário logado.", { status: 403 });
    }

    const newServiceOrder = await prisma.serviceOrder.create({
      data: {
        title,
        description,
        scopeOfService, // ✅ Passar scopeOfService para o Prisma
        ship,
        location,
        priority,
        createdBy: { connect: { id: createdById } },
        assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: OrderStatus.PENDENTE,
      },
    });

    return NextResponse.json(newServiceOrder, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar Ordem de Serviço:", error);
    return new NextResponse("Erro interno do servidor ao criar Ordem de Serviço.", { status: 500 });
  }
}

// Handler para Requisições GET (Listagem de TODAS as OS)
export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    const url = new URL(_request.url);
    const query = url.searchParams.get('query') || '';
    const statusFilter = url.searchParams.get('status') || '';
    const priorityFilter = url.searchParams.get('priority') || '';

    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { ship: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    if (statusFilter && statusFilter !== "TODOS") {
      if (Object.values(OrderStatus).includes(statusFilter as OrderStatus)) {
        whereClause.status = statusFilter;
      }
    }

    if (priorityFilter && priorityFilter !== "TODOS") {
      if (Object.values(Priority).includes(priorityFilter as Priority)) {
        whereClause.priority = priorityFilter;
      }
    }

    const serviceOrders = await prisma.serviceOrder.findMany({
      where: whereClause,
      orderBy: { requestedAt: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(serviceOrders, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar Ordens de Serviço:", error);
    return new NextResponse("Erro interno do servidor ao buscar Ordens de Serviço.", { status: 500 });
  }
}