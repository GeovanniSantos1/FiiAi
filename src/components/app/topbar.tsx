"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, Shield } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { navigationItems } from "@/components/app/sidebar";
import { Logo } from "@/components/brand/logo";
import { useAdmin } from "@/hooks/use-admin";

type TopbarProps = {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
};

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { isAdmin } = useAdmin();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 w-full border-b border-border/40 bg-background/30 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20 glass-panel"
      )}
      role="banner"
    >
      <div className="glow-separator w-full" aria-hidden="true" />
      <div className="flex h-14 items-center gap-2 px-3 md:px-4">
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 md:hidden">
              <SheetHeader className="p-4 text-left">
                <div className="flex items-center justify-between">
                  <Logo variant="full" size="md" />
                </div>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon as React.ComponentType<{ className?: string }>;
                  return (
                    <SheetClose asChild key={item.name}>
                      <Link
                        href={item.href}
                        className={"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
                
                {isAdmin && (
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <SheetClose asChild>
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-blue-600/10 hover:from-violet-600/20 hover:via-purple-600/20 hover:to-blue-600/20 border border-gradient-to-r from-violet-600/30 via-purple-600/30 to-blue-600/30"
                      >
                        <Shield className="h-4 w-4 text-violet-600" />
                        <span className="font-medium bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                          Painel Admin
                        </span>
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </nav>
              <SheetFooter className="mt-auto p-4">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <SignedIn>
                      <div className="flex items-center gap-3">
                        <UserButton afterSignOutUrl="/" />
                      </div>
                    </SignedIn>
                    <SignedOut>
                      <div className="flex items-center gap-2">
                        <SignInButton mode="modal">
                          <Button variant="ghost" size="sm">Entrar</Button>
                        </SignInButton>
                      </div>
                    </SignedOut>
                  </div>
                  <ThemeToggle />
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand (mobile) */}
        <Link href="/dashboard" className="flex items-center md:hidden">
          <Logo variant="full" size="sm" priority />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Alternar barra lateral"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <SignedIn>
            <NotificationBell />
            <Separator orientation="vertical" className="h-6" />
          </SignedIn>

          {isAdmin && (
            <>
              <Button
                asChild
                variant="default"
                size="sm"
                className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-0">
                <Link href="/admin" className="relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-blue-600/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                  <Shield className="h-4 w-4 mr-2 drop-shadow-sm" />
                  <span className="font-medium drop-shadow-sm">Admin</span>
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          <ThemeToggle />

          <SignedIn>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
