// app/dashboard/service-orders/[id]/page.tsx
"use client";

import { useState, useEffect, Key } from "react";
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
import { FrownIcon, Trash2Icon, PaperclipIcon } from "lucide-react"; // Adicionado PaperclipIcon
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
  UserRole,
  UserSector,
  OrderStatus,
  SolutionType,
} from "@prisma/client";

export default function ServiceOrderDetailsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const id = params.id as string;

  const [serviceOrder, setServiceOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = (
    userRole: UserRole | undefined,
    userSector: UserSector | undefined
  ) => {
    if (!userRole || !userSector) return false;
    if (userRole === UserRole.ADMIN) return true;

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

    return (
      allowedRoles.includes(userRole) && allowedSectors.includes(userSector)
    );
  };

  // Controla se já foi feita a verificação/autenticação e busca
  const [hasFetched, setHasFetched] = useState(false);

  const fetchServiceOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
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
      toast.error(
        "Erro ao carregar OS: " + (err.message || "Erro desconhecido.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !hasFetched &&
      id &&
      status !== "loading" &&
      status !== "unauthenticated" &&
      (session?.user?.email as string)?.endsWith("@starnav.com.br") &&
      hasPermission(session?.user?.role, session?.user?.sector)
    ) {
      fetchServiceOrder(id);
      setHasFetched(true);
    }
    // Se não autenticado, não faz fetch e deixa o fluxo de autenticação tratar
  }, [id, status, session, hasFetched]);

  const handleDelete = async () => {
    if (
      status === "unauthenticated" ||
      !(session?.user?.email as string)?.endsWith("@starnav.com.br") ||
      session?.user?.role !== UserRole.ADMIN
    ) {
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

  function canEditOrder({
    userSector,
    status,
    solutionType,
  }: {
    userSector: UserSector;
    status: OrderStatus;
    solutionType?: SolutionType | null;
  }) {
    if (userSector === UserSector.TRIPULACAO) {
      if (["PENDENTE", "RECUSADA"].includes(status)) return true;
      if (status === "EM_EXECUCAO" && solutionType === "INTERNA") return true;
      return false;
    }
    if (
      [UserSector.MANUTENCAO, UserSector.OPERACAO].includes(userSector as any)
    ) {
      return [
        "PENDENTE",
        "APROVADA",
        "RECUSADA",
        "PLANEJADA",
        "EM_ANALISE",
      ].includes(status);
    }
    if (userSector === UserSector.SUPRIMENTOS) {
      return ["AGUARDANDO_SUPRIMENTOS", "CONTRATADA"].includes(status);
    }
    return false;
  }

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
    !hasPermission(session?.user?.role, session?.user?.sector)
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FrownIcon className="h-20 w-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">
          Você não tem permissão para acessar esta página ou seu acesso é
          restrito.
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
        <h2 className="text-2xl font-bold text-red-700 mb-2">
          Erro ao Carregar OS
        </h2>
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
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Ordem de Serviço Não Encontrada
        </h2>
        <p className="text-gray-500 mb-6">
          A Ordem de Serviço com o ID "{id}" não existe ou foi removida.
        </p>
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
          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Dados Gerais
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
                <strong>Prazo Final:</strong>{" "}
                {serviceOrder.dueDate
                  ? formatDate(serviceOrder.dueDate)
                  : "Não definido"}
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
                {serviceOrder.createdBy?.role?.replace(/_/g, " ") || "N/A"}
              </p>
              <p className="text-gray-700">
                <strong>Atribuído a:</strong>{" "}
                {serviceOrder.assignedTo?.name ||
                  serviceOrder.assignedTo?.email ||
                  "Não atribuído"}
              </p>
              <p className="text-gray-700">
                <strong>Papel do Responsável:</strong>{" "}
                {serviceOrder.assignedTo?.role?.replace(/_/g, " ") || "N/A"}
              </p>
            </div>
          </div>

          {/* Descrição e Escopo de Serviço */}
          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">
              Detalhes da OS
            </h3>
            <p className="text-gray-700">
              <strong>Descrição:</strong>{" "}
              {serviceOrder.description || "Nenhuma descrição fornecida."}
            </p>
            <p className="text-gray-700">
              <strong>Escopo de Serviço:</strong>{" "}
              {serviceOrder.scopeOfService || "Nenhum escopo definido."}
            </p>
          </div>

          {/* Novos campos de Planejamento (Coordenador) */}
          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">
              Planejamento de Atendimento
            </h3>
            <p className="text-gray-700">
              <strong>Início Programado:</strong>{" "}
              {serviceOrder.plannedStartDate
                ? formatDate(serviceOrder.plannedStartDate)
                : "Não programado"}
            </p>
            <p className="text-gray-700">
              <strong>Término Estimado:</strong>{" "}
              {serviceOrder.plannedEndDate
                ? formatDate(serviceOrder.plannedEndDate)
                : "Não programado"}
            </p>

            <p className="text-gray-700">
              <strong>Tipo de Solução:</strong>{" "}
              {serviceOrder.solutionType
                ? serviceOrder.solutionType.replace(/_/g, " ")
                : "Não definido"}
            </p>
            <p className="text-gray-700">
              <strong>Tripulação Responsável:</strong>{" "}
              {serviceOrder.responsibleCrew || "Não atribuído"}
            </p>
            <p className="text-gray-700">
              <strong>Notas do Coordenador:</strong>{" "}
              {serviceOrder.coordinatorNotes || "N/A"}
            </p>
          </div>

          {/* Novos campos de Suprimentos (Comprador) */}
          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">
              Informações de Suprimentos
            </h3>
            <p className="text-gray-700">
              <strong>Empresa Contratada:</strong>{" "}
              {serviceOrder.contractedCompany || "N/A"}
            </p>
            <p className="text-gray-700">
              <strong>Data Contratação:</strong>{" "}
              {serviceOrder.contractDate
                ? formatDate(serviceOrder.contractDate)
                : "N/A"}
            </p>
            {session?.user.sector === "SUPRIMENTOS" && (
              <p className="text-gray-700">
                <strong>Custo do Serviço:</strong>{" "}
                {serviceOrder.serviceOrderCost
                  ? `R$ ${serviceOrder.serviceOrderCost.toFixed(2)}`
                  : "N/A"}
              </p>
            )}

            <p className="text-gray-700">
              <strong>Notas do Suprimentos:</strong>{" "}
              {serviceOrder.supplierNotes || "N/A"}
            </p>
          </div>

          {/* Anexos da Ordem de Serviço */}
          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2 flex items-center gap-2">
              <PaperclipIcon className="h-5 w-5 text-gray-600" /> Anexos
            </h3>
            {serviceOrder.reportAttachments?.length > 0 ? (
              <div className="mt-6">
                <ul className="space-y-2">
                  {serviceOrder.reportAttachments.map(
                    (
                      url: string | undefined,
                      index: Key | null | undefined
                    ) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded"
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all"
                        >
                          {url ? url.split("/").pop() : "Arquivo desconhecido"}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ) : (
              <p className="text-gray-700">Nenhum anexo disponível.</p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mt-8">
            <Link
              href={
                canEditOrder({
                  userSector: session?.user?.sector ?? UserSector.NAO_DEFINIDO,
                  status: serviceOrder.status,
                  solutionType: serviceOrder.solutionType,
                })
                  ? `/dashboard/service-orders/${serviceOrder.id}/edit`
                  : "#"
              }
              onClick={(e) => {
                if (
                  !canEditOrder({
                    userSector:
                      session?.user?.sector ?? UserSector.NAO_DEFINIDO,
                    status: serviceOrder.status,
                    solutionType: serviceOrder.solutionType,
                  })
                ) {
                  e.preventDefault();
                  toast.error(
                    "Você não tem permissão para editar esta Ordem de Serviço."
                  );
                }
              }}
            >
              <Button
                disabled={
                  !canEditOrder({
                    userSector:
                      session?.user?.sector ?? UserSector.NAO_DEFINIDO,
                    status: serviceOrder.status,
                    solutionType: serviceOrder.solutionType,
                  })
                }
              >
                Editar OS
              </Button>
            </Link>
            <AlertDialog>
              {session?.user.sector === "SUPRIMENTOS" && (
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2Icon className="h-4 w-4" /> Excluir OS
                  </Button>
                </AlertDialogTrigger>
              )}
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá
                    permanentemente esta Ordem de Serviço do nosso banco de
                    dados.
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
