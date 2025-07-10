// app/service-orders/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Priority } from "@prisma/client";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  title: z.string().min(3, "O título deve ter no mínimo 3 caracteres.").max(255),
  description: z.string().optional().nullable(),
  scopeOfService: z.string().optional().nullable(),
  ship: z.string().min(1, "O navio é obrigatório."),
  location: z.string().optional().nullable(),
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
      description: null,
      scopeOfService: null,
      ship: "",
      location: null,
      priority: "MEDIA",
      assignedToId: null,
      dueDate: null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      toast.error("Você precisa estar logado para criar uma Ordem de Serviço.");
      router.push("/auth/login");
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
      router.push("/service-orders");
      form.reset();
    } catch (error) {
      console.error("Erro ao criar OS:", error);
      toast.error("Erro de rede ao criar Ordem de Serviço.");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <h1 className="text-2xl font-bold text-center mb-8">Criar Nova Ordem de Serviço</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título da OS</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Reparo do motor principal" />
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
                  <Textarea {...field} placeholder="Detalhes do problema ou serviço a ser realizado." rows={4} value={field.value ?? ""}/>
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
                  <Textarea {...field} placeholder="Detalhe o escopo de trabalho, o que será feito ou inspecionado." rows={3} value={field.value ?? ""}/>
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
                  <Input {...field} placeholder="Ex: StarNav Alpha" />
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
                  <Input {...field} placeholder="Ex: Casa de Máquinas, Ponte de Comando" value={field.value ?? ""}/>
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
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Priority).map((priorityValue) => (
                        <SelectItem key={priorityValue} value={priorityValue}>
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
                <FormLabel>Data de Prazo (Opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Criando..." : "Criar Ordem de Serviço"}
          </Button>
        </form>
      </Form>
    </div>
  );
}