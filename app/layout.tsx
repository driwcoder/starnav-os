import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Loading from "./loading";
import { Suspense } from "react";
import { Providers } from "./providers"; // Importa o Providers client

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Starnav System",
  description:
    "Gerenciamento de processos da empresa Starnav Serviços Maritimos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </SidebarInset>
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
