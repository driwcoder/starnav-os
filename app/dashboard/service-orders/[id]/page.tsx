// app/dashboard/service-orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { FrownIcon, Trash2Icon } from "lucide-react";
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
import { UserRole, UserSector } from "@prisma/client";

export default function ServiceOrderDetailsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const id = params.id as string;

  const [serviceOrder, setServiceOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ CORREÇÃO: Função auxiliar para verificar permissão de VISUALIZAÇÃO
  const hasPermission = (userRole: UserRole | undefined, userSector: UserSector | undefined) => {
    if (!userRole || !userSector) return false;
    if (userRole === UserRole.ADMIN) return true;

    // ✅ CORREÇÃO: Incluindo TODOS os novos cargos de comprador e tripulação
    const allowedRoles = [
      UserRole.GESTOR,
      UserRole.SUPERVISOR,
      UserRole.COORDENADOR,
      UserRole.COMPRADOR_JUNIOR,
      UserRole.COMPRADOR_PLENO,
      UserRole.COMPRADOR_SENIOR,
      UserRole.COMANDANTE,
      UserRole.IMEDIATO,
      UserRole.OQN,
      UserRole.CHEFE_MAQUINAS,
      UserRole.SUB_CHEFE_MAQUINAS,
      UserRole.OQM,
      UserRole.ASSISTENTE,
      UserRole.AUXILIAR,
      UserRole.ESTAGIARIO,
    ];
    const allowedSectors = [
      UserSector.ADMINISTRACAO,
      UserSector.MANUTENCAO,
      UserSector.OPERACAO,
      UserSector.SUPRIMENTOS,
      UserSector.TRIPULACAO,
      UserSector.ALMOXARIFADO,
      UserSector.RH,
      UserSector.TI,
      UserSector.NAO_DEFINIDO,
    ];

    return allowedRoles.includes(userRole) && allowedSectors.includes(userSector);
  };

  const fetchServiceOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (status === "loading") return;
      if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br")) {
          toast.error("Acesso negado. Por favor, faça login.");
          router.push("/login");
          return;
      }
      if (!hasPermission(session?.user?.role, session?.user?.sector)) {
        toast.error("Você não tem permissão para visualizar esta Ordem de Serviço.");
        router.push("/dashboard");
        return;
      }

      const response = await fetch(`/api/service-orders/${orderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erro ao carregar Ordem de Serviço."
        );
      }
      const data = await response.json();
      setServiceOrder(data);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar a Ordem de Serviço.");
      toast.error("Erro ao carregar OS: " + (err.message || "Erro desconhecido."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && status !== "loading") {
      fetchServiceOrder(id);
    }
  }, [id, status, session, router]);

  const handleDelete = async () => {
    if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br") || (session?.user?.role !== UserRole.ADMIN)) {
        toast.error("Você não tem permissão para excluir esta Ordem de Serviço.");
        router.push("/dashboard");
        return;
    }

    try {
      const response = await fetch(`/api/service-orders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao excluir Ordem de Serviço.");
        return;
      }

      toast.success("Ordem de Serviço excluída com sucesso!");
      router.push("/dashboard/service-orders");
    } catch (err) {
      console.error("Erro ao excluir OS:", err);
      toast.error("Erro de rede ao excluir Ordem de Serviço.");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Verificando autenticação...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !(session?.user?.email as string)?.endsWith("@starnav.com.br") || !hasPermission(session?.user?.role, session?.user?.sector)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">
          Você não tem permissão para acessar esta página ou seu acesso é restrito.
        </p>
        <Button onClick={() => router.push("/login")}>Ir para Login</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Carregando Ordem de Serviço...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Erro ao Carregar OS</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/dashboard/service-orders">
          <Button>Voltar para a lista de OS</Button>
        </Link>
      </div>
    );
  }

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
          <CardTitle className="text-3xl font-bold text-center">
            Detalhes da Ordem de Serviço
          </CardTitle>
          <CardDescription className="text-center text-gray-600 mt-2">
            #{serviceOrder.id.substring(0, 8)} - {serviceOrder.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Informações Principais
              </h3>
              <p className="text-gray-700">
                <strong>Título:</strong> {serviceOrder.title}
              </p>
              <p className="text-gray-700">
                <strong>Status:</strong>{" "}
                <span
                  className={`font-semibold ${
                    serviceOrder.status === "CONCLUIDA"
                      ? "text-green-600"
                      : serviceOrder.status === "PENDENTE"
                      ? "text-yellow-600"
                      : serviceOrder.status === "EM_EXECUCAO"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {serviceOrder.status.replace(/_/g, " ")}
                </span>
              </p>
              <p className="text-gray-700">
                <strong>Prioridade:</strong>{" "}
                <span
                  className={`font-semibold ${
                    serviceOrder.priority === "URGENTE"
                      ? "text-red-600"
                      : serviceOrder.priority === "ALTA"
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                >
                  {serviceOrder.priority.replace(/_/g, " ")}
                </span>
              </p>
              <p className="text-gray-700">
                <strong>Navio:</strong> {serviceOrder.ship}
              </p>
              <p className="text-gray-700">
                <strong>Localização:</strong> {serviceOrder.location || "N/A"}
              </p>
              <p className="text-gray-700">
                <strong>Data de Solicitação:</strong>{" "}
                {formatDate(serviceOrder.requestedAt)}
              </p>
              <p className="text-gray-700">
                <strong>Prazo:</strong>{" "}
                {serviceOrder.dueDate
                  ? formatDate(serviceOrder.dueDate)
                  : "Não definido"}
              </p>
              <p className="text-gray-700">
                <strong>Data de Conclusão:</strong>{" "}
                {serviceOrder.completedAt
                  ? formatDate(serviceOrder.completedAt)
                  : "Não concluída"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Pessoas Envolvidas
              </h3>
              <p className="text-gray-700">
                <strong>Criado por:</strong>{" "}
                {serviceOrder.createdBy?.name || serviceOrder.createdBy?.email}
              </p>
              <p className="text-gray-700">
                <strong>Papel do Criador:</strong>{" "}
                {serviceOrder.createdBy?.role || "N/A"}
              </p>
              <p className="text-gray-700">
                <strong>Atribuído a:</strong>{" "}
                {serviceOrder.assignedTo?.name ||
                  serviceOrder.assignedTo?.email ||
                  "Não atribuído"}
              </p>
              <p className="text-gray-700">
                <strong>Papel do Responsável:</strong>{" "}
                {serviceOrder.assignedTo?.role || "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">
              Descrição Detalhada
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {serviceOrder.description || "Nenhuma descrição fornecida."}
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-8">
            <Link href={`/dashboard/service-orders/${serviceOrder.id}/edit`}>
              <Button>Editar OS</Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2Icon className="h-4 w-4" /> Excluir OS
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente
                    esta Ordem de Serviço do nosso banco de dados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link href="/dashboard/service-orders">
              <Button variant="outline">Voltar para a Lista</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}