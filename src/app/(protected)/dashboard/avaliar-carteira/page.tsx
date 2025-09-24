"use client";

import React from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { PortfolioUploadSection } from "@/components/fii/portfolio-upload-section";
import { PortfolioAnalysisSection } from "@/components/fii/portfolio-analysis-section";
import { usePortfolioUpload } from "@/hooks/use-portfolio-upload";
import { TrendingUp, Brain, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AvaliarCarteiraPage() {
  const { uploadResult } = usePortfolioUpload();

  useSetPageMetadata({
    title: "Avaliador de Carteiras FII",
    description: "Analise sua carteira de FIIs com inteligência artificial",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Avaliador de Carteiras" }
    ]
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Avaliador de Carteiras FII</CardTitle>
              <CardDescription className="text-base">
                Faça upload da sua carteira e receba uma análise completa com sugestões de otimização
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Análise com IA</p>
                <p className="text-sm text-muted-foreground">OpenAI GPT-5</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Diversificação</p>
                <p className="text-sm text-muted-foreground">Por setores</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Recomendações</p>
                <p className="text-sm text-muted-foreground">Personalizadas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <PortfolioUploadSection />

      {/* Analysis Section - Only show if there's an uploaded portfolio */}
      {uploadResult && (
        <PortfolioAnalysisSection 
          portfolioId={uploadResult.portfolioId} 
          portfolioName={uploadResult.name}
        />
      )}
    </div>
  );
}