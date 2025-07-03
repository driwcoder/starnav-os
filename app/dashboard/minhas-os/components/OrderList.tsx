// app/dashboard/minhas-os/components/OrderList.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ServiceOrder } from "@prisma/client";

export default function OrderList({ os }: { os: ServiceOrder[] }) {
  if (os.length === 0) {
    return (
      <p className="text-gray-500 mt-4">Nenhuma ordem de serviço encontrada.</p>
    );
  }

  return (
    <div className="space-y-4">
      {os.map((o) => (
        <div
          key={o.id}
          className="border p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h3 className="font-semibold text-lg">{o.title}</h3>
            <p className="text-sm text-gray-600">
              Status:{" "}
              <span className="font-medium">{o.status.replace(/_/g, " ")}</span>{" "}
              • Navio: {o.ship} • Solicitado em: {formatDate(o.requestedAt)}
            </p>
          </div>
          <Link href={`/dashboard/service-orders/${o.id}`}>
            <Button variant="outline" className="mt-2 md:mt-0">
              Ver Detalhes
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
