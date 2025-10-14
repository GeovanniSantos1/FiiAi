"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  Bot,
  TrendingUp,
  Target,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logo } from "@/components/brand/logo";
import { LoadingLink } from "@/components/navigation/LoadingLink";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export const navigationItems = [
  { name: "Painel", href: "/dashboard", icon: Home },
  { name: "Avaliador de Carteiras", href: "/dashboard/avaliar-carteira", icon: TrendingUp },
  { name: "Direcionador de Aportes", href: "/dashboard/direcionar-aportes", icon: Target },
  { name: "Carteiras Recomendadas", href: "/dashboard/carteiras-recomendadas", icon: Building2 },
  { name: "Perfil", href: "/profile", icon: User },
];

export const adminNavigationItems = [
  // Carteiras Recomendadas removido - agora integrado com /admin/carteiras
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAdmin();
  
  const allNavigationItems = isAdmin 
    ? [...navigationItems, ...adminNavigationItems]
    : navigationItems;

  return (
    <aside
      className={cn(
        "relative z-30 border-r border-border/40 bg-card/30 text-card-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-card/20 glass-panel transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[64px]" : "w-64",
        "hidden md:block my-4"
      )}
      aria-label="Barra lateral principal"
    >
      <div className="flex h-14 items-center gap-2 px-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          {collapsed ? (
            <Logo variant="icon" size="md" priority />
          ) : (
            <Logo variant="full" size="lg" priority />
          )}
        </Link>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <nav className="flex flex-col gap-1 p-2" aria-label="Navegação principal">
          {allNavigationItems.map((item) => {
            const isActive = pathname === item.href;
            const link = (
              <LoadingLink
                key={item.name}
                href={item.href}
                showInlineLoader={false}
                prefetch={true}
                aria-label={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.name}</span>}
              </LoadingLink>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
