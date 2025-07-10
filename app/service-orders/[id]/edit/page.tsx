// app/service-orders/[id]/edit/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeftIcon, FrownIcon, PaperclipIcon } from "lucide-react";
import {
  OrderStatus,
  Priority,
  UserRole,
  UserSector,
  SolutionType,
} from "@prisma/client";
import { canEditOs, isValidStatusTransition } from "@/lib/permissions";
import { ConfirmDeleteAttachment } from "@/components/confirm-delete-attachment";
import { PutBlobResult } from "@vercel/blob";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// --- Definição do Schema de Validação com Zod ---
const formSchema = z.object({
  title: z
    .string()
    .min(3, "O título deve ter no mínimo 3 caracteres.")
    .max(255),
  description: z.string().optional().nullable(),
  scopeOfService: z.string().optional().nullable(),
  ship: z.string().min(1, "O navio é obrigatório."),
  location: z.string().optional().nullable(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"], {
    required_error: "A prioridade é obrigatória.",
  }),
  assignedToId: z
    .string()
    .uuid("ID do responsável inválido.")
    .optional()
    .nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(
    [
      "PENDENTE",
      "EM_ANALISE",
      "APROVADA",
      "RECUSADA",
      "EM_EXECUCAO",
      "AGUARDANDO_MATERIAL",
      "CONCLUIDA",
      "CANCELADA",
      "PLANEJADA",
      "AGUARDANDO_SUPRIMENTOS",
      "CONTRATADA",
    ],
    {
      required_error: "O status é obrigatório.",
    }
  ),
  plannedStartDate: z.string().optional().nullable(),
  plannedEndDate: z.string().optional().nullable(),
  solutionType: z.nativeEnum(SolutionType).optional().nullable(),
  responsibleCrew: z.string().optional().nullable(),
  coordinatorNotes: z.string().optional().nullable(),
  contractedCompany: z.string().optional().nullable(),
  contractDate: z.string().optional().nullable(),
  serviceOrderCost: z.number().min(0).optional().nullable(),
  supplierNotes: z.string().optional().nullable(),
  reportAttachments: z.array(z.string().url()),
});

