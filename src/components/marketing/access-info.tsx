"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram, MessageCircle } from "lucide-react"

export function AccessInfo() {
  return (
    <section id="access" className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Acesso Exclusivo à Plataforma FiiAI
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Nossa plataforma opera com acesso controlado. Entre em contato conosco para solicitar acesso e começar a usar nossos agentes de análise de FIIs.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="border-border/40 bg-card/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Instagram className="h-6 w-6 text-pink-500" />
              Instagram
            </CardTitle>
            <CardDescription>
              Siga-nos e envie uma mensagem direta para solicitar acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              asChild 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <a 
                href="https://www.instagram.com/tiofiis/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <Instagram className="h-4 w-4" />
                Seguir no Instagram
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-green-500" />
              WhatsApp
            </CardTitle>
            <CardDescription>
              Entre em contato direto via WhatsApp para suporte e acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              asChild 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <a 
                href="https://wa.me/5571999921990" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Falar no WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Acesso controlado via convite • Análise profissional de FIIs
        </div>
      </div>
    </section>
  )
}