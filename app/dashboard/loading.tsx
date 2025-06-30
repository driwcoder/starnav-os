// app/dashboard/loading.tsx
// Este é um Client Component simples de carregamento para o Suspense
"use client";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gray-100">
      <p className="text-xl text-gray-700">Carregando conteúdo...</p>
    </div>
  );
}