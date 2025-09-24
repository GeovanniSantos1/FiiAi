"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Upload, Brain, Zap, PieChart } from "lucide-react";
import Link from "next/link";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  credits: number;
  highlight?: boolean;
  badge?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Avaliar Carteira",
    description: "Análise completa da sua carteira atual com IA",
    href: "/dashboard/avaliar-carteira",
    icon: <TrendingUp className="h-5 w-5" />,
    credits: 15,
    highlight: true,
    badge: "Popular"
  },
  {
    title: "Direcionador de Aportes", 
    description: "Recomendações para seus próximos investimentos",
    href: "/dashboard/direcionar-aportes",
    icon: <Target className="h-5 w-5" />,
    credits: 8,
    badge: "Novo"
  },
  {
    title: "Carregar Nova Carteira",
    description: "Faça upload de uma planilha atualizada",
    href: "/dashboard/avaliar-carteira#upload",
    icon: <Upload className="h-5 w-5" />,
    credits: 0
  }
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>
          Acesse rapidamente os agentes de IA da FiiAI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {QUICK_ACTIONS.map((action, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                action.highlight ? 'border-primary/20 bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-background border">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{action.title}</h4>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {action.credits > 0 ? `${action.credits} créditos` : 'Gratuito'}
                      </span>
                      <Button 
                        size="sm" 
                        variant={action.highlight ? "default" : "outline"}
                        asChild
                      >
                        <Link href={action.href}>
                          {action.credits > 0 ? (
                            <>
                              <Brain className="h-3 w-3 mr-1" />
                              Usar IA
                            </>
                          ) : (
                            'Acessar'
                          )}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}