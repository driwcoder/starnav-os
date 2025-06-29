// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Adiciona o PrismaClient ao objeto global em desenvolvimento para evitar múltiplas instâncias
// durante o hot-reloading do Next.js
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;