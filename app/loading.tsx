// app/dashboard/loading.tsx
// Este é um Client Component simples de carregamento para o Suspense
"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="flex flex-col items-center gap-4">
        <span className="animate-spin rounded-full bg-white p-4 shadow-md">
          <Loader2 className="h-10 w-10 text-blue-600" />
        </span>
        {/* <h2 className="text-2xl font-bold text-gray-800">Carregando...</h2>
        <p className="text-gray-500 text-center max-w-xs">
          Aguarde enquanto buscamos as informações do seu painel. Isso pode levar
          alguns segundos.
        </p> */}
      </div>
    </div>
  );
}