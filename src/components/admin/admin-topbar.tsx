"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LayoutDashboard } from "lucide-react";

export function AdminTopbar() {
  const { user, isLoaded } = useUser();

  const getUserDisplayName = () => {
    if (!isLoaded) return "Carregando...";
    return user?.fullName || user?.firstName || user?.username || "Usuário";
  };

  return (
    <div className="h-16 bg-background/70 backdrop-blur border-b border-border px-4 md:px-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <SidebarTrigger />
        <Logo variant="full" size="sm" className="sm:hidden" priority />
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          asChild
          variant="default"
          size="sm"
          className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-0">
          <Link href="/dashboard" className="relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
            <LayoutDashboard className="h-4 w-4 mr-2 drop-shadow-sm" />
            <span className="font-medium drop-shadow-sm">Dashboard</span>
          </Link>
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <UserButton />
        </div>
      </div>
    </div>
  );
}
