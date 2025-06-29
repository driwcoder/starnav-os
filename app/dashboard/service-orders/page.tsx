// app/dashboard/service-orders/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma"; // Importa o Prisma Client
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils"; // Vamos criar esta função no próximo passo

export default async function ServiceOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
    redirect("/login");
  }

  // Busca todas as ordens de serviço do banco de dados
  const serviceOrders = await prisma.serviceOrder.findMany({
    orderBy: {
      requestedAt: "desc", // Ordena pelas mais recentes
    },
    include: {
      createdBy: {
        select: { name: true, email: true }, // Inclui informações do criador
      },
      assignedTo: {
        select: { name: true, email: true }, // Inclui informações do responsável
      },
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Ordens de Serviço</h2>
        <Link href="/dashboard/service-orders/new">
          <Button>Criar Nova OS</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {serviceOrders.length === 0 ? (
          <p className="col-span-full text-center text-gray-600">Nenhuma Ordem de Serviço encontrada.</p>
        ) : (
          serviceOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>{order.title}</CardTitle>
                <CardDescription>Navio: {order.ship} | Status: {order.status}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-700">Prioridade: {order.priority}</p>
                <p className="text-sm text-gray-700">Solicitado por: {order.createdBy?.name || order.createdBy?.email}</p>
                <p className="text-sm text-gray-700">Data da Solicitação: {formatDate(order.requestedAt)}</p>
                <p className="text-sm text-gray-700">Responsável: {order.assignedTo?.name || order.assignedTo?.email || "Não atribuído"}</p>
                <div className="flex justify-end gap-2 mt-4">
                  <Link href={`/dashboard/service-orders/${order.id}`}>
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                  </Link>
                  <Link href={`/dashboard/service-orders/${order.id}/edit`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}