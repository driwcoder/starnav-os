import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, UserSector, OrderStatus } from "@prisma/client";
import StatusSummaryCard from "./components/StatusSummaryCard";
import OrderList from "./components/OrderList";
import FilterToggle from "./components/FilterToggle";

export default async function MinhasOSPage(props: {
  searchParams?: { historico?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email.endsWith("@starnav.com.br")) {
    redirect("/login");
  }

  const searchParams = props.searchParams;

  const historico = searchParams?.historico === "true";
  const userSector = session.user.sector;

  const filters = [];

  if (!historico) {
    // Tripulação: vê apenas OS criadas por usuários do setor TRIPULACAO e status iniciais

    if (session.user.sector === "TRIPULACAO") {
      filters.push({
        status: {
          in: [
            "PENDENTE",
            "EM_ANALISE",
            "RECUSADA",
            "AGUARDANDO_PECAS",
          ] as OrderStatus[],
        },
      });
    }
    // Manutenção / Operação: assignedTo → setor = MANUTENCAO ou OPERACAO
    if (
      session.user.sector === "MANUTENCAO" ||
      session.user.sector === "OPERACAO"
    ) {
      filters.push({
        status: {
          in: [
            "PLANEJADA",
            "EM_EXECUCAO",
            "AGUARDANDO_PECAS",
            "APROVADA",
            "RECUSADA",
          ] as OrderStatus[],
        },
      });
    }

    // Suprimentos: vê todas as OS com status AGUARDANDO_SUPRIMENTOS ou CONTRATADA
    if (session.user.sector === "SUPRIMENTOS") {
      filters.push({
        status: {
          in: ["AGUARDANDO_SUPRIMENTOS", "CONTRATADA"] as OrderStatus[],
        },
      });
    }
  }

  const whereClause = historico
    ? {
        status: {
          in: ["CONCLUIDA", "CANCELADA"] as OrderStatus[],
        },
      }
    : {
        OR: filters,
      };

  const serviceOrders = await prisma.serviceOrder.findMany({
    where: whereClause,
  });
  if (userSector === UserSector.ADMINISTRACAO) {
    // Admin vê todas as OS
    serviceOrders.push(
      ...(await prisma.serviceOrder.findMany({
        where: {
          status: {
            in: [
              "PENDENTE",
              "EM_ANALISE",
              "APROVADA",
              "RECUSADA",
            ] as OrderStatus[],
          },
        },
      }))
    );
  }

  const resumoPorStatus: Record<OrderStatus, number> = {
    PENDENTE: 0,
    EM_ANALISE: 0,
    APROVADA: 0,
    RECUSADA: 0,
    PLANEJADA: 0,
    AGUARDANDO_SUPRIMENTOS: 0,
    CONTRATADA: 0,
    EM_EXECUCAO: 0,
    AGUARDANDO_PECAS: 0,
    CONCLUIDA: 0,
    CANCELADA: 0,
  };

  for (const o of serviceOrders) {
    resumoPorStatus[o.status]++;
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
