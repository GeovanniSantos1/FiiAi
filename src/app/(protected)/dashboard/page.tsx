"use client";

import { useUser } from "@clerk/nextjs";
import { CreditStatus } from "@/components/credits/credit-status";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentAnalysis } from "@/components/dashboard/recent-analysis";
import { useSetPageMetadata } from "@/contexts/page-metadata";

export default function DashboardPage() {
  const { user } = useUser();
  
  useSetPageMetadata({
    title: `Bem-vindo à FiiAI, ${user?.firstName || "Usuário"}!`,
    description: "Sua plataforma de análise inteligente de Fundos Imobiliários",
    breadcrumbs: [
      { label: "Dashboard" }
    ]
  });
  
  return (
    <div className="space-y-8">
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard FiiAI</h1>
          <p className="text-muted-foreground">Análise inteligente de Fundos Imobiliários</p>
        </div>
        <CreditStatus />
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PortfolioSummary />
      </div>

      {/* Actions and Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions />
        <RecentAnalysis />
      </div>
    </div>
  );
}