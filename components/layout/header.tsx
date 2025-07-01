// components/layout/header.tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react"; // Será necessário instalar lucide-react
import Link from "next/link"; // Adicione esta importação
import Image from "next/image";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center">
          {/* Botão para abrir o menu lateral em telas menores */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Navegação</SheetTitle>
                <SheetDescription>Menu principal do Starnav</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 pt-6">
                <Link
                  href="/"
                  className="text-lg font-medium text-gray-700 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/service-orders"
                  className="text-lg font-medium text-gray-700 hover:text-indigo-600"
                >
                  Ordens de Serviço
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="ml-4 text-2xl font-bold text-black">
            <Image
              src="/STARNAV_ServicosMaritimosLtda_Branco_Preto.svg"
              alt="Starnav"
              width={250}
              height={50}
            />
            {/* <Image
            src="/STARNAV_Branco_Preto.png"
            alt="Starnav"
            width={50}
            height={50}
          />  */}
          </h1>
        </div>
        <nav className="flex items-center space-x-4">
          {session?.user ? (
            <>
              <span className="hidden text-gray-700 md:inline">
                Olá, {session.user.name || session.user.email}!
              </span>
              <Button
                onClick={() => signOut({ callbackUrl: "/login" })}
                variant="outline"
              >
                Sair
              </Button>
            </>
          ) : (
            <Button onClick={() => (window.location.href = "/login")}>
              Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
