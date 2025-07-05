// app/dashboard/minhas-os/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OrderStatus, UserRole, UserSector } from "@prisma/client"; // Importe enums do Prisma
import StatusSummaryCard from "./components/StatusSummaryCard";
import OrderList from "./components/OrderList";
import StatusFilter from "./components/StatusFilter"; // Importe StatusFilter

// ✅ CORREÇÃO: Tipagem direta das props com 'any' para contornar o problema do compilador
export default async function MinhasOSPage({ searchParams }: any) {
  const session = await getServerSession(authOptions);
  // gatilho deploy production
  if (!session || !session.user?.email.endsWith("@starnav.com.br")) {
    redirect("/login");
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
        <OrderList os={serviceOrders} />
      </div>
    </div>
  );
}
