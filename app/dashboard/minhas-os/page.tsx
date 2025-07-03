// app/dashboard/minhas-os/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
// Define enums locally since they are not exported from @prisma/client
enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  // add other roles as needed
}

enum UserSector {
  TRIPULACAO = "TRIPULACAO",
  MANUTENCAO = "MANUTENCAO",
  OPERACAO = "OPERACAO",
  SUPRIMENTOS = "SUPRIMENTOS",
  // add other sectors as needed
}

enum OrderStatus {
  PENDENTE = "PENDENTE",
  EM_ANALISE = "EM_ANALISE",
  APROVADA = "APROVADA",
  RECUSADA = "RECUSADA",
  PLANEJADA = "PLANEJADA",
  AGUARDANDO_SUPRIMENTOS = "AGUARDANDO_SUPRIMENTOS",
  EM_EXECUCAO = "EM_EXECUCAO",
  AGUARDANDO_PECAS = "AGUARDANDO_PECAS",
  CONTRATADA = "CONTRATADA",
  CONCLUIDA = "CONCLUIDA",
  CANCELADA = "CANCELADA",
  // add other statuses as needed
}
import StatusSummaryCard from "./components/StatusSummaryCard"; // Verifique o caminho real
import OrderList from "./components/OrderList"; // Verifique o caminho real
import FilterToggle from "./components/FilterToggle"; // Verifique o caminho real

export default async function MinhasOSPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  // ✅ CORREÇÃO: Tipagem direta com 'any'
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email.endsWith("@starnav.com.br")) {
    redirect("/login");
  }

  // ✅ CORREÇÃO: Await searchParams explicitamente
  const actualSearchParams = await searchParams;
  const historico = actualSearchParams?.historico === "true";

  const userRole = session.user.role;
  const userSector = session.user.sector;
  const userId = session.user.id;

  const whereClause: any = {};

  if (userRole === UserRole.ADMIN) {
    if (historico) {
      whereClause.status = {
        in: [OrderStatus.CONCLUIDA, OrderStatus.CANCELADA],
      };
    } else {
      whereClause.status = {
        notIn: [OrderStatus.CONCLUIDA, OrderStatus.CANCELADA],
      };
    }
  } else {
    if (historico) {
      whereClause.status = {
        in: [OrderStatus.CONCLUIDA, OrderStatus.CANCELADA],
      };
    } else {
      if (userSector === UserSector.TRIPULACAO) {
        whereClause.AND = [
          {
            OR: [{ createdById: userId }, { assignedToId: userId }],
          },
          {
            status: {
              in: [
                OrderStatus.PENDENTE,
                OrderStatus.EM_ANALISE,
                OrderStatus.RECUSADA,
                OrderStatus.AGUARDANDO_PECAS,
                OrderStatus.EM_EXECUCAO,
              ],
            },
          },
        ];
      } else if (
        userSector === UserSector.MANUTENCAO ||
        userSector === UserSector.OPERACAO
      ) {
        whereClause.status = {
          in: [
            OrderStatus.PENDENTE,
            OrderStatus.EM_ANALISE,
            OrderStatus.APROVADA,
            OrderStatus.RECUSADA,
            OrderStatus.PLANEJADA,
            OrderStatus.AGUARDANDO_SUPRIMENTOS,
            OrderStatus.EM_EXECUCAO,
            OrderStatus.AGUARDANDO_PECAS,
          ],
        };
      } else if (userSector === UserSector.SUPRIMENTOS) {
        whereClause.status = {
          in: [
            OrderStatus.AGUARDANDO_SUPRIMENTOS,
            OrderStatus.CONTRATADA,
            OrderStatus.EM_EXECUCAO,
          ],
        };
      } else {
        whereClause.createdById = userId;
        whereClause.status = {
          notIn: [OrderStatus.CONCLUIDA, OrderStatus.CANCELADA],
        };
      }
    }
  }

  const serviceOrders = await prisma.serviceOrder.findMany({
    where: whereClause,
    orderBy: { requestedAt: "desc" },
    include: {
      createdBy: {
        select: { name: true, email: true, role: true, sector: true },
      },
      assignedTo: {
        select: { name: true, email: true, role: true, sector: true },
      },
    },
  });

  const resumoPorStatus: Record<OrderStatus, number> = Object.values(
    OrderStatus
  ).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<OrderStatus, number>);

  for (const o of serviceOrders) {
    resumoPorStatus[o.status as OrderStatus]++;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Minhas Ordens de Serviço</h1>

      <FilterToggle historico={historico} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Object.entries(resumoPorStatus)
          .filter(([status, count]) => count > 0)
          .map(([status, count]) => (
            <StatusSummaryCard
              key={status}
              status={status as OrderStatus}
              count={count}
            />
          ))}
      </div>

      <div className="mt-10">
        <OrderList os={serviceOrders} />
      </div>
    </div>
  );
}
