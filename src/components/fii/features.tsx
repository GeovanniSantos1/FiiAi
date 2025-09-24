"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  Target, 
  FileSpreadsheet, 
  BarChart3, 
  Shield, 
  Zap, 
  Building2, 
  PieChart, 
  Calculator,
  TrendingDown,
  Eye,
  CheckCircle
} from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"

const features = [
  {
    area: "md:[grid-area:1/1/2/2]",
    icon: <FileSpreadsheet className="h-5 w-5 text-blue-500" />,
    title: "Upload de Carteira",
    description: "Importe sua carteira atual via Excel ou CSV e visualize sua posição de forma organizada."
  },
  {
    area: "md:[grid-area:1/2/2/3]", 
    icon: <TrendingUp className="h-5 w-5 text-green-500" />,
    title: "Análise Comparativa",
    description: "Compare sua carteira com nossa carteira recomendada baseada em critérios técnicos."
  },
  {
    area: "md:[grid-area:1/3/2/4]",
    icon: <Target className="h-5 w-5 text-purple-500" />,
    title: "Recomendação de Aportes", 
    description: "Receba sugestões inteligentes de como distribuir novos investimentos."
  },
  {
    area: "md:[grid-area:2/1/2/2]",
    icon: <BarChart3 className="h-5 w-5 text-orange-500" />,
    title: "Análise de Setores",
    description: "Diversificação por segmentos: shopping, logística, corporativo e mais."
  },
  {
    area: "md:[grid-area:2/2/2/3]",
    icon: <PieChart className="h-5 w-5 text-pink-500" />,
    title: "Otimização de Yield",
    description: "Maximize seus dividendos com base no histórico e projeções dos FIIs."
  },
  {
    area: "md:[grid-area:2/3/2/4]",
    icon: <Calculator className="h-5 w-5 text-indigo-500" />,
    title: "Métricas Avançadas",
    description: "P/VP, Dividend Yield, liquidez e análise fundamentalista completa."
  },
  {
    area: "md:[grid-area:3/1/3/2]",
    icon: <Shield className="h-5 w-5 text-emerald-500" />,
    title: "Gestão de Risco",
    description: "Identificação de concentração excessiva e sugestões de diversificação."
  },
  {
    area: "md:[grid-area:3/2/3/3]",
    icon: <Eye className="h-5 w-5 text-cyan-500" />,
    title: "Monitoramento Contínuo",
    description: "Acompanhe a performance da sua carteira e recomendações atualizadas."
  },
  {
    area: "md:[grid-area:3/3/3/4]",
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
    title: "Análise em Tempo Real",
    description: "Processamento rápido com resultados em menos de 10 segundos."
  }
]

function GridItem({ 
  area, 
  icon, 
  title, 
  description 
}: { 
  area: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <li className={cn("relative rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3", area)}>
      <GlowingEffect 
        spread={40} 
        glow 
        disabled={false} 
        proximity={64} 
        inactiveZone={0.01} 
        borderWidth={3} 
      />
      <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm">
        <span className="inline-flex size-8 items-center justify-center rounded-lg border-[0.75px] border-border bg-muted">
          {icon}
        </span>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </li>
  )
}

export function FiiFeatures() {
  return (
    <section id="recursos" className="container mx-auto px-4 mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Recursos Completos para FIIs
        </h2>
        <p className="mt-3 text-muted-foreground">
          Tudo que você precisa para otimizar seus investimentos em fundos imobiliários
        </p>
      </div>
      <div className="mt-10">
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-3 md:grid-rows-3 lg:gap-4">
          {features.map((feature, index) => (
            <GridItem key={index} {...feature} />
          ))}
        </ul>
      </div>
    </section>
  )
}