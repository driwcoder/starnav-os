"use client";
import * as React from "react";
import { ChevronRight } from "lucide-react";

import { VersionSwitcher } from "@/components/version-switcher";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { SidebarUserFooter } from "@/components/ui/avatar";
import { SearchForm } from "./search-form";
import Image from "next/image";

const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Ordens de Serviço",
      url: "/service-orders",
      items: [
        {
          title: "Meu Dashboard de OS",
          url: "/minhas-os",
        },
        {
          title: "Lista de OS",
          url: "/service-orders",
        },
        {
          title: "Nova OS",
          url: "/service-orders/new",
        },
      ],
    },
    {
      title: "Materiais",
      url: "#",
      items: [
        {
          title: "Solicitação de Materiais",
          url: "#",
        },
        {
          title: "Lista de Materiais",
          url: "#",
        },
        {
          title: "Pedidos de Materiais",
          url: "#",
          subitems: [
            {
              title: "Pedidos Atendidos",
              url: "/material-orders",
            },
            {
              title: "Pedidos em Aberto",
              url: "/material-orders/new",
            },
            {
              title: "Pedidos Cancelados",
              url: "/material-orders/new",
            },
          ],
        },
      ],
    },
    {
      title: "Estoque",
      url: "#",
      items: [
        {
          title: "Solicitação de Envio",
          url: "#",
        },
        {
          title: "Envios Pendentes",
          url: "#",
        },
        {
          title: "Materiais",
          url: "#",
          subitems: [
            {
              title: "Segurança",
              url: "/material-orders",
            },
            {
              title: "Maquinário",
              url: "/material-orders/new",
            },
            {
              title: "Limpeza",
              url: "/material-orders/new",
            },
          ],
        },
      ],
    },
    {
      title: "Usuários",
      url: "#",
      items: [
        {
          title: "Lista de Usuários",
          url: "/auth/users",
        },
        {
          title: "Cadastro de Usuários",
          url: "/auth/users/new",
        },
      ],
    },
  ],
};

// Submenu colapsável com visual moderno
function CollapsibleSubMenu({ item }: { item: any }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          className={`
            flex w-full items-center px-3 py-2 rounded-lg
            bg-sidebar transition-all duration-200
            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
            focus:outline-none focus:ring-2 focus:ring-sidebar-accent
            shadow-sm
          `}
        >
          <span className="font-semibold tracking-wide">{item.title}</span>
          <ChevronRight
            className={
              "ml-auto transition-transform duration-200" +
              (open ? " rotate-90" : "")
            }
          />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="ml-4 mt-1">
          {item.subitems.map((subitem: any) => (
            <SidebarMenuItem key={subitem.title}>
              <SidebarMenuButton
                asChild
                className={`
                  px-3 py-2 rounded-md transition-all duration-150
                  hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  text-sm font-medium
                `}
              >
                <a href={subitem.url}>{subitem.title}</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [openStates, setOpenStates] = React.useState(
    () => data.navMain.map(() => false)
  );

  return (
    <Sidebar
      {...props}
      className="bg-sidebar max-w-[272px] min-h-screen flex flex-col"
    >
      <SidebarHeader className="mb-2 px-4 py-5 border-b border-sidebar-accent flex flex-col items-center justify-center">
        <div className="w-full flex items-center justify-center">
          <Image
            src="/STARNAV_Branco_Preto.png"
            alt="Logo"
            width={180}
            height={48}
            className="object-contain h-12 w-auto"
            priority
          />
        </div>
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent className="gap-1 px-2 py-2 flex-1">
        {data.navMain.map((item, idx) => {
          if (item.title === "Usuários" && !isAdmin) return null;
          return (
            <Collapsible
              key={item.title}
              open={openStates[idx]}
              onOpenChange={(open) => {
                setOpenStates((prev) => {
                  const copy = [...prev];
                  copy[idx] = open;
                  return copy;
                });
              }}
              className="group/collapsible mb-1"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className={`
                    group/label flex items-center px-3 py-2 rounded-lg
                    text-sidebar-foreground font-bold text-base tracking-wide
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                    transition-all duration-200
                    cursor-pointer
                  `}
                >
                  <CollapsibleTrigger>
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="mt-1">
                      {item.items.map((item) =>
                        item.subitems ? (
                          <SidebarMenuItem key={item.title}>
                            <CollapsibleSubMenu item={item} />
                          </SidebarMenuItem>
                        ) : (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className={`
                                px-3 py-2 rounded-md transition-all duration-150
                                hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                                text-sm font-medium
                              `}
                            >
                              <a href={item.url}>{item.title}</a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 border-t border-sidebar-accent bg-sidebar">
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
