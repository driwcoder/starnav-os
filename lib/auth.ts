// lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Reutiliza a configuração centralizada do NextAuth
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, _req) {
        // Em um projeto real, você buscaria o usuário no banco de dados e verificaria a senha.
        // Por enquanto, vamos simular um usuário para testar a autenticação.
        // Lembre-se de instalar bcryptjs: pnpm add bcryptjs
        // E importar: import bcrypt from 'bcryptjs';

        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = {
          id: "1",
          name: "Usuário Teste",
          email: "teste@starnav.com.br",
          password: "senhaSegura123",
        };

        if (!user.email.endsWith("@starnav.com.br")) {
          return null;
        }

        if (credentials.email === user.email && credentials.password === user.password) {
          return { id: user.id, name: user.name, email: user.email };
        } else {
          return null;
        }
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