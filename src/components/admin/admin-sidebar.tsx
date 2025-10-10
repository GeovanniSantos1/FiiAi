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
  DollarSign,
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
  { title: "Preços Teto", href: "/admin/precos-teto", icon: DollarSign },
  { title: "Armazenamento", href: "/admin/storage", icon: FolderOpen },
];
const reports: Item[] = [
  { title: "Histórico de Uso", href: "/admin/usage", icon: Activity },
];
const configuration: Item[] = [
  { title: "Regras de Recomendação", href: "/admin/regras-recomendacao", icon: Settings },
  { title: "Regras de Direcionamento", href: "/admin/regras-direcionamento-aportes", icon: Settings },
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
            <SidebarMenuButton asChild tooltip="Voltar ao Dashboard" className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10 hover:from-emerald-600/20 hover:via-teal-600/20 hover:to-cyan-600/20 border border-emerald-600/20 text-emerald-600 hover:text-white transition-all duration-200">
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Voltar ao Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
