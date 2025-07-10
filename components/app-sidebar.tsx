"use client";
import * as React from "react";
import { ChevronRight } from "lucide-react";

import { VersionSwitcher } from "@/components/version-switcher";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { SidebarUserFooter } from "@/components/ui/avatar";

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
          url: "/users",
        },
        {
          title: "Cadastro de Usuários",
          url: "/users/new",
        },
      ],
    },
  ],
};

function useIsAdmin() {
  const { data: session } = useSession();
  return session?.user?.role === "ADMIN";
}
// ...SidebarUserFooter foi movido para ui/avatar.tsx...
// Submenu colapsável com Chevron girando corretamente
function CollapsibleSubMenu({ item }: { item: any }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <CollapsibleTrigger asChild>
        <SidebarMenuButton className="flex w-full items-center">
          {item.title}
          <ChevronRight
            className={
              "ml-auto transition-transform" + (open ? " rotate-90" : "")
            }
          />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="ml-4">
          {item.subitems.map((subitem: any) => (
            <SidebarMenuItem key={subitem.title}>
              <SidebarMenuButton asChild>
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
  const isAdmin = useIsAdmin();
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {data.navMain.map((item) => {
          if (item.title === "Usuários" && !isAdmin) {
            return null;
          }
          return (
            <Collapsible
              key={item.title}
              title={item.title}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-lg"
                >
                  <CollapsibleTrigger>
                    {item.title}{" "}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {item.items.map((item) =>
                        item.subitems ? (
                          <SidebarMenuItem key={item.title}>
                            <CollapsibleSubMenu item={item} />
                          </SidebarMenuItem>
                        ) : (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
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
      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
