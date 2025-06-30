// app/dashboard/service-orders/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeftIcon, FrownIcon } from "lucide-react";
import { OrderStatus, Priority, UserRole, UserSector } from "@prisma/client";

// --- Definição do Schema de Validação com Zod ---
const formSchema = z.object({
  title: z.string().min(3, "O título deve ter no mínimo 3 caracteres.").max(255),
  description: z.string().optional().nullable(),
  ship: z.string().min(1, "O navio é obrigatório."),
  location: z.string().optional().nullable(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"], {
    required_error: "A prioridade é obrigatória.",
  }),
  assignedToId: z.string().uuid("ID do responsável inválido.").optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["PENDENTE", "EM_ANALISE", "APROVADA", "RECUSADA", "EM_EXECUCAO", "AGUARDANDO_PECAS", "CONCLUIDA", "CANCELADA", "PLANEJADA", "AGUARDANDO_SUPRIMENTOS", "CONTRATADA"], {
    required_error: "O status é obrigatório.",
  }),
});

// --- Componente da Página ---
export default function EditServiceOrderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: null,
      ship: "",
      location: null,
      priority: "MEDIA",
      assignedToId: null,
      dueDate: null,
      status: "PENDENTE",
    },
  });

  // ✅ CORREÇÃO: Função auxiliar para verificar permissão para EDIÇÃO
  const hasEditPermission = (userRole: UserRole | undefined, userSector: UserSector | undefined) => {
    if (!userRole || !userSector) return false;
    if (userRole === UserRole.ADMIN) return true;

    // ✅ CORREÇÃO: Incluindo TODOS os novos cargos de comprador e tripulação
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
    // ✅ CORREÇÃO: Incluindo TODOS os setores válidos para edição
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

    return allowedEditRoles.includes(userRole) && allowedEditSectors.includes(userSector);
  };


  useEffect(() => {
    if (!id) return;

    async function fetchServiceOrder() {
      setLoading(true);
      setError(null);
      try {
        if (status === "loading") return;
        if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br")) {
            toast.error("Acesso negado. Por favor, faça login.");
            router.push("/login");
            return;
        }
        if (!hasEditPermission(session?.user?.role, session?.user?.sector)) {
          toast.error("Você não tem permissão para editar esta Ordem de Serviço.");
          router.push("/dashboard");
          return;
        }


        const response = await fetch(`/api/service-orders/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao carregar Ordem de Serviço.");
        }
        const data = await response.json();

        form.reset({
          title: data.title,
          description: data.description,
          ship: data.ship,
          location: data.location,
          priority: data.priority,
          assignedToId: data.assignedToId || null,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : null,
          status: data.status,
        });
      } catch (err: any) {
        setError(err.message || "Não foi possível carregar a Ordem de Serviço.");
        toast.error("Erro ao carregar OS: " + (err.message || "Erro desconhecido."));
      } finally {
        setLoading(false);
      }
    }
    fetchServiceOrder();
  }, [id, form, session, status, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br") || !hasEditPermission(session?.user?.role, session?.user?.sector)) {
      toast.error("Você não tem permissão para realizar esta ação.");
      router.push("/dashboard");
      return;
    }

    try {
      const payload = {
        ...values,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
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

  if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br") || !hasEditPermission(session?.user?.role, session?.user?.sector)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">Você não tem permissão para acessar esta página ou seu acesso é restrito.</p>
        <Button onClick={() => router.push("/login")}>Ir para Login</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Carregando dados da Ordem de Serviço...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Erro ao Carregar OS</h2>
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
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Ordem de Serviço Não Encontrada</h2>
        <p className="text-gray-500 mb-6">A Ordem de Serviço com o ID "{id}" não existe ou foi removida.</p>
        <Link href="/dashboard/service-orders">
          <Button>Voltar para a lista de OS</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Editar Ordem de Serviço</CardTitle>
          <CardDescription className="text-center">ID: {id}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Título da OS</Label>
              <Input
                id="title"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
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
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ship">Navio</Label>
              <Input
                id="ship"
                {...form.register("ship")}
              />
              {form.formState.errors.ship && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.ship.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Localização (Opcional)</Label>
              <Input
                id="location"
                {...form.register("location")}
              />
              {form.formState.errors.location && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.location.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                onValueChange={(value) => form.setValue("priority", value as any)}
                value={form.watch("priority")}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Priority).map((priorityValue) => (
                    <SelectItem key={priorityValue} value={priorityValue}>
                      {priorityValue.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.priority.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dueDate">Data de Prazo (Opcional)</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.dueDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) => form.setValue("status", value as any)}
                value={form.watch("status")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrderStatus).map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {statusValue.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.status.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Link href={`/dashboard/service-orders/${id}`}>
                <Button type="button" variant="outline" className="flex items-center gap-2">
                    <ArrowLeftIcon className="h-4 w-4" /> Voltar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}