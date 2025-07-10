// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/components/ui/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        {children}
      </SidebarProvider>
    </SessionProvider>
  );
}