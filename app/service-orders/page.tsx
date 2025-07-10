// app/service-orders/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, SearchIcon, XIcon } from "lucide-react";
import {
  UserSector,
  OrderStatus,
  SolutionType,
  Priority,
} from "@prisma/client";
import { OrderActions } from "./components/OrderActions";
import { SiteHeader } from "@/components/site-header";

interface ServiceOrdersPageProps {
  searchParams: any;
}

export default async function ServiceOrdersPage({
  searchParams,
}: ServiceOrdersPageProps) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !(session.user?.email as string)?.endsWith("@starnav.com.br")
  ) {
    redirect("/auth/login");
  }

  const userSector = session?.user?.sector; // obtenha do session
  const actualSearchParams = await searchParams;
  const query = actualSearchParams?.query || "";
  const statusFilter = actualSearchParams?.status || "";
  const priorityFilter = actualSearchParams?.priority || "";
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

  if (priorityFilter && priorityFilter !== "TODAS") {
    if (Object.values(Priority).includes(priorityFilter as Priority)) {
      whereClause.priority = priorityFilter;
    }
  }

  const serviceOrders = await prisma.serviceOrder.findMany({
    where: whereClause,
    orderBy: {
      requestedAt: "desc",
    },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
      assignedTo: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <div className="container mx-auto py-8">
      <SiteHeader />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Ordens de Serviço</h2>
        <Link href="/service-orders/new">
          <Button>
            <Plus /> Nova OS
          </Button>
        </Link>
      </div>

      <div className="mb-6 rounded-md border p-4 bg-white shadow-sm">
        <form
          action="/service-orders"
          method="GET"
          className="space-y-4"
        >
          <div className="relative">
            <Input
              type="text"
              name="query"
              placeholder="Buscar por título, navio ou descrição..."
              defaultValue={query}
              className="pl-10"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            {query && (
              <Link
                href="/service-orders"
                passHref
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-5 w-5" />
              </Link>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 ">
            <div className="">
              <Select name="status" defaultValue={statusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Status</SelectItem>
                  {Object.values(OrderStatus).map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {statusValue.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-2">
              <Select name="priority" defaultValue={priorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Prioridades</SelectItem>
                  {Object.values(Priority).map((priorityValue) => (
                    <SelectItem key={priorityValue} value={priorityValue}>
                      {priorityValue.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="md:w-auto">
              Aplicar Filtros
            </Button>
          </div>
        </form>
      </div>

      {serviceOrders.length === 0 ? (
        <p className="text-center text-gray-600 mt-8">
          Nenhuma Ordem de Serviço encontrada com os filtros aplicados.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Navio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Solicitado Por</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.id.substring(0, 6)}...
                  </TableCell>
                  <TableCell>{order.title}</TableCell>
                  <TableCell>{order.ship}</TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold ${
                        order.status === "CONCLUIDA"
                          ? "text-green-600"
                          : order.status === "PENDENTE"
                          ? "text-yellow-600"
                          : order.status === "EM_EXECUCAO"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold ${
                        order.priority === "URGENTE"
                          ? "text-red-600"
                          : order.priority === "ALTA"
                          ? "text-orange-600"
                          : "text-gray-600"
                      }`}
                    >
                      {order.priority.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.createdBy?.name || order.createdBy?.email}
                  </TableCell>
                  <TableCell>
                    {order.dueDate ? formatDate(order.dueDate) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <OrderActions
                      userSector={userSector}
                      status={order.status}
                      solutionType={order.solutionType}
                      orderId={order.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
