"use client";

import Link from "next/link";
import type { ElementType } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Shield,
  Users,
  FolderOpen,
  Settings,
} from "lucide-react";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/logo";

type Item = { title: string; href: string; icon: ElementType };

const overview: Item[] = [
  { title: "Painel", href: "/admin", icon: LayoutDashboard },
];
const management: Item[] = [
  { title: "Usuários", href: "/admin/users", icon: Users },
  { title: "Carteiras", href: "/admin/carteiras", icon: FolderOpen },
  { title: "Armazenamento", href: "/admin/storage", icon: FolderOpen },
];
const reports: Item[] = [
  { title: "Histórico de Uso", href: "/admin/usage", icon: Activity },
];
const configuration: Item[] = [
  { title: "Regras de Recomendação", href: "/admin/regras-recomendacao", icon: Settings },
];

function NavList({ items, pathname }: { items: Item[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <Link href={item.href}>
                <Icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo variant="icon" size="md" className="group-data-[collapsible=icon]:block hidden" priority />
          <Logo variant="full" size="md" className="group-data-[collapsible=icon]:hidden block" priority />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Visão Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavList items={overview} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Gerenciamento</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavList items={management} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Relatórios</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavList items={reports} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavList items={configuration} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Voltar ao App">
              <Link href="/dashboard">
                <span>Voltar ao App</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
