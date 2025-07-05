import { UserRole, OrderStatus, UserSector } from "@prisma/client";

type Field = keyof {
  plannedStartDate: string;
  plannedEndDate: string;
  solutionType: string;
  responsibleCrew: string;
  coordinatorNotes: string;
  contractedCompany: string;
  contractDate: string;
  serviceOrderCost: string;
  supplierNotes: string;
};

export function canEditField(
  userRole: UserRole,
  userSector: UserSector, // NOVO parâmetro
  field: Field,
  currentStatus: OrderStatus
): boolean {
  // Exemplo: só pode editar se for do setor OPERACOES ou SUPRIMENTOS, além da role
  const editableByRoleAndSector: Record<Field, { roles: UserRole[]; sectors: UserSector[] }> = {
    plannedStartDate: { roles: ["COORDENADOR"], sectors: ["OPERACAO", "MANUTENCAO"] },
    plannedEndDate: { roles: ["COORDENADOR"], sectors: ["OPERACAO", "MANUTENCAO"] },
    solutionType: { roles: ["COORDENADOR"], sectors: ["OPERACAO", "MANUTENCAO"] },
    responsibleCrew: { roles: ["COORDENADOR"], sectors: ["OPERACAO", "MANUTENCAO"] },
    coordinatorNotes: { roles: ["COORDENADOR"], sectors: ["OPERACAO", "MANUTENCAO"] },
    contractedCompany: { roles: ["COMPRADOR_PLENO", "COMPRADOR_SENIOR", "COMPRADOR_JUNIOR"], sectors: ["SUPRIMENTOS"] },
    contractDate: { roles: ["COMPRADOR_PLENO", "COMPRADOR_SENIOR", "COMPRADOR_JUNIOR"], sectors: ["SUPRIMENTOS"] },
    serviceOrderCost: { roles: ["COMPRADOR_PLENO", "COMPRADOR_SENIOR", "COMPRADOR_JUNIOR"], sectors: ["SUPRIMENTOS"] },
    supplierNotes: { roles: ["COMPRADOR_PLENO", "COMPRADOR_SENIOR", "COMPRADOR_JUNIOR"], sectors: ["SUPRIMENTOS"] },
  };

  const rule = editableByRoleAndSector[field];
  if (!rule) return false;

  return rule.roles.includes(userRole) && rule.sectors.includes(userSector);
}
