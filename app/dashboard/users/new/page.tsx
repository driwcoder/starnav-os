// app/dashboard/users/new/page.tsx
"use client";

import { useRouter } from "next/navigation"; // Removido useState que não era usado
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  role: z.nativeEnum(UserRole, {
    required_error: "O papel do usuário é obrigatório.",
  }),
});

export default function CreateUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: UserRole.COMUM,
    },
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Verificando permissões...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br") || (session?.user?.role !== UserRole.ADMIN)) {
    router.push("/dashboard");
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">Você não tem permissão para acessar esta página.</p>
        <Button onClick={() => router.push("/login")}>Ir para Login</Button>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      toast.error("Você não tem permissão para realizar esta ação.");
      router.push("/dashboard");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao criar usuário.");
        return;
      }

      toast.success("Usuário criado com sucesso!");
      router.push("/dashboard/users");
      form.reset();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast.error("Erro de rede ao criar usuário.");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Criar Novo Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Nome (Opcional)</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Nome completo do usuário"
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
                {...form.register("email")}
                placeholder="usuario@starnav.com.br"
                required
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                placeholder="Senha segura (mínimo 8 caracteres)"
                required
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.password.message}</p>
              )}
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
                {form.formState.isSubmitting ? "Criando..." : "Criar Usuário"}
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