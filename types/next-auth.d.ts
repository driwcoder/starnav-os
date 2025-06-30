// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client"; // Importa o enum UserRole do Prisma

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole; // ✅ Adicionamos o 'role' aqui
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole; // ✅ Adicionamos o 'role' aqui
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: UserRole; // ✅ Adicionamos o 'role' aqui
  }
}