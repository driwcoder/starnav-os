// app/register/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserRole, UserSector } from "@prisma/client";

// --- Definição do Schema de Validação com Zod ---
const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres.").max(100).optional(),
  email: z.string().email("Formato de e-mail inválido.").endsWith("@starnav.com.br", "O e-mail deve ser @starnav.com.br."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  role: z.nativeEnum(UserRole, {
    required_error: "O papel do usuário é obrigatório.",
  }),
  sector: z.nativeEnum(UserSector, {
    required_error: "O setor do usuário é obrigatório.",
  }),
});

// --- Componente da Página ---
export default function RegisterPage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: UserRole.ASSISTENTE, // Valor padrão para novos registros públicos
      sector: UserSector.NAO_DEFINIDO, // Valor padrão para o setor
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Erro no registro. Tente novamente.");
        return;
      }

      toast.success("Usuário registrado com sucesso! Você pode fazer login agora.");
      form.reset();

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Erro ao tentar registrar:", err);
      toast.error("Erro de conexão. Verifique sua rede.");
    }
  };
  // trigger deploy
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="mb-6 text-center text-2xl font-bold text-gray-800">
            Registrar - Sistema StarNav OS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome (Opcional)</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Seu nome"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                {...form.register("email")}
                placeholder="seu.nome@starnav.com.br"
                required
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                type="password"
                id="password"
                {...form.register("password")}
                placeholder="********"
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
                  {/* Filtra ADMIN para não ser selecionado no registro público */}
                  {Object.values(UserRole).filter(role => role !== UserRole.ADMIN).map((roleValue) => (
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
            <div>
              <Label htmlFor="sector">Setor do Usuário</Label>
              <Select
                onValueChange={(value) => form.setValue("sector", value as UserSector)}
                value={form.watch("sector")}
              >
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserSector).map((sectorValue) => (
                    <SelectItem key={sectorValue} value={sectorValue}>
                      {sectorValue.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.sector && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.sector.message}</p>
              )}
            </div>

            <Button type="submit" className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Registrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}