// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import { UserRole, UserSector } from "@prisma/client"; // ✅ Importe UserSector

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      sector: UserSector; // ✅ Adicionamos o 'sector' aqui
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole;
    sector: UserSector; // ✅ Adicionamos o 'sector' aqui
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    sector: UserSector; // ✅ Adicionamos o 'sector' aqui
  }
}