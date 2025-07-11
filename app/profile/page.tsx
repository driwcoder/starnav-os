// app/profile/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FrownIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Schema de validação para a alteração de senha
const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória."),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter no mínimo 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme sua nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha não pode ser igual à senha atual.",
    path: ["newPassword"],
  });

export default function UserProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const form = useForm<z.infer<typeof changePasswordFormSchema>>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordChangeSubmit = async (
    values: z.infer<typeof changePasswordFormSchema>
  ) => {
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
      form.reset();
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

  if (
    status === "unauthenticated" ||
    !(session?.user?.email as string)?.endsWith("@starnav.com.br")
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">
          Você precisa estar logado para acessar esta página.
        </p>
        <Button onClick={() => router.push("/auth/login")}>
          Ir para Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center">Meu Perfil</h1>
        <p className="text-center text-gray-500">
          Gerencie suas informações de usuário
        </p>
      </div>
      <div className="space-y-6 bg-white rounded-lg shadow p-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Informações Pessoais</h3>
          <p>
            <strong>Nome:</strong> {session?.user?.name || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {session?.user?.email}
          </p>
          <p>
            <strong>Cargo:</strong>{" "}
            {session?.user?.role?.replace(/_/g, " ") || "N/A"}
          </p>
          <p>
            <strong>Setor:</strong>{" "}
            {session?.user?.sector?.replace(/_/g, " ") || "N/A"}
          </p>
        </div>

        <hr className="my-4" />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Alterar Senha</h3>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onPasswordChangeSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
