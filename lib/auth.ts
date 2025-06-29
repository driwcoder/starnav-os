// lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma"; // Importe a instância do Prisma Client
import bcrypt from "bcryptjs"; // Importe o bcryptjs

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
          return null; // Credenciais vazias
        }

        // 1. Verificar o sufixo do e-mail
        if (!credentials.email.endsWith("@starnav.com.br")) {
          console.log("Tentativa de login com email não autorizado: ", credentials.email);
          return null; // Não permite login se o sufixo não for o esperado
        }

        // 2. Buscar o usuário no banco de dados pelo email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log("Usuário não encontrado: ", credentials.email);
          return null; // Usuário não encontrado
        }

        // 3. Comparar a senha fornecida com o hash da senha no banco de dados
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password // user.password é o hash armazenado no DB
        );

        if (!isPasswordValid) {
          console.log("Senha inválida para: ", credentials.email);
          return null; // Senha incorreta
        }

        // Se a autenticação for bem-sucedida, retorne um objeto de usuário simplificado
        // Não retorne o hash da senha!
        return {
          id: user.id,
          name: user.name,
          email: user.email,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};