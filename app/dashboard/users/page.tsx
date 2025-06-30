// app/dashboard/users/page.tsx
"use client"; // Esta página é um Client Component

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Importe useSearchParams AQUI
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
import { SearchIcon, XIcon, Trash2Icon, FrownIcon } from "lucide-react";
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

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ OBTENHA OS PARAMS COM useSearchParams()
  const { data: session, status } = useSession();

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtém os parâmetros da URL de forma síncrona
  const query = searchParams.get("query") || "";
  const roleFilter = searchParams.get("role") || "";

  const fetchUsers = async () => {
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
        toast.error("Acesso negado. Apenas administradores podem gerenciar usuários.");
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
      toast.error("Erro ao carregar usuários: " + (err.message || "Erro desconhecido."));
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      fetchUsers();
    }
  }, [query, roleFilter, status, session, router]);

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
            `Erro ao excluir usuário ${userName || userId.substring(0, 6)}. Tente novamente.`
        );
        return;
      }

      toast.success(`Usuário ${userName || userId.substring(0, 6)} excluído com sucesso!`);
      fetchUsers();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      toast.error("Erro de rede ao excluir usuário.");
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
        <Button onClick={() => router.push("/login")}>Ir para Login</Button>
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
        <h2 className="text-2xl font-bold text-red-700 mb-2">Erro ao Carregar Usuários</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>Voltar para o Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h2>
        <Link href="/dashboard/users/new">
          <Button>Criar Novo Usuário</Button>
        </Link>
      </div>

      <div className="mb-6 rounded-md border p-4 bg-white shadow-sm">
        <form action="/dashboard/users" method="GET" className="space-y-4">
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
              <Link href="/dashboard/users" passHref className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
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
                      {roleValue.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="md:w-auto">Aplicar Filtros</Button>
          </div>
        </form>
      </div>

      {users.length === 0 ? (
        <p className="text-center text-gray-600">Nenhum usuário encontrado com os filtros aplicados.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Criado Em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id.substring(0, 6)}...</TableCell>
                  <TableCell>{user.name || "N/A"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><span className="font-semibold">{user.role.replace(/_/g, ' ')}</span></TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right space-x-2 flex items-center justify-end"> {/* ✅ Flexbox para alinhar botões */}
                    <Link href={`/dashboard/users/${user.id}/edit`}>
                      <Button variant="outline" size="sm">Editar</Button>
                    </Link>
                    {/* Botão de Excluir com Diálogo de Confirmação */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex items-center gap-2">
                          <Trash2Icon className="h-4 w-4" /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário "{user.name || user.email}" do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id, user.name)}>
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