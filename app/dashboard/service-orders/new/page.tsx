// app/dashboard/service-orders/new/page.tsx
"use client";

import { useRouter } from "next/navigation"; // Removido useState
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  title: z.string().min(3, "O título deve ter no mínimo 3 caracteres.").max(255),
  description: z.string().optional(),
  ship: z.string().min(1, "O navio é obrigatório."),
  location: z.string().optional(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"], {
    required_error: "A prioridade é obrigatória.",
  }),
  assignedToId: z.string().uuid("ID do responsável inválido.").optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export default function CreateServiceOrderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      ship: "",
      location: "",
      priority: "MEDIA",
      assignedToId: null,
      dueDate: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      toast.error("Você precisa estar logado para criar uma Ordem de Serviço.");
      router.push("/login");
      return;
    }

    try {
      const payload = {
        ...values,
        createdById: session.user.id,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      };

      const response = await fetch("/api/service-orders", {
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
      router.push("/dashboard/service-orders");
      form.reset();
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

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Criando..." : "Criar Ordem de Serviço"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}