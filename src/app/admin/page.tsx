"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  Activity,
  FolderOpen,
  Plus
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load dashboard data</p>
          <p className="text-sm text-destructive mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel do Administrador</h1>
          <p className="text-muted-foreground mt-2">Visão geral do sistema e análises</p>
        </div>
        <div />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total de Usuários</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
            <span className="text-success-500">+12%</span>
            <span className="text-muted-foreground ml-2">do último mês</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Usuários Ativos</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats?.activeUsers || 0}
              </p>
            </div>
            <Activity className="h-8 w-8 text-success-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
            <span className="text-success-500">+8%</span>
            <span className="text-muted-foreground ml-2">da última semana</span>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Carteiras Recomendadas
            </CardTitle>
            <CardDescription>
              Gerencie carteiras de FIIs para recomendação aos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/admin/carteiras">
                  Gerenciar Carteiras
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/carteiras/nova">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Carteira
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// Removed seed/backfill demo buttons to simplify admin surface
