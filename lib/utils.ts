import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// lib/utils.ts

// Função original do shadcn/ui para combinar classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Nova função para formatar datas
export function formatDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return "Data Inválida";
  }
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
} 