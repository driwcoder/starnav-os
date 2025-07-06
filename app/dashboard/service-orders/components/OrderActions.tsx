"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserSector, OrderStatus, SolutionType } from "@prisma/client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, PencilIcon } from "lucide-react";

interface OrderActionsProps {
  userSector: UserSector;
  status: OrderStatus;
  solutionType: SolutionType | null;
  orderId: string | number;
}

function canEditOrder({
  userSector,
  status,
  solutionType,
}: {
  userSector: UserSector;
  status: OrderStatus;
  solutionType: SolutionType;
}) {
  if (userSector === "TRIPULACAO") {
    if (["PENDENTE", "RECUSADA"].includes(status)) return true;
    if (status === "EM_EXECUCAO" && solutionType === "INTERNA") return true;
    return false;
  }
  if (["MANUTENCAO", "OPERACAO"].includes(userSector)) {
    return ["PENDENTE", "APROVADA", "RECUSADA", "PLANEJADA", "EM_ANALISE"].includes(status);
  }
  if (userSector === "SUPRIMENTOS") {
    return ["AGUARDANDO_SUPRIMENTOS", "CONTRATADA"].includes(status);
  }
  return false;
}

export function OrderActions({ userSector, status, solutionType, orderId }: OrderActionsProps) {
  const canEdit = canEditOrder({ userSector, status, solutionType: solutionType ?? "INTERNA" });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/service-orders/${orderId}`}>
            <Eye className="mr-2 h-4 w-4" /> Ver
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          disabled={!canEdit}
          onSelect={e => {
            if (!canEdit) {
              e.preventDefault();
              toast.error("Você não tem permissão para editar esta Ordem de Serviço.");
            }
          }}
        >
          <Link href={canEdit ? `/dashboard/service-orders/${orderId}/edit` : "#"}>
            <PencilIcon className="mr-2 h-4 w-4" /> Editar
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}