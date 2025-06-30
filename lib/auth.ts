// lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole, UserSector } from "@prisma/client"; // ✅ Importe UserSector

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        if (!credentials.email.endsWith("@starnav.com.br")) {
          console.log("Tentativa de login com email não autorizado: ", credentials.email);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log("Usuário não encontrado: ", credentials.email);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          console.log("Senha inválida para: ", credentials.email);
          return null;
        }

        // ✅ Retorne o role e o sector do usuário aqui!
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sector: user.sector, // ✅ Adiciona o sector
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role;
        token.sector = (user as any).sector; // ✅ Adiciona o sector ao token
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.sector = token.sector as UserSector; // ✅ Adiciona o sector à sessão
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};