// app/minhas-os/components/StatusFilter.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronDown, SaveIcon } from "lucide-react";

const ALL_STATUSES: OrderStatus[] = [
  OrderStatus.PENDENTE,
  OrderStatus.EM_ANALISE,
  OrderStatus.APROVADA,
  OrderStatus.RECUSADA,
  OrderStatus.PLANEJADA,
  OrderStatus.AGUARDANDO_SUPRIMENTOS,
  OrderStatus.CONTRATADA,
  OrderStatus.EM_EXECUCAO,
  OrderStatus.AGUARDANDO_MATERIAL,
  OrderStatus.CONCLUIDA,
  OrderStatus.CANCELADA,
];

interface StatusFilterProps {
  currentFilter: string[]; // ✅ Recebe os status filtrados da URL
}

export default function StatusFilter({ currentFilter }: StatusFilterProps) {
  const [selected, setSelected] = useState<OrderStatus[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ NOVO: Sincroniza o estado local com o filtro da URL
  useEffect(() => {
    // Se a URL já tiver um filtro, usa ele. Caso contrário, tenta do localStorage.
    // Se nenhum, seleciona todos por padrão.
    if (
      currentFilter &&
      currentFilter.length > 0 &&
      currentFilter[0] !== "TODOS"
    ) {
      setSelected(currentFilter as OrderStatus[]);
    } else {
      const stored = localStorage.getItem("minhasOsStatusFilter"); // ✅ NOVO: Chave específica para evitar conflitos
      if (stored) {
        setSelected(JSON.parse(stored));
      } else {
        setSelected(ALL_STATUSES);
      }
    }
  }, [currentFilter]); // Depende do currentFilter da URL

  const toggleStatus = (status: OrderStatus) => {
    setSelected((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const savePreferences = async () => {
    localStorage.setItem("minhasOsStatusFilter", JSON.stringify(selected)); // ✅ NOVO: Chave específica

    // Salva no banco de dados via API
    try {
      const res = await fetch("/api/dashboard-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statuses: selected }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Erro ao salvar preferências no banco. Detalhes: ${errorText}`
        );
      }
      toast.success("Preferências salvas.");
    } catch (error: any) {
      toast.error(
        `Erro ao salvar preferências no banco de dados. ${error?.message || ""}`
      );
    }

    // ✅ NOVO: Atualiza a URL para que o Server Component possa reagir
    startTransition(() => {
      const newSearchParams = new URLSearchParams(window.location.search);
      if (selected.length === ALL_STATUSES.length || selected.length === 0) {
        // Se todos ou nenhum selecionado, remove o filtro
        newSearchParams.delete("statusFilter");
      } else {
        newSearchParams.set("statusFilter", selected.join(",")); // Salva como string separada por vírgulas
      }
      router.replace(`?${newSearchParams.toString()}`);
    });
  };

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="relative w-full sm:w-[300px]" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setOpen((prev) => !prev)}
        >
          Selecionar status
          <ChevronDown
            className={`ml-auto transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </Button>
        {open && (
          <div className="absolute z-10 mt-2 w-full bg-popover border rounded shadow max-h-[300px] overflow-y-auto p-2">
            <div
              className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer font-semibold"
              onClick={() => {
                if (selected.length === ALL_STATUSES.length) {
                  setSelected([]);
                } else {
                  setSelected(ALL_STATUSES);
                }
              }}
            >
              <Checkbox
                checked={selected.length === ALL_STATUSES.length}
                ref={(el) => {
                  if (el && "indeterminate" in el) {
                    (el as HTMLInputElement).indeterminate =
                      selected.length > 0 &&
                      selected.length < ALL_STATUSES.length;
                  }
                }}
              />
              <span className="capitalize text-sm">
                {selected.length === ALL_STATUSES.length
                  ? "Desmarcar todos"
                  : "Marcar todos"}
              </span>
            </div>
            <hr className="my-2" />
            {ALL_STATUSES.map((status) => (
              <div
                key={status}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                onClick={() => toggleStatus(status)}
              >
                <Checkbox checked={selected.includes(status)} />
                <span className="capitalize text-sm">
                  {status.replace(/_/g, " ").toLowerCase()}
                </span>
              </div>
            ))}
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelected([]);
                  setOpen(false);
                }}
              >
                Limpar
              </Button>
              <Button variant="outline" size="sm" className="ml-2" onClick={() => setOpen(false)}>
                Fechar
              </Button>
              <Button
                size="sm"
                className="ml-2"
                variant="outline"
                onClick={() => {
                  savePreferences();
                  setOpen(false);
                }}
                disabled={isPending || selected.length === 0}
              >
                {isPending ? "Salvando..." : <SaveIcon />}
              </Button>
            </div>
          </div>
        )}
      </div>
      <Button
        onClick={() => {
          savePreferences();
          setOpen(false);
        }}
        disabled={isPending || selected.length === 0}
      >
        {isPending ? "Salvando..." : <>Salvar <SaveIcon /></>}
      </Button>
    </div>
  );
}
