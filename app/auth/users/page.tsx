// app/users/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  XIcon,
  Trash2Icon,
  FrownIcon,
  KeyRoundIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "A nova senha deve ter no mínimo 8 caracteres."),
});

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] =
    useState<{ id: string; name: string | null; email: string } | null>(null);

  const query = searchParams.get("query") || "";
  const roleFilter = searchParams.get("role") || "";

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });


  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      if (status === "loading") return;
      if (
        status === "unauthenticated" ||
        !(session?.user?.email as string)?.endsWith("@starnav.com.br") ||
        session?.user?.role !== UserRole.ADMIN
      ) {
        router.push("/dashboard");
        toast.error(
          "Acesso negado. Apenas administradores podem gerenciar usuários."
        );
        return;
      }

      const url = new URL("/api/users", window.location.origin);
      if (query) url.searchParams.set("query", query);
      if (roleFilter) url.searchParams.set("role", roleFilter);

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao carregar usuários.");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar os usuários.");
      toast.error(
        "Erro ao carregar usuários: " + (err.message || "Erro desconhecido.")
      );
    } finally {
      setLoadingUsers(false);
    }
  }, [status, session, router, query, roleFilter]);

  useEffect(() => {
    if (status !== "loading") {
      fetchUsers();
    }
  }, [query, roleFilter, status, session, router, fetchUsers]);

  const handleDelete = async (userId: string, userName: string | null) => {
    if (
      status === "unauthenticated" ||
      !(session?.user?.email as string)?.endsWith("@starnav.com.br") ||
      session?.user?.role !== UserRole.ADMIN
    ) {
      toast.error("Você não tem permissão para realizar esta ação.");
      router.push("/dashboard");
      return;
    }

    if (session?.user?.id === userId) {
      toast.error("Você não pode excluir sua própria conta de administrador.");
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(
          errorData.message ||
            `Erro ao excluir usuário ${
              userName || userId.substring(0, 6)
            }. Tente novamente.`
        );
        return;
      }

      toast.success(
        `Usuário ${userName || userId.substring(0, 6)} excluído com sucesso!`
      );
      fetchUsers();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      toast.error("Erro de rede ao excluir usuário.");
    }
  };

  const handleResetPassword = async (
    values: z.infer<typeof resetPasswordSchema>
  ) => {
    if (!selectedUserForPasswordReset) return;

    try {
      const response = await fetch(
        `/api/users/${selectedUserForPasswordReset.id}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao redefinir a senha.");
        return;
      }

      toast.success(
        `Senha de ${
          selectedUserForPasswordReset.name ||
          selectedUserForPasswordReset.email
        } redefinida com sucesso!`
      );
      setIsResetPasswordModalOpen(false);
      resetPasswordForm.reset();
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      toast.error("Erro de rede ao redefinir senha.");
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
    !(session?.user?.email as string)?.endsWith("@starnav.com.br") ||
    session?.user?.role !== UserRole.ADMIN
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">
          Você não tem permissão para acessar esta página.
        </p>
        <Button onClick={() => router.push("/auth/login")}>Ir para Login</Button>
      </div>
    );
  }

  if (loadingUsers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">
          Erro ao Carregar Usuários
        </h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Voltar para o Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <SiteHeader />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Gerenciamento de Usuários
        </h2>
        <Link href="/users/new">
          <Button>Criar Novo Usuário</Button>
        </Link>
      </div>

      <div className="mb-6 rounded-md border p-4 bg-white shadow-sm">
        <form action="/users" method="GET" className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              name="query"
              placeholder="Buscar por nome ou e-mail..."
              defaultValue={query}
              className="pl-10"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            {query && (
              <Link
                href="/users"
                passHref
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-5 w-5" />
              </Link>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <Select name="role" defaultValue={roleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Papéis</SelectItem>
                  {Object.values(UserRole).map((roleValue) => (
                    <SelectItem key={roleValue} value={roleValue}>
                      {roleValue.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="md:w-auto">
              Aplicar Filtros
            </Button>
          </div>
        </form>
      </div>

      {users.length === 0 ? (
        <p className="text-center text-gray-600">
          Nenhum usuário encontrado com os filtros aplicados.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Criado Em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.id.substring(0, 6)}...
                  </TableCell>
                  <TableCell>{user.name || "N/A"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {user.role.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {user.sector.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right space-x-2 flex items-center justify-end">
                    <Link href={`/users/${user.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                    {/* Botão de Redefinir Senha */}
                    <Dialog
                      open={
                        isResetPasswordModalOpen &&
                        selectedUserForPasswordReset?.id === user.id
                      }
                      onOpenChange={(open) => {
                        setIsResetPasswordModalOpen(open);
                        if (!open) resetPasswordForm.reset(); // Reseta o form ao fechar
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => {
                            setSelectedUserForPasswordReset(user);
                            setIsResetPasswordModalOpen(true);
                          }}
                        >
                          <KeyRoundIcon className="h-4 w-4" /> Senha
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>
                            Redefinir Senha para{" "}
                            {selectedUserForPasswordReset?.name ||
                              selectedUserForPasswordReset?.email}
                          </DialogTitle>
                          <DialogDescription>
                            Digite a nova senha para este usuário.
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={resetPasswordForm.handleSubmit(
                            handleResetPassword
                          )}
                          className="grid gap-4 py-4"
                        >
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="newPassword" className="text-right">
                              Nova Senha
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              className="col-span-3"
                              {...resetPasswordForm.register("newPassword")}
                            />
                          </div>
                          {resetPasswordForm.formState.errors.newPassword && (
                            <p className="text-sm text-red-600 mt-1 col-span-4 text-right">
                              {
                                resetPasswordForm.formState.errors.newPassword
                                  .message
                              }
                            </p>
                          )}
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsResetPasswordModalOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              disabled={
                                resetPasswordForm.formState.isSubmitting
                              }
                            >
                              {resetPasswordForm.formState.isSubmitting
                                ? "Redefinindo..."
                                : "Redefinir"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {/* Botão de Excluir */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Trash2Icon className="h-4 w-4" /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá
                            permanentemente o usuário "{user.name || user.email}
                            " do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id, user.name)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
