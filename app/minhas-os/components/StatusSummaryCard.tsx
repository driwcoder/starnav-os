// app/minhas-os/components/StatusSummaryCard.tsx
"use client";

import { OrderStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Clock, Loader, XCircle } from "lucide-react";
import { JSX } from "react";

const statusIcons: Record<OrderStatus, JSX.Element> = {
  PENDENTE: <Clock className="h-6 w-6 text-yellow-500" />,
  EM_ANALISE: <Clock className="h-6 w-6 text-blue-500" />,
  APROVADA: <BadgeCheck className="h-6 w-6 text-green-500" />,
  RECUSADA: <XCircle className="h-6 w-6 text-red-500" />,
  PLANEJADA: <Clock className="h-6 w-6 text-indigo-500" />,
  AGUARDANDO_SUPRIMENTOS: <Clock className="h-6 w-6 text-orange-500" />,
  CONTRATADA: <Clock className="h-6 w-6 text-violet-500" />,
  EM_EXECUCAO: <Loader className="h-6 w-6 text-blue-600 animate-spin" />,
  AGUARDANDO_MATERIAL: <Clock className="h-6 w-6 text-pink-500" />,
  CONCLUIDA: <BadgeCheck className="h-6 w-6 text-green-600" />,
  CANCELADA: <XCircle className="h-6 w-6 text-gray-500" />,
};

export default function StatusSummaryCard({
  status,
  count,
}: {
  status: OrderStatus;
  count: number;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">
          {status.replace(/_/g, " ")}
        </CardTitle>
        {statusIcons[status]}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{count}</p>
      </CardContent>
    </Card>
  );
}
