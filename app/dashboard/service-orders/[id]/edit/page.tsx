// app/dashboard/service-orders/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// Reutiliza o schema de validação, mas ajusta para edição
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
  status: z.enum(["PENDENTE", "EM_ANALISE", "APROVADA", "RECUSADA", "EM_EXECUCAO", "AGUARDANDO_PECAS", "CONCLUIDA", "CANCELADA"], {
    required_error: "O status é obrigatório.",
  }),
});

// Remove a interface EditServiceOrderPageProps pois usaremos useParams()
// interface EditServiceOrderPageProps {
//   params: {
//     id: string;
//   };
// }

export default function EditServiceOrderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const params = useParams(); // Obtenha os parâmetros da URL usando useParams()
  const id = params.id as string; // Acesse o ID diretamente. O useParams() retorna um objeto síncrono.

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

  useEffect(() => {
    if (!id) {
        // Se o ID ainda não estiver disponível (ex: durante a primeira renderização), não faça nada.
        // Isso pode acontecer se a rota não tiver um ID ou se a hidratação ainda estiver pendente.
        return;
    }

    async function fetchServiceOrder() {
      setLoading(true);
      setError(null);
      try {
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
  }, [id, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      toast.error("Você precisa estar logado para editar uma Ordem de Serviço.");
      router.push("/login");
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Carregando Ordem de Serviço...</p>
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
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.priority.message}</p>
              )}
            </div>

            {/* Campo para Atribuir a (ainda sem busca de usuários reais) */}
            {/* <div>
              <Label htmlFor="assignedTo">Atribuído a (Opcional)</Label>
              <Select
                onValueChange={(value) => form.setValue("assignedToId", value === "" ? null : value)}
                value={form.watch("assignedToId") || ""}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não Atribuído</SelectItem>
                  {/* usuários reais viriam aqui *}
                </SelectContent>
              </Select>
              {form.formState.errors.assignedToId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.assignedToId.message}</p>
              )}
            </div> */}

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
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                  <SelectItem value="APROVADA">Aprovada</SelectItem>
                  <SelectItem value="RECUSADA">Recusada</SelectItem>
                  <SelectItem value="EM_EXECUCAO">Em Execução</SelectItem>
                  <SelectItem value="AGUARDANDO_PECAS">Aguardando Peças</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
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