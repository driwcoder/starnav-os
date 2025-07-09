// lib/permissions.ts
import { UserRole, UserSector, OrderStatus } from "@prisma/client";

interface UserSessionInfo {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    sector: UserSector;
}

export const hasViewPermission = (userSession: UserSessionInfo | undefined) => {
    if (!userSession) return false;
    return true; // Todos os usuários logados com email @starnav.com.br podem ver
};

export const canCreateOs = (userSession: UserSessionInfo | undefined) => {
    if (!userSession) return false;
    if (userSession.role === UserRole.ADMIN) return true;

    const allowedSectorsForCreation = [
        UserSector.MANUTENCAO,
        UserSector.OPERACAO,
        UserSector.TRIPULACAO,
    ] as const;

    return allowedSectorsForCreation.includes(userSession.sector as typeof allowedSectorsForCreation[number]);
};

export const canEditOs = (
    osStatus: OrderStatus,
    osCreatedById: string, // osCreatedById ainda é passado, mas não será usado para TRIPULACAO
    userSession: UserSessionInfo | undefined
) => {
    if (!userSession) return false;

    if (userSession.role === UserRole.ADMIN) {
        return true; // ADMIN sempre pode editar
    }

    switch (userSession.sector) {
        case UserSector.TRIPULACAO:
            const allowedRolesTripulacao = [
                UserRole.COMANDANTE, UserRole.IMEDIATO, UserRole.OQN,
                UserRole.CHEFE_MAQUINAS, UserRole.SUB_CHEFE_MAQUINAS, UserRole.OQM
            ] as const;

            const allowedStatusesTripulacao = [
                OrderStatus.PENDENTE, OrderStatus.RECUSADA, OrderStatus.EM_EXECUCAO,
            ] as const;

            // ✅ CORREÇÃO: Removido userSession.id === osCreatedById
            return allowedRolesTripulacao.includes(userSession.role as typeof allowedRolesTripulacao[number]) &&
                   allowedStatusesTripulacao.includes(osStatus as typeof allowedStatusesTripulacao[number]);

        case UserSector.MANUTENCAO:
        case UserSector.OPERACAO:
            const allowedRolesManutencaoOperacao = [
                UserRole.GESTOR, UserRole.SUPERVISOR, UserRole.COORDENADOR
            ] as const;

            const allowedStatusesManutencaoOperacao = [
                OrderStatus.PENDENTE, OrderStatus.EM_ANALISE, OrderStatus.APROVADA,
                OrderStatus.RECUSADA, OrderStatus.PLANEJADA, OrderStatus.AGUARDANDO_SUPRIMENTOS,
            ] as const;

            return allowedRolesManutencaoOperacao.includes(userSession.role as typeof allowedRolesManutencaoOperacao[number]) &&
                   allowedStatusesManutencaoOperacao.includes(osStatus as typeof allowedStatusesManutencaoOperacao[number]);

        case UserSector.SUPRIMENTOS:
            const allowedRolesSuprimentos = [
                UserRole.COMPRADOR_JUNIOR, UserRole.COMPRADOR_PLENO, UserRole.COMPRADOR_SENIOR
            ] as const;

            const allowedStatusesSuprimentos = [
                OrderStatus.AGUARDANDO_SUPRIMENTOS, OrderStatus.CONTRATADA, OrderStatus.EM_EXECUCAO,
            ] as const;

            return allowedRolesSuprimentos.includes(userSession.role as typeof allowedRolesSuprimentos[number]) &&
                   allowedStatusesSuprimentos.includes(osStatus as typeof allowedStatusesSuprimentos[number]);

        default:
            return false;
    }
};

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDENTE]: [OrderStatus.EM_ANALISE, OrderStatus.RECUSADA],
    [OrderStatus.EM_ANALISE]: [OrderStatus.APROVADA, OrderStatus.RECUSADA, OrderStatus.PLANEJADA],
    [OrderStatus.APROVADA]: [OrderStatus.PLANEJADA, OrderStatus.EM_EXECUCAO],
    [OrderStatus.PLANEJADA]: [OrderStatus.AGUARDANDO_SUPRIMENTOS, OrderStatus.EM_EXECUCAO],
    [OrderStatus.AGUARDANDO_SUPRIMENTOS]: [OrderStatus.CONTRATADA, OrderStatus.AGUARDANDO_MATERIAL, OrderStatus.CANCELADA],
    [OrderStatus.CONTRATADA]: [OrderStatus.EM_EXECUCAO, OrderStatus.CANCELADA],
    [OrderStatus.EM_EXECUCAO]: [OrderStatus.CONCLUIDA, OrderStatus.AGUARDANDO_MATERIAL, OrderStatus.CANCELADA],
    [OrderStatus.AGUARDANDO_MATERIAL]: [OrderStatus.EM_EXECUCAO, OrderStatus.CANCELADA],
    [OrderStatus.CONCLUIDA]: [OrderStatus.APROVADA, OrderStatus.CANCELADA],
    [OrderStatus.CANCELADA]: [OrderStatus.PENDENTE],
    [OrderStatus.RECUSADA]: [OrderStatus.PENDENTE],
};

export const isValidStatusTransition = (
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userSession: UserSessionInfo
): boolean => {
    if (userSession.role === UserRole.ADMIN) {
        return true;
    }

    const allowedNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowedNextStatuses) {
        return false;
    }

    if (!allowedNextStatuses.includes(newStatus)) {
        return false;
    }

    switch (userSession.sector) {
        case UserSector.TRIPULACAO:
            // Tripulação pode fazer transições do seu fluxo
            if (currentStatus === OrderStatus.PENDENTE && newStatus === OrderStatus.EM_ANALISE) return true;
            if (currentStatus === OrderStatus.EM_EXECUCAO && (newStatus === OrderStatus.CONCLUIDA || newStatus === OrderStatus.AGUARDANDO_MATERIAL)) return true;
            if (currentStatus === OrderStatus.RECUSADA && newStatus === OrderStatus.PENDENTE) return true;
            return false;
        case UserSector.MANUTENCAO:
        case UserSector.OPERACAO:
            // Coordenadores: Podem fazer a maioria das transições do fluxo de planejamento
            return allowedNextStatuses.includes(newStatus);
        case UserSector.SUPRIMENTOS:
            // Compradores: Podem fazer transições do seu fluxo de compras
            if (currentStatus === OrderStatus.AGUARDANDO_SUPRIMENTOS && (newStatus === OrderStatus.CONTRATADA || newStatus === OrderStatus.CANCELADA || newStatus === OrderStatus.AGUARDANDO_MATERIAL)) return true;
            if (currentStatus === OrderStatus.CONTRATADA && (newStatus === OrderStatus.EM_EXECUCAO || newStatus === OrderStatus.CANCELADA)) return true;
            return false;
        default:
            return false;
    }
};

export const canDeleteOs = (userSession: UserSessionInfo | undefined) => {
    if (!userSession) return false;
    return userSession.role === UserRole.ADMIN;
};