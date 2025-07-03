// components/layout/sidebar.tsx
"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Sidebar() {
  const { data: session } = useSession();
  return (
    <aside className="hidden w-64 flex-col border-r bg-white p-4 md:flex">
      <nav className="flex flex-col space-y-2">
        <Link
          href="/dashboard/minhas-os"
          className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#10679f]"
        >
          Minhas Ordens de Serviço
        </Link>
        <Link
          href="/dashboard/service-orders"
          className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#10679f]"
        >
          Ordens de Serviço
        </Link>
        <Link
          href="/dashboard/materials"
          className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#10679f]"
        >
          Materiais
        </Link>
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/dashboard/users"
            className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#10679f]"
          >
            Usuários
          </Link>
        )}
        <Link
          href="/dashboard/profile"
          className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#10679f]"
        >
          Meu Perfil
        </Link>

        {/* Adicione mais links conforme as funcionalidades */}
      </nav>
    </aside>
  );
}
