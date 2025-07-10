// app/minhas-os/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OrderStatus, UserRole, UserSector, SolutionType } from "@prisma/client"; // Added SolutionType import
import StatusSummaryCard from "./components/StatusSummaryCard";
import OrderList from "./components/OrderList";
import StatusFilter from "./components/StatusFilter";
import { SiteHeader } from "@/components/site-header";

// Add the canEditOrder function from service-orders page
function canEditOrder({
  userSector,
  status,
  solutionType,
}: {
  userSector: UserSector;
  status: OrderStatus;
  solutionType?: SolutionType | null;
}) {
  if (userSector === UserSector.TRIPULACAO) {
    if (["PENDENTE", "RECUSADA", "EM_EXECUCAO"].includes(status)) return true;
    return false;
  }
  if (
    [UserSector.MANUTENCAO, UserSector.OPERACAO].includes(userSector as any)
  ) {
    return [
      "PENDENTE",
      "APROVADA",
      "RECUSADA",
      "PLANEJADA",
      "EM_ANALISE",
    ].includes(status);
  }
  if (userSector === UserSector.SUPRIMENTOS) {
    return ["AGUARDANDO_SUPRIMENTOS", "CONTRATADA"].includes(status);
  }
  return false;
}

// ✅ CORREÇÃO: Tipagem direta das props com 'any' para contornar o problema do compilador
export default async function MinhasOSPage({ searchParams }: any) {
  const session = await getServerSession(authOptions) as {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      sector: UserSector;
      id: string;
    } | null;
    expires?: string;
  } | null;
  // gatilho deploy production
  if (
    !session ||
    !session.user ||
    !session.user.email ||
    !session.user.email.endsWith("@starnav.com.br")
  ) {
    redirect("/auth/login");
  }
  if (typeof searchParams?.then === "function") {
    searchParams = await searchParams;
  }
  // ✅ Carregar preferências do usuário ao acessar a página
  const userPreferences = await prisma.dashboardPreference.findUnique({
    where: { userId: session.user.id },
  });

  // Se houver preferências salvas e não houver filtro de status na URL, use as preferências
  if (userPreferences && !searchParams?.statusFilter) {
    searchParams = {
      ...searchParams,
      statusFilter: userPreferences.statuses.join(","),
    };
  }
  const actualSearchParams = await searchParams;

  const statusFilter = actualSearchParams?.statusFilter
    ? actualSearchParams.statusFilter.split(",")
    : [];

  const userRole = session.user.role;
  const userSector = session.user.sector; // Get user sector for permissions
  const whereClause: any = {};

  // Lógica para Admin e outros usuários (mantida do código anterior, sem historico por enquanto)
  if (userRole === UserRole.ADMIN) {
    whereClause.status = {
      notIn: [OrderStatus.CONCLUIDA, OrderStatus.CANCELADA],
    };
  } 

  // Aplicar filtro de status da URL, se houver
  if (statusFilter && statusFilter.length > 0 && statusFilter[0] !== "TODOS") {
    whereClause.status = {
      in: statusFilter as OrderStatus[],
    };
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
      <SiteHeader />
      <h1 className="text-2xl font-bold mb-4">Minhas Ordens de Serviço</h1>
     
      <StatusFilter currentFilter={statusFilter} />

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
        <OrderList 
          os={serviceOrders} 
          userSector={userSector}
          canEditOrder={canEditOrder}
        />
      </div>
    </div>
  );
}
