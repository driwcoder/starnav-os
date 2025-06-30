// components/layout/sidebar.tsx
import Link from "next/link";
import { UserRole } from "@prisma/client"; // Importe UserRole, se usado para renderizacao condicional

export default function Sidebar() {
  // Se precisar de useSession para renderizacao condicional no sidebar,
  // este componente precisaria ser 'use client' e usar useSession.
  // Por enquanto, mantemos como Server Component para simplicidade,
  // assumindo que a rota /dashboard/profile já terá sua propria protecao.

  return (
    <aside className="hidden w-64 flex-col border-r bg-white p-4 md:flex">
      <nav className="flex flex-col space-y-2">
        <Link href="/dashboard" className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600">
          Dashboard
        </Link>
        <Link href="/dashboard/service-orders" className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600">
          Ordens de Serviço
        </Link>
        <Link href="/dashboard/materials" className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600">
          Materiais
        </Link>
        <Link href="/dashboard/users" className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600">
          Gerenciar Usuários
        </Link>
        {/* NOVO LINK PARA MEU PERFIL */}
        <Link href="/dashboard/profile" className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600">
          Meu Perfil
        </Link>
        {/* Adicione mais links conforme as funcionalidades */}
      </nav>
    </aside>
  );
}