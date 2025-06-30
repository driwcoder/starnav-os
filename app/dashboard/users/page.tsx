// app/dashboard/users/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
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
import { SearchIcon, XIcon } from "lucide-react";

// Usamos 'any' aqui para contornar o bug de inferência do compilador do Next.js
interface UsersPageProps {
  searchParams: any; // Mantenha como 'any' para evitar erros de tipagem persistentes
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await getServerSession(authOptions);

  // Proteção de rota: Apenas ADMIN pode acessar esta página
  if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
    redirect("/login");
  }
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: { role: true },
  });

  if (currentUser?.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  // ✅ CORREÇÃO: Await searchParams antes de acessar suas propriedades
  const actualSearchParams = await searchParams;

  // Obtém os parâmetros da URL
  const query = actualSearchParams?.query || "";
  const roleFilter = actualSearchParams?.role || "";

  // Constrói o objeto 'where' para o Prisma
  const whereClause: any = {};

  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  // Validar e tipar o valor do filtro para o enum UserRole
  if (roleFilter && roleFilter !== "TODOS") {
    if (Object.values(UserRole).includes(roleFilter as UserRole)) {
      whereClause.role = roleFilter;
    }
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

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
                  <TableCell className="text-right space-x-2">
                    <Link href={`/dashboard/users/${user.id}/edit`}>
                      <Button variant="outline" size="sm">Editar</Button>
                    </Link>
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