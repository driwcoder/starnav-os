import { UserRole, OrderStatus } from "@prisma/client";

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
  field: Field,
  currentStatus: OrderStatus
): boolean {
  const editableByRole: Record<Field, UserRole[]> = {
    plannedStartDate: ["COORDENADOR"],
    plannedEndDate: ["COORDENADOR"],
    solutionType: ["COORDENADOR"],
    responsibleCrew: ["COORDENADOR"],
    coordinatorNotes: ["COORDENADOR"],
    contractedCompany: ["COMPRADOR_PLENO", "COMPRADOR_SENIOR"],
    contractDate: ["COMPRADOR_PLENO", "COMPRADOR_SENIOR"],
    serviceOrderCost: ["COMPRADOR_PLENO", "COMPRADOR_SENIOR"],
    supplierNotes: ["COMPRADOR_PLENO", "COMPRADOR_SENIOR"],
  };

  const allowedRoles = editableByRole[field];
  return allowedRoles?.includes(userRole);
}
