"use client";

import { useEffect, useState } from "react";
import { OrderStatus } from "@prisma/client";
import StatusSummaryCard from "./StatusSummaryCard";

interface Props {
  resumo: Record<OrderStatus, number>;
}

export default function VisibleCards({ resumo }: Props) {
  const [visibleStatuses, setVisibleStatuses] = useState<OrderStatus[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("statusFilter");
    const parsed = stored ? JSON.parse(stored) : Object.keys(resumo);
    setVisibleStatuses(parsed);
  }, []);

  return (
    <>
      {Object.entries(resumo)
        .filter(
          ([status, count]) =>
            visibleStatuses.includes(status as OrderStatus) && count > 0
        )
        .map(([status, count]) => (
          <StatusSummaryCard
            key={status}
            status={status as OrderStatus}
            count={count}
          />
        ))}
    </>
  );
}