// --- Componente da Página ---
export default function EditServiceOrderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<any>(null);

  const [currentOsStatus, setCurrentOsStatus] = useState<OrderStatus | null>(
    null
  );
  const [osCreatedById, setOsCreatedById] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: null,
      scopeOfService: null,
      ship: "",
      location: null,
      priority: "MEDIA",
      assignedToId: null,
      dueDate: null,
      status: "PENDENTE",
      plannedStartDate: null,
      plannedEndDate: null,
      solutionType: null,
      responsibleCrew: null,
      coordinatorNotes: null,
      contractedCompany: null,
      contractDate: null,
      serviceOrderCost: null,
      supplierNotes: null,
      reportAttachments: [],
    },
  });

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    // Só busca se ainda não buscou nesta montagem
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchServiceOrder() {
      setLoading(true);
      setError(null);
      try {
        if (status === "loading") return;
        if (
          status === "unauthenticated" ||
          !(session?.user?.email as string)?.endsWith("@starnav.com.br")
        ) {
          toast.error("Acesso negado. Por favor, faça login.");
          router.push("/auth/login");
          return;
        }

        const response = await fetch(`/api/service-orders/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Erro ao carregar Ordem de Serviço."
          );
        }
        const data = await response.json();

        setCurrentOsStatus(data.status);
        setOsCreatedById(data.createdById);

        if (!canEditOs(data.status, data.createdById, session?.user as any)) {
          toast.error(
            "Você não tem permissão para editar esta Ordem de Serviço com o status atual."
          );
          router.push("/service-orders");
          return;
        }

        form.reset({
          title: data.title,
          description: data.description,
          scopeOfService: data.scopeOfService,
          ship: data.ship,
          location: data.location,
          priority: data.priority,
          assignedToId: data.assignedToId || null,
          dueDate: data.dueDate
            ? new Date(data.dueDate).toISOString().split("T")[0]
            : null,
          status: data.status,
          plannedStartDate: data.plannedStartDate
            ? new Date(data.plannedStartDate).toISOString().split("T")[0]
            : null,
          plannedEndDate: data.plannedEndDate
            ? new Date(data.plannedEndDate).toISOString().split("T")[0]
            : null,
          solutionType: data.solutionType || null,
          responsibleCrew: data.responsibleCrew || null,
          coordinatorNotes: data.coordinatorNotes || null,
          contractedCompany: data.contractedCompany || null,
          contractDate: data.contractDate
            ? new Date(data.contractDate).toISOString().split("T")[0]
            : null,
          serviceOrderCost:
            data.serviceOrderCost !== undefined &&
            data.serviceOrderCost !== null
              ? parseFloat(data.serviceOrderCost)
              : null,
          supplierNotes: data.supplierNotes || null,
          reportAttachments: Array.isArray(data.reportAttachments)
            ? data.reportAttachments
            : [],
        });
      } catch (err: any) {
        setError(
          err.message || "Não foi possível carregar a Ordem de Serviço."
        );
        toast.error(
          "Erro ao carregar OS: " + (err.message || "Erro desconhecido.")
        );
      } finally {
        setLoading(false);
      }
    }
    fetchServiceOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, form, session, status, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Certifique-se de que currentOsStatus e osCreatedById não são null/undefined aqui
    if (
      !currentOsStatus ||
      !osCreatedById ||
      status === "unauthenticated" ||
      !(session?.user?.email as string)?.endsWith("@starnav.com.br") ||
      !canEditOs(currentOsStatus, osCreatedById, session?.user as any)
    ) {
      toast.error("Você não tem permissão para realizar esta ação.");
      router.push("/dashboard");
      return;
    }

    if (values.status !== currentOsStatus) {
      // Se o status foi alterado
      if (
        !isValidStatusTransition(
          currentOsStatus,
          values.status,
          session?.user as any
        )
      ) {
        toast.error(
          `Transição de status de '${currentOsStatus.replace(
            /_/g,
            " "
          )}' para '${values.status.replace(
            /_/g,
            " "
          )}' não permitida para o seu perfil.`
        );
        form.setValue("status", currentOsStatus);
        return;
      }
    }

    try {
      const payload = {
        ...values,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        plannedStartDate: values.plannedStartDate
          ? new Date(values.plannedStartDate).toISOString()
          : null,
        plannedEndDate: values.plannedEndDate
          ? new Date(values.plannedEndDate).toISOString()
          : null,
        contractDate: values.contractDate
          ? new Date(values.contractDate).toISOString()
          : null,
        serviceOrderCost:
          values.serviceOrderCost !== undefined &&
          values.serviceOrderCost !== null
            ? parseFloat(values.serviceOrderCost as any)
            : null,
      };

      const response = await fetch(`/api/service-orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao atualizar Ordem de Serviço.");
        return;
      }

      toast.success("Ordem de Serviço atualizada com sucesso!");
      router.push(`/service-orders/${id}`);
    } catch (err) {
      console.error("Erro ao atualizar OS:", err);
      toast.error("Erro de rede ao atualizar OS.");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Verificando autenticação...</p>
      </div>
    );
  }

  if (
    status === "unauthenticated" ||
    !(session?.user?.email as string)?.endsWith("@starnav.com.br")
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">
          Você precisa estar logado para acessar esta página.
        </p>
        <Button onClick={() => router.push("/auth/login")}>Ir para Login</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">
          Carregando dados da Ordem de Serviço...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">
          Erro ao Carregar OS
        </h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/service-orders">
          <Button>Voltar para a lista de OS</Button>
        </Link>
      </div>
    );
  }

  // ✅ NOVO: Geração da lista de status disponíveis para transição
  const getAvailableNextStatuses = (
    current: OrderStatus,
    userSess: any
  ): OrderStatus[] => {
    if (userSess.role === UserRole.ADMIN) {
      return Object.values(OrderStatus); // Admin vê todos os status
    }

    // Mapeamento de transições válidas (copiado de lib/permissions.ts para uso no frontend)
    const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDENTE]: [OrderStatus.EM_ANALISE, OrderStatus.RECUSADA],
      [OrderStatus.EM_ANALISE]: [
        OrderStatus.APROVADA,
        OrderStatus.RECUSADA,
        OrderStatus.PLANEJADA,
      ],
      [OrderStatus.APROVADA]: [OrderStatus.PLANEJADA, OrderStatus.EM_EXECUCAO],
      [OrderStatus.PLANEJADA]: [
        OrderStatus.AGUARDANDO_SUPRIMENTOS,
        OrderStatus.EM_EXECUCAO,
      ],
      [OrderStatus.AGUARDANDO_SUPRIMENTOS]: [
        OrderStatus.CONTRATADA,
        OrderStatus.AGUARDANDO_MATERIAL,
        OrderStatus.CANCELADA,
      ],
      [OrderStatus.CONTRATADA]: [
        OrderStatus.EM_EXECUCAO,
        OrderStatus.CANCELADA,
      ],
      [OrderStatus.EM_EXECUCAO]: [
        OrderStatus.CONCLUIDA,
        OrderStatus.AGUARDANDO_MATERIAL,
        OrderStatus.CANCELADA,
      ],
      [OrderStatus.AGUARDANDO_MATERIAL]: [
        OrderStatus.EM_EXECUCAO,
        OrderStatus.CANCELADA,
      ],
      [OrderStatus.CONCLUIDA]: [OrderStatus.APROVADA, OrderStatus.CANCELADA],
      [OrderStatus.CANCELADA]: [OrderStatus.PENDENTE],
      [OrderStatus.RECUSADA]: [OrderStatus.PENDENTE],
    };

    const nextStatuses = VALID_STATUS_TRANSITIONS[current] || [];

    // Filtrar com base no perfil do usuário
    switch (userSess.sector) {
      case UserSector.TRIPULACAO:
        const allowedTripulacaoStatus: OrderStatus[] = [
          OrderStatus.EM_ANALISE,
          OrderStatus.CONCLUIDA,
          OrderStatus.AGUARDANDO_MATERIAL,
          OrderStatus.PENDENTE,
          OrderStatus.RECUSADA,
          OrderStatus.EM_EXECUCAO,
        ];
        return nextStatuses.filter((s) => allowedTripulacaoStatus.includes(s));

      case UserSector.MANUTENCAO:
      case UserSector.OPERACAO:
        const allowedManutencaoOperacaoStatus: OrderStatus[] = [
          OrderStatus.EM_ANALISE,
          OrderStatus.APROVADA,
          OrderStatus.RECUSADA,
          OrderStatus.PLANEJADA,
          OrderStatus.AGUARDANDO_SUPRIMENTOS,
          OrderStatus.EM_EXECUCAO,
          OrderStatus.AGUARDANDO_MATERIAL,
          OrderStatus.CONCLUIDA,
          OrderStatus.CANCELADA,
          OrderStatus.PENDENTE,
        ];
        return nextStatuses.filter((s) =>
          allowedManutencaoOperacaoStatus.includes(s)
        );

      case UserSector.SUPRIMENTOS:
        const allowedSuprimentosStatus: OrderStatus[] = [
          OrderStatus.CONTRATADA,
          OrderStatus.EM_EXECUCAO,
          OrderStatus.AGUARDANDO_MATERIAL,
          OrderStatus.CANCELADA,
          OrderStatus.AGUARDANDO_SUPRIMENTOS, // Incluir AGUARDANDO_SUPRIMENTOS se eles precisam ver/interagir com ele
        ];
        return nextStatuses.filter((s) => allowedSuprimentosStatus.includes(s));
      default:
        return [];
    }
  };

  if (
    !form.getValues("title") ||
    !currentOsStatus ||
    !canEditOs(currentOsStatus, osCreatedById!, session?.user as any)
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Acesso Negado ou OS Não Encontrada
        </h2>
        <p className="text-gray-500 mb-6">
          Você não tem permissão para editar esta Ordem de Serviço com o status
          atual, ou a OS não existe/foi removida.
        </p>
        <Link href="/service-orders">
          <Button>Voltar para a lista de OS</Button>
        </Link>
      </div>
    );
  }

  const availableStatusOptions = currentOsStatus
    ? getAvailableNextStatuses(currentOsStatus, session?.user as any)
    : [];

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Editar Ordem de Serviço
          </CardTitle>
          <CardDescription className="text-center">ID: {id}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da OS</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scopeOfService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escopo de Serviço (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhe o escopo de trabalho, o que será feito ou inspecionado."
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Navio</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          form.setValue("priority", value as Priority)
                        }
                        value={form.watch("priority") || ""}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Prioridade">
                            Selecione uma prioridade
                          </SelectItem>
                          {Object.values(Priority).map((priorityValue) => (
                            <SelectItem
                              key={priorityValue}
                              value={priorityValue}
                            >
                              {priorityValue.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazos Final (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          form.setValue("status", value as OrderStatus)
                        }
                        value={form.watch("status") || ""}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* ✅ NOVO: Mostrar o status atual como primeira opção */}
                          {currentOsStatus && (
                            <SelectItem
                              key={currentOsStatus}
                              value={currentOsStatus}
                            >
                              {currentOsStatus.replace(/_/g, " ")} (Atual)
                            </SelectItem>
                          )}

                          {/* ✅ NOVO: Separador visual se houver outras opções */}
                          {availableStatusOptions.length > 0 &&
                            currentOsStatus && (
                              <div className="px-2 py-1 text-xs text-gray-500 border-b">
                                Outras opções:
                              </div>
                            )}

                          {/* ✅ MODIFICADO: Filtra os status para não duplicar o atual */}
                          {availableStatusOptions
                            .filter(
                              (statusValue) => statusValue !== currentOsStatus
                            )
                            .map((statusValue) => (
                              <SelectItem key={statusValue} value={statusValue}>
                                {statusValue.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <hr className="my-4" />

              <h3 className="font-semibold text-lg text-gray-800 col-span-full">
                Planejamento de Atendimento
              </h3>
              <FormField
                control={form.control}
                name="plannedStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início Programado (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plannedEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Término Estimado (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="solutionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Solução</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          form.setValue(
                            "solutionType",
                            value === "" ? null : (value as SolutionType)
                          )
                        }
                        value={form.watch("solutionType") || ""}
                      >
                        <SelectTrigger id="solutionType">
                          <SelectValue placeholder="Selecione o tipo de solução" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Defina">Não Definido</SelectItem>
                          {Object.values(SolutionType).map((typeValue) => (
                            <SelectItem key={typeValue} value={typeValue}>
                              {typeValue.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsibleCrew"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tripulação Responsável (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Equipe de Máquinas Bordo"
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coordinatorNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas do Coordenador (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Anotações importantes sobre o planejamento do atendimento."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {session?.user?.sector === UserSector.SUPRIMENTOS && (
                <>
                  <hr className="my-4 col-span-full" />

                  <h3 className="font-semibold text-lg text-gray-800 col-span-full">
                    Informações de Suprimentos
                  </h3>
                  <FormField
                    control={form.control}
                    name="contractedCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa Contratada (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: XYZ Eletrica Naval"
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Contratação (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceOrderCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo do Serviço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            placeholder="Ex: 3500.00"
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas do Suprimentos (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Anotações do setor de suprimentos sobre a contratação."
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Upload de Relatório/Anexo */}
              <div className="space-y-2">
                <Label className="font-semibold">Anexar Relatório</Label>
                <div className="flex items-center gap-4">
                  <input
                    name="file"
                    ref={inputFileRef}
                    type="file"
                    accept="image/jpeg, image/png, image/webp,application/pdf"
                    className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={async () => {
                      if (!inputFileRef.current?.files?.length) {
                        toast.error("Selecione um arquivo para anexar.");
                        return;
                      }
                      const file = inputFileRef.current.files[0];
                      try {
                        const response = await fetch(
                          `/api/blob/upload?filename=${file.name}`,
                          {
                            method: "POST",
                            body: file,
                          }
                        );
                        if (!response.ok) {
                          toast.error("Falha ao fazer upload do arquivo.");
                          return;
                        }
                        const newBlob =
                          (await response.json()) as PutBlobResult;
                        setBlob(newBlob);
                        form.setValue("reportAttachments", [
                          ...(form.getValues("reportAttachments") || []),
                          newBlob.url,
                        ]);
                        toast.success("Arquivo anexado com sucesso!");
                        if (inputFileRef.current)
                          inputFileRef.current.value = "";
                      } catch (err) {
                        toast.error("Erro ao anexar arquivo.");
                      }
                    }}
                  >
                    <PaperclipIcon className="h-5 w-5" />
                    Anexar
                  </Button>
                </div>
                {blob && (
                  <div className="text-xs text-gray-500">
                    Último anexo:{" "}
                    <a
                      href={blob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {blob.url}
                    </a>
                  </div>
                )}

                {/* Lista de anexos já existentes */}
                <div className="mt-6">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    Anexos da Ordem de Serviço
                  </h3>
                  {form.watch("reportAttachments")?.length > 0 ? (
                    <ul className="space-y-2">
                      {form.watch("reportAttachments").map((url, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline break-all"
                          >
                            {url.split("/").pop()}
                          </a>
                          <ConfirmDeleteAttachment
                            fileUrl={url}
                            onConfirm={async () => {
                              try {
                                const res = await fetch(`/api/blob/delete`, {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ url }),
                                });

                                if (!res.ok) {
                                  throw new Error("Erro ao excluir o arquivo.");
                                }

                                const updated =
                                  form
                                    .getValues("reportAttachments")
                                    ?.filter((_, i) => i !== index) || [];
                                form.setValue("reportAttachments", updated);
                              } catch (error) {
                                toast.error("Erro ao excluir o anexo.");
                              }
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Nenhum anexo cadastrado.</p>
                  )}
                  {form.formState.errors.reportAttachments && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.reportAttachments.message}
                    </p>
                  )}
                </div>
              </div>
              {/* Fim do Upload de Relatório/Anexo */}

              {/* Botões de Ação */}
              <div className="flex gap-4 col-span-full mt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Salvando..."
                    : "Salvar Alterações"}
                </Button>
                <Link href={`/service-orders/${id}`}>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeftIcon className="h-4 w-4" /> Voltar
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
