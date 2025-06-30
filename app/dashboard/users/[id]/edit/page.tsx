// app/dashboard/users/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Importado CardDescription
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeftIcon, FrownIcon } from "lucide-react";
import { UserRole } from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres.").max(100).optional(),
  email: z.string().email("Formato de e-mail inválido.").endsWith("@starnav.com.br", "O e-mail deve ser @starnav.com.br."),
  role: z.nativeEnum(UserRole, {
    required_error: "O papel do usuário é obrigatório.",
  }),
});

export default function EditUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: UserRole.COMUM,
    },
  });

  // Mover as chamadas de Hooks para o topo.
  // As verificações condicionais de sessão vêm DEPOIS das chamadas de Hooks.

  useEffect(() => {
    if (!id) return;

    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        if (status === "loading") return; // Ainda carregando a sessão, aguarda
        if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br") || (session?.user?.role !== UserRole.ADMIN)) {
            toast.error("Acesso negado. Por favor, faça login.");
            router.push("/login");
            return;
        }

        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao carregar usuário.");
        }
        const data = await response.json();

        form.reset({
          name: data.name,
          email: data.email,
          role: data.role,
        });
      } catch (err: any) {
        setError(err.message || "Não foi possível carregar o usuário.");
        toast.error("Erro ao carregar usuário: " + (err.message || "Erro desconhecido."));
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id, form, session, status, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Verificação de permissão no submit
    if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br") || (session?.user?.role !== UserRole.ADMIN)) {
      toast.error("Você não tem permissão para realizar esta ação.");
      router.push("/dashboard");
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao atualizar usuário.");
        return;
      }

      toast.success("Usuário atualizado com sucesso!");
      router.push("/dashboard/users");
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      toast.error("Erro de rede ao atualizar usuário.");
    }
  };

  // Verificações condicionais de sessão e acesso (DEPOIS DOS HOOKS)
  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Verificando permissões...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br") || (session?.user?.role !== UserRole.ADMIN)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">Você não tem permissão para acessar esta página.</p>
        <Button onClick={() => router.push("/login")}>Ir para Login</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Carregando dados do usuário...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Erro ao Carregar Usuário</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/dashboard/users">
          <Button>Voltar para a lista de usuários</Button>
        </Link>
      </div>
    );
  }

  if (!form.getValues("email")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Usuário Não Encontrado</h2>
        <p className="text-gray-500 mb-6">O usuário com o ID "{id}" não existe ou foi removido.</p>
        <Link href="/dashboard/users">
          <Button>Voltar para a lista de usuários</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Editar Usuário</CardTitle>
          <CardDescription className="text-center">ID: {id}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Nome (Opcional)</Label>
              <Input
                id="name"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.watch("email")}
                disabled
                className="cursor-not-allowed bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado.</p>
            </div>

            <div>
              <Label htmlFor="role">Papel do Usuário</Label>
              <Select
                onValueChange={(value) => form.setValue("role", value as UserRole)}
                value={form.watch("role")}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((roleValue) => (
                    <SelectItem key={roleValue} value={roleValue}>
                      {roleValue.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.role.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Link href="/dashboard/users">
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