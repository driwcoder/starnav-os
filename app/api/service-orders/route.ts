// app/api/service-orders/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { OrderStatus, Priority, UserRole } from "@prisma/client"; // Importa os enums do Prisma

// --- Schema de Validação para a API (Zod) ---
// Este schema deve refletir o que é esperado no corpo da requisição POST
const createServiceOrderSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional().nullable(),
  ship: z.string().min(1),
  location: z.string().optional().nullable(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  createdById: z.string().uuid("ID do criador inválido."), // ID do usuário criador
  assignedToId: z.string().uuid("ID do responsável inválido.").optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(), // Data como string ISO 8601
});

// --- Handler para Requisições POST (Criação) ---
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Proteção de Rota (Autenticação e Domínio)
    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    const body = await request.json();

    // 2. Validação dos dados de entrada com Zod
    const validatedData = createServiceOrderSchema.safeParse(body);

    if (!validatedData.success) {
      console.error("Erro de validação na API de criação de OS:", validatedData.error.errors);
      return new NextResponse("Dados inválidos: " + JSON.stringify(validatedData.error.errors), { status: 400 });
    }

    const { title, description, ship, location, priority, createdById, assignedToId, dueDate } = validatedData.data;

    // Opcional: Verifique se o createdById da requisição corresponde ao ID do usuário na sessão
    // Isso previne que um usuário crie OSs em nome de outro.
    if (createdById !== session.user.id) {
      return new NextResponse("ID do criador não corresponde ao usuário logado.", { status: 403 });
    }

    // 3. Criação da Ordem de Serviço no Banco de Dados
    const newServiceOrder = await prisma.serviceOrder.create({
      data: {
        title,
        description,
        ship,
        location,
        priority,
        createdBy: { connect: { id: createdById } }, // Conecta ao usuário criador
        assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined, // Conecta ao responsável, se houver
        dueDate: dueDate ? new Date(dueDate) : null, // Converte a string ISO para objeto Date
        status: OrderStatus.PENDENTE, // Define o status inicial como PENDENTE
      },
    });

    // 4. Resposta de Sucesso
    return NextResponse.json(newServiceOrder, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Erro ao criar Ordem de Serviço:", error);
    return new NextResponse("Erro interno do servidor ao criar Ordem de Serviço.", { status: 500 });
  }
}

// --- Handler para Requisições GET (Listagem - já implementado na página, mas pode ser uma API dedicada) ---
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Proteção de Rota (Autenticação e Domínio)
    if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
      return new NextResponse("Não autorizado. Acesso restrito a funcionários StarNav.", { status: 403 });
    }

    // Para este exemplo, a listagem já é feita no Server Component da página
    // Mas se precisar de uma API para listagem dinâmica ou outros filtros:
    const serviceOrders = await prisma.serviceOrder.findMany({
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