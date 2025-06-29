// app/dashboard/service-orders/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Adicionar Textarea
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Adicionar Select
import { toast } from "sonner"; // Adicionar sonner para notificações

// Importações para React Hook Form e Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Definição do Schema de Validação com Zod ---
const formSchema = z.object({
  title: z.string().min(3, "O título deve ter no mínimo 3 caracteres.").max(255),
  description: z.string().optional(),
  ship: z.string().min(1, "O navio é obrigatório."),
  location: z.string().optional(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"], {
    required_error: "A prioridade é obrigatória.",
  }),
  // assignedToId é opcional na criação, pode ser atribuído depois
  assignedToId: z.string().uuid("ID do responsável inválido.").optional().nullable(),
  dueDate: z.string().optional().nullable(), // Data como string para input
});

// --- Componente da Página ---
export default function CreateServiceOrderPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Configuração do React Hook Form com Zod Resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      ship: "",
      location: "",
      priority: "MEDIA", // Valor padrão para prioridade
      assignedToId: null,
      dueDate: "",
    },
  });

  // Estado para armazenar a lista de usuários para o Select (se houver responsáveis)
  const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Carregar usuários para o campo "Atribuído a"
  // TODO: Em um projeto real, esta busca deve ser otimizada (paginação, busca por nome)
  // e protegida por um papel de usuário (apenas admins/gestores podem ver todos os usuários).
  // Por enquanto, faremos uma busca simples para demonstrar.
  // useEffect(() => {
  //   async function fetchUsers() {
  //     try {
  //       const res = await fetch('/api/users'); // Você criará esta API no futuro
  //       if (res.ok) {
  //         const data = await res.json();
  //         setUsers(data);
  //       } else {
  //         toast.error("Erro ao carregar usuários.");
  //       }
  //     } catch (error) {
  //       toast.error("Erro de rede ao carregar usuários.");
  //     } finally {
  //       setLoadingUsers(false);
  //     }
  //   }
  //   fetchUsers();
  // }, []);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      toast.error("Você precisa estar logado para criar uma Ordem de Serviço.");
      router.push("/login");
      return;
    }

    try {
      const payload = {
        ...values,
        createdById: session.user.id, // O ID do criador vem da sessão
        // Converte dueDate para ISO string se existir
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      };

      const response = await fetch("/api/service-orders", { // API Route para criar OS
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao criar Ordem de Serviço.");
        return;
      }

      toast.success("Ordem de Serviço criada com sucesso!");
      router.push("/dashboard/service-orders"); // Redireciona para a lista
      form.reset(); // Reseta o formulário
    } catch (error) {
      console.error("Erro ao criar OS:", error);
      toast.error("Erro de rede ao criar Ordem de Serviço.");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Criar Nova Ordem de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Título da OS</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Ex: Reparo do motor principal"
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
                placeholder="Detalhes do problema ou serviço a ser realizado."
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
                placeholder="Ex: StarNav Alpha"
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
                placeholder="Ex: Casa de Máquinas, Ponte de Comando"
              />
              {form.formState.errors.location && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.location.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                onValueChange={(value) => form.setValue("priority", value as "BAIXA" | "MEDIA" | "ALTA" | "URGENTE")}
                value={form.watch("priority")} // Observa o valor para manter o Select atualizado
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

            {/* Campo para Atribuir a (opcional por enquanto, será preenchido com usuários reais) */}
            {/* <div>
              <Label htmlFor="assignedTo">Atribuído a (Opcional)</Label>
              <Select
                onValueChange={(value) => form.setValue("assignedToId", value === "" ? null : value)}
                value={form.watch("assignedToId") || ""}
                disabled={loadingUsers}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder={loadingUsers ? "Carregando usuários..." : "Selecione um responsável"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não Atribuído</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
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
                type="date" // Input de data HTML5
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.dueDate.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Criando..." : "Criar Ordem de Serviço"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}