// app/dashboard/service-orders/[id]/edit/page.tsx
"use client";

import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
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
import { ConfirmDeleteAttachment } from "@/components/confirm-delete-attachment";
import { PutBlobResult } from "@vercel/blob";

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
      "AGUARDANDO_PECAS",
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
  const [serviceOrder, setServiceOrder] = useState<any>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<any>(null);

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

  const hasEditPermission = (
    userRole: UserRole | undefined,
    userSector: UserSector | undefined
  ) => {
    if (!userRole || !userSector) return false;
    if (userRole === UserRole.ADMIN) return true;

    const allowedEditRoles = [
      UserRole.GESTOR,
      UserRole.SUPERVISOR,
      UserRole.COORDENADOR,
      UserRole.COMPRADOR_JUNIOR,
      UserRole.COMPRADOR_PLENO,
      UserRole.COMPRADOR_SENIOR,
      UserRole.COMANDANTE,
      UserRole.IMEDIATO,
      UserRole.OQN,
      UserRole.CHEFE_MAQUINAS,
      UserRole.SUB_CHEFE_MAQUINAS,
      UserRole.OQM,
      UserRole.ASSISTENTE,
      UserRole.AUXILIAR,
      UserRole.ESTAGIARIO,
    ];
    const allowedEditSectors = [
      UserSector.ADMINISTRACAO,
      UserSector.MANUTENCAO,
      UserSector.OPERACAO,
      UserSector.SUPRIMENTOS,
      UserSector.TRIPULACAO,
      UserSector.ALMOXARIFADO,
      UserSector.RH,
      UserSector.TI,
      UserSector.NAO_DEFINIDO,
    ];

    return (
      allowedEditRoles.includes(userRole) &&
      allowedEditSectors.includes(userSector)
    );
  };

  // Função de permissão igual...

  // 1. Buscar dados da OS apenas quando necessário
  useEffect(() => {
    if (!id || status === "loading") return;

    if (
      status === "unauthenticated" ||
      !(session?.user?.email as string)?.endsWith("@starnav.com.br")
    ) {
      toast.error("Acesso negado. Por favor, faça login.");
      router.push("/login");
      return;
    }
    if (!hasEditPermission(session?.user?.role, session?.user?.sector)) {
      toast.error("Você não tem permissão para editar esta Ordem de Serviço.");
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/service-orders/${id}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Erro ao carregar Ordem de Serviço."
          );
        }
        return response.json();
      })
      .then((data) => {
        setServiceOrder(data);
        setError(null);
      })
      .catch((err: any) => {
        setError(
          err.message || "Não foi possível carregar a Ordem de Serviço."
        );
        toast.error(
          "Erro ao carregar OS: " + (err.message || "Erro desconhecido.")
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    status,
    session?.user?.email,
    session?.user?.role,
    session?.user?.sector,
    router,
  ]);

  // 2. Resetar o formulário apenas quando serviceOrder mudar
  useEffect(() => {
    if (!serviceOrder) return;
    form.reset({
      title: serviceOrder.title,
      description: serviceOrder.description,
      scopeOfService: serviceOrder.scopeOfService,
      ship: serviceOrder.ship,
      location: serviceOrder.location,
      priority: serviceOrder.priority,
      assignedToId: serviceOrder.assignedToId || null,
      dueDate: serviceOrder.dueDate
        ? new Date(serviceOrder.dueDate).toISOString().split("T")[0]
        : null,
      status: serviceOrder.status,
      plannedStartDate: serviceOrder.plannedStartDate
        ? new Date(serviceOrder.plannedStartDate).toISOString().split("T")[0]
        : null,
      plannedEndDate: serviceOrder.plannedEndDate
        ? new Date(serviceOrder.plannedEndDate).toISOString().split("T")[0]
        : null,
      solutionType: serviceOrder.solutionType || null,
      responsibleCrew: serviceOrder.responsibleCrew || null,
      coordinatorNotes: serviceOrder.coordinatorNotes || null,
      contractedCompany: serviceOrder.contractedCompany || null,
      contractDate: serviceOrder.contractDate
        ? new Date(serviceOrder.contractDate).toISOString().split("T")[0]
        : null,
      serviceOrderCost:
        serviceOrder.serviceOrderCost !== undefined &&
        serviceOrder.serviceOrderCost !== null
          ? parseFloat(serviceOrder.serviceOrderCost)
          : null,
      supplierNotes: serviceOrder.supplierNotes || null,
      reportAttachments: serviceOrder.reportAttachments || [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceOrder]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (
    values
  ) => {
    if (
      status === "unauthenticated" ||
      !(session?.user?.email as string)?.endsWith("@starnav.com.br") ||
      !hasEditPermission(session?.user?.role, session?.user?.sector)
    ) {
      toast.error("Você não tem permissão para realizar esta ação.");
      router.push("/dashboard");
      return;
    }

    try {
      const payload = {
        ...values,
        reportAttachments: values.reportAttachments || [],
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
      router.push(`/dashboard/service-orders/${id}`);
    } catch (err) {
      console.error("Erro ao atualizar OS:", err);
      toast.error("Erro de rede ao atualizar Ordem de Serviço.");
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
    !(session?.user?.email as string)?.endsWith("@starnav.com.br") ||
    !hasEditPermission(session?.user?.role, session?.user?.sector)
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">
          Você não tem permissão para acessar esta página ou seu acesso é
          restrito.
        </p>
        <Button onClick={() => router.push("/login")}>Ir para Login</Button>
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
        <Link href="/dashboard/service-orders">
          <Button>Voltar para a lista de OS</Button>
        </Link>
      </div>
    );
  }

  if (!form.getValues("title")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Ordem de Serviço Não Encontrada
        </h2>
        <p className="text-gray-500 mb-6">
          A Ordem de Serviço com o ID "{id}" não existe ou foi removida.
        </p>
        <Link href="/dashboard/service-orders">
          <Button>Voltar para a lista de OS</Button>
        </Link>
      </div>
    );
  }

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
          <form
            onSubmit={form.handleSubmit(
              onSubmit as SubmitHandler<z.infer<typeof formSchema>>
            )}
            className="space-y-6"
          >
            {/* Campos Existentes */}
            <div>
              <Label htmlFor="title">Título da OS</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                rows={4}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="scopeOfService">
                Escopo de Serviço (Opcional)
              </Label>
              <Textarea
                id="scopeOfService"
                {...form.register("scopeOfService")}
                placeholder="Detalhe o escopo de trabalho, o que será feito ou inspecionado."
                rows={3}
              />
              {form.formState.errors.scopeOfService && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.scopeOfService.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="ship">Navio</Label>
              <Input id="ship" {...form.register("ship")} />
              {form.formState.errors.ship && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.ship.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Localização (Opcional)</Label>
              <Input id="location" {...form.register("location")} />
              {form.formState.errors.location && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("priority", value as Priority)
                }
                value={form.watch("priority") || "MEDIA"} // ✅ Adicionado || "" para lidar com null/undefined
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prioridade">
                    Selecione uma prioridade
                  </SelectItem>{" "}
                  {/* ✅ Placeholder com valor vazio */}
                  {Object.values(Priority).map((priorityValue) => (
                    <SelectItem key={priorityValue} value={priorityValue}>
                      {priorityValue.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dueDate">Prazo Final (Opcional)</Label>
              <Input id="dueDate" type="date" {...form.register("dueDate")} />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.dueDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("status", value as OrderStatus)
                }
                value={form.watch("status") || "MEDIA"} // ✅ Adicionado || "" para lidar com null/undefined
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Atualize o Status">
                    Selecione um status
                  </SelectItem>{" "}
                  {/* ✅ Placeholder com valor vazio */}
                  {Object.values(OrderStatus).map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {statusValue.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>

            <hr className="my-4" />

            <h3 className="font-semibold text-lg text-gray-800 col-span-full">
              Planejamento de Atendimento
            </h3>
            <div>
              <Label htmlFor="plannedStartDate">
                Início Programado (Opcional)
              </Label>
              <Input
                id="plannedStartDate"
                type="date"
                {...form.register("plannedStartDate")}
              />
              {form.formState.errors.plannedStartDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.plannedStartDate.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="plannedEndDate">
                Término Estimado (Opcional)
              </Label>
              <Input
                id="plannedEndDate"
                type="date"
                {...form.register("plannedEndDate")}
              />
              {form.formState.errors.plannedEndDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.plannedEndDate.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="solutionType">Tipo de Solução</Label>
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
                  <SelectItem value="Selecione...">Não Definido</SelectItem>
                  {Object.values(SolutionType).map((typeValue) => (
                    <SelectItem key={typeValue} value={typeValue}>
                      {typeValue.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.solutionType && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.solutionType.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="responsibleCrew">
                Tripulação Responsável (Opcional)
              </Label>
              <Input
                id="responsibleCrew"
                {...form.register("responsibleCrew")}
                placeholder="Ex: Equipe de Máquinas Bordo"
              />
              {form.formState.errors.responsibleCrew && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.responsibleCrew.message}
                </p>
              )}
            </div>
            <div className="col-span-full">
              <Label htmlFor="coordinatorNotes">
                Notas do Coordenador (Opcional)
              </Label>
              <Textarea
                id="coordinatorNotes"
                {...form.register("coordinatorNotes")}
                rows={3}
                placeholder="Anotações importantes sobre o planejamento do atendimento."
              />
              {form.formState.errors.coordinatorNotes && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.coordinatorNotes.message}
                </p>
              )}
            </div>

            <hr className="my-4 col-span-full" />

            {session?.user.sector === "SUPRIMENTOS" && (
              <>
                <h3 className="font-semibold text-lg text-gray-800 col-span-full">
                  Informações de Suprimentos
                </h3>
                <div>
                  <Label htmlFor="contractedCompany">
                    Empresa Contratada (Opcional)
                  </Label>
                  <Input
                    id="contractedCompany"
                    {...form.register("contractedCompany")}
                    placeholder="Ex: XYZ Eletrica Naval"
                  />
                  {form.formState.errors.contractedCompany && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.contractedCompany.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contractDate">
                    Data da Contratação (Opcional)
                  </Label>
                  <Input
                    id="contractDate"
                    type="date"
                    {...form.register("contractDate")}
                  />
                  {form.formState.errors.contractDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.contractDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="serviceOrderCost">
                    Custo do Serviço (R$)
                  </Label>
                  <Input
                    id="serviceOrderCost"
                    type="number"
                    step="0.01"
                    {...form.register("serviceOrderCost", {
                      valueAsNumber: true,
                    })}
                    placeholder="Ex: 3500.00"
                  />
                  {form.formState.errors.serviceOrderCost && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.serviceOrderCost.message}
                    </p>
                  )}
                </div>

                <div className="col-span-full">
                  <Label htmlFor="supplierNotes">
                    Notas do Suprimentos (Opcional)
                  </Label>
                  <Textarea
                    id="supplierNotes"
                    {...form.register("supplierNotes")}
                    rows={3}
                    placeholder="Anotações do setor de suprimentos sobre a contratação."
                  />
                  {form.formState.errors.supplierNotes && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.supplierNotes.message}
                    </p>
                  )}
                </div>
              </>
            )}
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
              <Link href={`/dashboard/service-orders/${id}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" /> Voltar
                </Button>
              </Link>
            </div>

            {/* Upload de Relatório/Anexo */}
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
                      const newBlob = (await response.json()) as PutBlobResult;
                      setBlob(newBlob);
                      form.setValue("reportAttachments", [
                        ...(form.getValues("reportAttachments") || []),
                        newBlob.url,
                      ]);
                      toast.success("Arquivo anexado com sucesso!");
                      if (inputFileRef.current) inputFileRef.current.value = "";
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
