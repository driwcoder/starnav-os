// lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client"; // Importe UserRole

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

        // ✅ Retorne o role do usuário aqui!
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // Adiciona o role
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
      // O usuário retornado de authorize é adicionado ao token JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role; // ✅ Adiciona o role ao token
      }
      return token;
    },
    async session({ session, token }) {
      // O token JWT é adicionado à sessão do cliente
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole; // ✅ Adiciona o role à sessão
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};