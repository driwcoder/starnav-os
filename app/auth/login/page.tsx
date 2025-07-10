"use client";

import { GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 self-center font-medium">
            <Image
              src="/STARNAV_Branco_Preto.png"
              alt="Icone da empresa"
              width={50}
              height={50}
            />
          Starnav Serviços Maritimos LTDA.
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
