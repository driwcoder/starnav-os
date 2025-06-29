// app/dashboard/service-orders/[id]/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { FrownIcon } from "lucide-react"; // Importar ícone para "não encontrado"

// Define os tipos para os parâmetros da rota
interface ServiceOrderDetailsPageProps {
  params: {
    id: string; // O ID da Ordem de Serviço vindo da URL
  };
}

export default async function ServiceOrderDetailsPage({ params }: ServiceOrderDetailsPageProps) {
  const session = await getServerSession(authOptions);

  // Proteção de rota
  if (!session || !(session.user?.email as string)?.endsWith("@starnav.com.br")) {
    redirect("/login");
  }

  const { id } = params; // Obtém o ID da OS da URL

  // Busca a Ordem de Serviço específica pelo ID
  const serviceOrder = await prisma.serviceOrder.findUnique({
    where: { id: id },
    include: {
      createdBy: {
        select: { name: true, email: true, role: true },
      },
      assignedTo: {
        select: { name: true, email: true, role: true },
      },
    },
  });

  // Se a OS não for encontrada, exibe uma mensagem
  if (!serviceOrder) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Ordem de Serviço Não Encontrada</h2>
        <p className="text-gray-500 mb-6">A Ordem de Serviço com o ID "{id}" não existe ou foi removida.</p>
        <Link href="/dashboard/service-orders">
          <Button>Voltar para a lista de OS</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Detalhes da Ordem de Serviço</CardTitle>
          <CardDescription className="text-center text-gray-600 mt-2">
            #{serviceOrder.id.substring(0, 8)} - {serviceOrder.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Informações Principais</h3>
              <p className="text-gray-700"><strong>Título:</strong> {serviceOrder.title}</p>
              <p className="text-gray-700"><strong>Status:</strong> <span className={`font-semibold ${
                  serviceOrder.status === "CONCLUIDA" ? "text-green-600" :
                  serviceOrder.status === "PENDENTE" ? "text-yellow-600" :
                  serviceOrder.status === "EM_EXECUCAO" ? "text-blue-600" :
                  "text-gray-600"
                }`}>{serviceOrder.status.replace(/_/g, ' ')}</span></p>
              <p className="text-gray-700"><strong>Prioridade:</strong> <span className={`font-semibold ${
                  serviceOrder.priority === "URGENTE" ? "text-red-600" :
                  serviceOrder.priority === "ALTA" ? "text-orange-600" :
                  "text-gray-600"
                }`}>{serviceOrder.priority.replace(/_/g, ' ')}</span></p>
              <p className="text-gray-700"><strong>Navio:</strong> {serviceOrder.ship}</p>
              <p className="text-gray-700"><strong>Localização:</strong> {serviceOrder.location || "N/A"}</p>
              <p className="text-gray-700"><strong>Data de Solicitação:</strong> {formatDate(serviceOrder.requestedAt)}</p>
              <p className="text-gray-700"><strong>Prazo:</strong> {serviceOrder.dueDate ? formatDate(serviceOrder.dueDate) : "Não definido"}</p>
              <p className="text-gray-700"><strong>Data de Conclusão:</strong> {serviceOrder.completedAt ? formatDate(serviceOrder.completedAt) : "Não concluída"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Pessoas Envolvidas</h3>
              <p className="text-gray-700"><strong>Criado por:</strong> {serviceOrder.createdBy?.name || serviceOrder.createdBy?.email}</p>
              <p className="text-gray-700"><strong>Papel do Criador:</strong> {serviceOrder.createdBy?.role || "N/A"}</p>
              <p className="text-gray-700"><strong>Atribuído a:</strong> {serviceOrder.assignedTo?.name || serviceOrder.assignedTo?.email || "Não atribuído"}</p>
              <p className="text-gray-700"><strong>Papel do Responsável:</strong> {serviceOrder.assignedTo?.role || "N/A"}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Descrição Detalhada</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{serviceOrder.description || "Nenhuma descrição fornecida."}</p>
          </div>

          <div className="flex justify-end gap-2 mt-8">
            <Link href={`/dashboard/service-orders/${serviceOrder.id}/edit`}>
              <Button>Editar OS</Button>
            </Link>
            <Link href="/dashboard/service-orders">
              <Button variant="outline">Voltar para a Lista</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}