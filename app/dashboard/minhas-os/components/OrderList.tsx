// app/dashboard/minhas-os/components/OrderList.tsx
"use server";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  OrderStatus,
  ServiceOrder,
  SolutionType,
  UserSector,
} from "@prisma/client";
import { Pencil, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderListProps {
  os: ServiceOrder[];
  userSector: UserSector;
  canEditOrder: ({
    userSector,
    status,
    solutionType,
  }: {
    userSector: UserSector;
    status: OrderStatus;
    solutionType?: SolutionType | null;
  }) => boolean;
}

export default async function OrderList({
  os,
  userSector,
  canEditOrder,
}: OrderListProps) {
  if (os.length === 0) {
    return (
      <p className="text-gray-500 mt-4">Nenhuma ordem de serviço encontrada.</p>
    );
  }

  return (
    <div className="space-y-4">
      {os.map((order) => (
        <div
          key={order.id}
          className="border p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h3 className="font-semibold text-lg">{order.title}</h3>
            <p className="text-sm text-gray-600">
              Status:{" "}
              <span className="font-medium">
                {order.status.replace(/_/g, " ")}
              </span>{" "}
              • Navio: {order.ship} • Solicitado em:{" "}
              {formatDate(order.requestedAt)}
            </p>
          </div>
          <div className="flex justify-end items-center mt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/service-orders/${order.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Link>
                </DropdownMenuItem>
                {canEditOrder({
                  userSector: userSector,
                  status: order.status,
                  solutionType: order.solutionType,
                }) && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/service-orders/${order.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
