"use client";

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, TrendingUp, Building2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'

export function FiiHero() {
  return (
    <>
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-30 contain-strict hidden lg:block">
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(45,100%,60%,.12)_0,hsla(45,80%,50%,.06)_50%,hsla(45,60%,40%,0)_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(45,100%,60%,.08)_0,hsla(45,60%,40%,.04)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(45,90%,55%,.06)_0,hsla(45,50%,35%,.03)_80%,transparent_100%)]" />
        </div>

        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 0.3,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: 'spring' as const,
                      bounce: 0.3,
                      duration: 1.2,
                    },
                  },
                },
              }}
              className="absolute inset-0 -z-20">
              <Image
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1920&auto=format&fit=crop"
                alt="Edifícios comerciais modernos"
                fill
                className="object-cover opacity-5"
                priority
              />
            </AnimatedGroup>
            
            <div className="container relative mx-auto max-w-7xl px-6 text-center">
              <AnimatedGroup
                preset="slide"
                className="mx-auto max-w-4xl space-y-6">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                  <Building2 className="h-4 w-4" />
                  Análise Inteligente de FIIs
                </div>

                {/* Título Principal */}
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                  <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                    Otimize seus
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary to-yellow-500 bg-clip-text text-transparent">
                    Fundos Imobiliários
                  </span>
                  <br />
                  <span className="text-foreground">
                    com Inteligência Artificial
                  </span>
                </h1>

                {/* Subtítulo */}
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                  Plataforma especializada com dois agentes de IA para análise de carteira e recomendações 
                  de aportes em fundos imobiliários brasileiros.
                </p>

                {/* CTAs */}
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 pt-4">
                  <Button size="lg" asChild className="group relative overflow-hidden">
                    <Link href="/dashboard">
                      <span className="relative z-10">Começar Análise</span>
                      <TrendingUp className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="lg" asChild className="group">
                    <Link href="#agentes">
                      Conhecer Agentes
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 gap-6 pt-12 sm:grid-cols-3 max-w-2xl mx-auto">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">FIIs Analisados</div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl font-bold text-primary">95%</div>
                    <div className="text-sm text-muted-foreground">Precisão nas Recomendações</div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl font-bold text-primary">10s</div>
                    <div className="text-sm text-muted-foreground">Análise Completa</div>
                  </div>
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}