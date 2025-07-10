// app/service-orders/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { FrownIcon, Trash2Icon, PaperclipIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  UserRole,
  UserSector,
  OrderStatus,
  SolutionType,
} from "@prisma/client";

export default async function ServiceOrderDetailsPage(props: any) {
  const params: any = props.params;
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user?.email?.endsWith("@starnav.com.br") ||
    !session.user?.role ||
    !session.user?.sector
  ) {
    redirect("/auth/login");
  }

  const id = params.id;

  // Busca OS no banco
  const serviceOrder = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      createdBy: true,
      assignedTo: true,
    },
  });

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
        <Link href="/service-orders">
          <Button>Voltar para a lista de OS</Button>
        </Link>
      </div>
    );
  }

  // Permissão de acesso
  function hasPermission(userRole: UserRole, userSector: UserSector): boolean {
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
  }

  if (!hasPermission(session.user.role, session.user.sector)) {
    redirect("/auth/login");
  }

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

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Detalhes da Ordem de Serviço</h1>
        <p className="text-gray-500 mt-1 text-base">
          #{serviceOrder.id.substring(0, 8)} - {serviceOrder.title}
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-lg text-gray-800 mb-2">
            Dados Gerais
          </h2>
          <div className="space-y-1 text-gray-700">
            <div>
              <span className="font-semibold">Título:</span>{" "}
              {serviceOrder.title}
            </div>
            <div>
              <span className="font-semibold">Status:</span>{" "}
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
            </div>
            <div>
              <span className="font-semibold">Prioridade:</span>{" "}
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
            </div>
            <div>
              <span className="font-semibold">Navio:</span> {serviceOrder.ship}
            </div>
            <div>
              <span className="font-semibold">Localização:</span>{" "}
              {serviceOrder.location || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Data de Solicitação:</span>{" "}
              {formatDate(serviceOrder.requestedAt)}
            </div>
            <div>
              <span className="font-semibold">Prazo Final:</span>{" "}
              {serviceOrder.dueDate
                ? formatDate(serviceOrder.dueDate)
                : "Não definido"}
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg text-gray-800 mb-2">
            Pessoas Envolvidas
          </h2>
          <div className="space-y-1 text-gray-700">
            <div>
              <span className="font-semibold">Criado por:</span>{" "}
              {serviceOrder.createdBy?.name || serviceOrder.createdBy?.email}
            </div>
            <div>
              <span className="font-semibold">Papel do Criador:</span>{" "}
              {serviceOrder.createdBy?.role?.replace(/_/g, " ") || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Atribuído a:</span>{" "}
              {serviceOrder.assignedTo?.name ||
                serviceOrder.assignedTo?.email ||
                "Não atribuído"}
            </div>
            <div>
              <span className="font-semibold">Papel do Responsável:</span>{" "}
              {serviceOrder.assignedTo?.role?.replace(/_/g, " ") || "N/A"}
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">
          Detalhes da OS
        </h2>
        <div className="space-y-1 text-gray-700">
          <div>
            <span className="font-semibold">Descrição:</span>{" "}
            {serviceOrder.description || "Nenhuma descrição fornecida."}
          </div>
          <div>
            <span className="font-semibold">Escopo de Serviço:</span>{" "}
            {serviceOrder.scopeOfService || "Nenhum escopo definido."}
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">
          Planejamento de Atendimento
        </h2>
        <div className="space-y-1 text-gray-700">
          <div>
            <span className="font-semibold">Início Programado:</span>{" "}
            {serviceOrder.plannedStartDate
              ? formatDate(serviceOrder.plannedStartDate)
              : "Não programado"}
          </div>
          <div>
            <span className="font-semibold">Término Estimado:</span>{" "}
            {serviceOrder.plannedEndDate
              ? formatDate(serviceOrder.plannedEndDate)
              : "Não programado"}
          </div>
          <div>
            <span className="font-semibold">Tipo de Solução:</span>{" "}
            {serviceOrder.solutionType
              ? serviceOrder.solutionType.replace(/_/g, " ")
              : "Não definido"}
          </div>
          <div>
            <span className="font-semibold">Tripulação Responsável:</span>{" "}
            {serviceOrder.responsibleCrew || "Não atribuído"}
          </div>
          <div>
            <span className="font-semibold">Notas do Coordenador:</span>{" "}
            {serviceOrder.coordinatorNotes || "N/A"}
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">
          Informações de Suprimentos
        </h2>
        <div className="space-y-1 text-gray-700">
          <div>
            <span className="font-semibold">Empresa Contratada:</span>{" "}
            {serviceOrder.contractedCompany || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Data Contratação:</span>{" "}
            {serviceOrder.contractDate
              ? formatDate(serviceOrder.contractDate)
              : "N/A"}
          </div>
          {session.user.sector === "SUPRIMENTOS" && (
            <div>
              <span className="font-semibold">Custo do Serviço:</span>{" "}
              {serviceOrder.serviceOrderCost
                ? `R$ ${serviceOrder.serviceOrderCost.toFixed(2)}`
                : "N/A"}
            </div>
          )}
          <div>
            <span className="font-semibold">Notas do Suprimentos:</span>{" "}
            {serviceOrder.supplierNotes || "N/A"}
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="font-semibold text-lg text-gray-800 mb-2 flex items-center gap-2">
          <PaperclipIcon className="h-5 w-5 text-gray-600" /> Anexos
        </h2>
        {serviceOrder.reportAttachments?.length > 0 ? (
          <ul className="space-y-2 mt-4">
            {serviceOrder.reportAttachments.map(
              (url: string | undefined, index: number) => (
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
        ) : (
          <p className="text-gray-700">Nenhum anexo disponível.</p>
        )}
      </section>

      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-10">
        <Link
          href={
            canEditOrder({
              userSector: session.user.sector ?? UserSector.NAO_DEFINIDO,
              status: serviceOrder.status,
              solutionType: serviceOrder.solutionType,
            })
              ? `/service-orders/${serviceOrder.id}/edit`
              : "#"
          }
        >
          <Button
            disabled={
              !canEditOrder({
                userSector: session.user.sector ?? UserSector.NAO_DEFINIDO,
                status: serviceOrder.status,
                solutionType: serviceOrder.solutionType,
              })
            }
          >
            Editar OS
          </Button>
        </Link>
        {/* O botão de exclusão pode ser implementado via API Route + JS fetch, se necessário */}
        <Link href="/service-orders">
          <Button variant="outline">Voltar para a Lista</Button>
        </Link>
      </div>
    </div>
  );
}
