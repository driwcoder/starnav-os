// app/dashboard/profile/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FrownIcon } from "lucide-react";

// Schema de validação para a alteração de senha
const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória."),
  newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres."),
  confirmPassword: z.string().min(8, "Confirme sua nova senha."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "A nova senha não pode ser igual à senha atual.",
  path: ["newPassword"],
});


export default function UserProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const changePasswordForm = useForm<z.infer<typeof changePasswordFormSchema>>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordChangeSubmit = async (values: z.infer<typeof changePasswordFormSchema>) => {
    try {
      const response = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao alterar a senha.");
        return;
      }

      toast.success("Senha alterada com sucesso!");
      changePasswordForm.reset();
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro de rede ao alterar senha.");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Verificando autenticação...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br")) {
      return (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
              <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
              <p className="text-gray-500 mb-6">Você precisa estar logado para acessar esta página.</p>
              <Button onClick={() => router.push("/login")}>Ir para Login</Button>
          </div>
      );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Meu Perfil</CardTitle>
          <CardDescription className="text-center">Gerencie suas informações de usuário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Informações Pessoais</h3>
            {/* ✅ CORREÇÃO: Usando operador de encadeamento opcional para acessar as propriedades */}
            <p><strong>Nome:</strong> {session?.user?.name || "N/A"}</p>
            <p><strong>Email:</strong> {session?.user?.email}</p>
            <p><strong>Cargo:</strong> {session?.user?.role?.replace(/_/g, ' ') || "N/A"}</p>
            <p><strong>Setor:</strong> {session?.user?.sector?.replace(/_/g, ' ') || "N/A"}</p>
          </div>

          <hr className="my-4" />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Alterar Senha</h3>
            <form onSubmit={changePasswordForm.handleSubmit(onPasswordChangeSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...changePasswordForm.register("currentPassword")}
                />
                {changePasswordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-red-600 mt-1">{changePasswordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...changePasswordForm.register("newPassword")}
                />
                {changePasswordForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-600 mt-1">{changePasswordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...changePasswordForm.register("confirmPassword")}
                />
                {changePasswordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{changePasswordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={changePasswordForm.formState.isSubmitting}>
                {changePasswordForm.formState.isSubmitting ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}