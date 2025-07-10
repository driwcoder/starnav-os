// app/page.tsx
"use client"; // Marca este componente como um Client Component

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button"; // Importe o componente Button do shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Importe os componentes Card

export default function HomePage() {
  const { data: session, status } = useSession(); // Hook para acessar a sessão

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Carregando sessão...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Bem-vindo ao StarNav OS!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {session ? (
            <>
              <p className="text-lg text-gray-700">
                Você está logado como:{" "}
                <span className="font-semibold text-indigo-600">
                  {session.user?.name || session.user?.email}
                </span>
              </p>
              <Button
                onClick={() => signOut({ callbackUrl: "/auth/login" })} // Redireciona para /login após deslogar
                className="w-full max-w-xs"
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg text-red-600">
                Você não está logado. Por favor, faça login para acessar o sistema.
              </p>
              <Button
                onClick={() => (window.location.href = "/auth/login")}
                className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700"
              >
                Ir para Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}