"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Bot, TrendingUp, Target, Sparkles, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AgentCardProps {
  className?: string
  title: string
  description: string
  features: string[]
  creditsPerUse: number
  icon: React.ReactNode
  href: string
  highlight?: boolean
}

export function AgentCard({
  className,
  title,
  description,
  features,
  creditsPerUse,
  icon,
  href,
  highlight = false,
}: AgentCardProps) {
  return (
    <div
      className={cn(
        "relative group rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        highlight 
          ? "border-primary/20 bg-gradient-to-b from-primary/5 to-primary/10"
          : "border-border bg-card",
        className
      )}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            Mais Popular
          </span>
        </div>
      )}
      
      <div className="p-6">
        {/* Ícone e Título */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "p-3 rounded-xl transition-colors",
            highlight ? "bg-primary/10" : "bg-muted"
          )}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>{creditsPerUse} créditos por uso</span>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button 
          asChild 
          className={cn(
            "w-full group/btn",
            highlight && "bg-primary hover:bg-primary/90"
          )}
        >
          <Link href={href}>
            Usar Agente
            <Bot className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

// Agentes específicos do FiiAI
export function FiiAgents() {
  const agents = [
    {
      title: "Avaliador de Carteiras",
      description: "Analise sua carteira atual comparando com nossa carteira recomendada e receba sugestões personalizadas de otimização.",
      features: [
        "Análise detalhada de diversificação",
        "Comparação com carteira modelo",
        "Identificação de oportunidades",
        "Sugestões de rebalanceamento",
        "Relatório completo em PDF"
      ],
      creditsPerUse: 10,
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      href: "/dashboard/avaliar-carteira",
      highlight: true,
    },
    {
      title: "Direcionador de Aportes",
      description: "Receba recomendações inteligentes de como distribuir seus novos aportes para otimizar sua carteira de FIIs.",
      features: [
        "Cálculo automático de distribuição",
        "Otimização baseada em metas",
        "Consideração de liquidez e yields",
        "Diversificação por setores",
        "Simulação de cenários"
      ],
      creditsPerUse: 5,
      icon: <Target className="h-6 w-6 text-primary" />,
      href: "/dashboard/direcionar-aportes",
    },
  ]

  return (
    <section id="agentes" className="container mx-auto px-4 mt-24">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Agentes Especializados em FIIs
        </h2>
        <p className="text-muted-foreground text-lg">
          Dois agentes de IA especializados para otimizar sua carteira de fundos imobiliários
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {agents.map((agent, index) => (
          <AgentCard key={index} {...agent} />
        ))}
      </div>
    </section>
  )
}