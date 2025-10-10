# Plan 003 - Direcionador de Aportes Inteligente com Regras Configuráveis

## 📋 Metadados do Plano

**Identificador:** plan-003-direcionador-aportes-inteligente
**Tipo:** Feature Enhancement + New Feature
**Agentes Responsáveis:** Product Agent + Backend Agent
**Prioridade:** P1 (High)
**Complexidade:** XL (8-10 sprints)
**Data de Criação:** 2025-10-08
**Status:** Planejamento

---

## 🎯 Objetivo

Refatorar o sistema de direcionamento de aportes para simplificar a interface do usuário (apenas valor do aporte) e implementar um algoritmo inteligente que prioriza fundos com base em **desbalanceamento + desconto**, com regras administrativas configuráveis.

---

## 🔍 Contexto e Problema

### **Situação Atual:**
- Formulário complexo com múltiplos campos: Tolerância ao Risco, Objetivo de Investimento, Preferências
- Lógica de recomendação genérica que não considera o balanceamento ideal da carteira
- Ausência de priorização baseada em preço teto vs. preço atual
- Regras de recomendação não configuráveis por admin

### **Problema:**
Investidores precisam decidir onde aportar novos recursos, mas:
1. **Complexidade:** Múltiplos campos dificultam o uso rápido
2. **Falta de Inteligência:** Sistema não avalia desbalanceamento + desconto simultaneamente
3. **Inflexibilidade:** Regras fixas que não podem ser ajustadas pelo admin

### **Impacto:**
- Baixa adoção da feature de direcionamento de aportes
- Recomendações subótimas que não consideram oportunidades de compra
- Dificuldade em adaptar lógica para diferentes perfis de investidores

---

## 🎯 Objetivos do Projeto

### **Objetivos Primários:**
1. **Simplificar UX:** Reduzir formulário para apenas "Valor do Aporte"
2. **Implementar Algoritmo Inteligente:** Priorizar fundos por desbalanceamento + desconto
3. **Adicionar Regras Configuráveis:** Painel admin para ajustar parâmetros do algoritmo

### **Objetivos Secundários:**
4. Melhorar visualização das recomendações (tabela priorizada)
5. Adicionar justificativas técnicas para cada recomendação
6. Implementar cálculo automático de número de cotas e valores

### **Métricas de Sucesso:**
- **Adoção:** Aumento de 50% no uso da feature
- **Satisfação:** NPS > 8 para direcionamento de aportes
- **Performance:** Análise completa em < 5 segundos
- **Precisão:** 90% dos usuários seguem recomendações

---

## 📊 Análise de Requisitos

### **User Stories:**

#### **US-001: Simplificação do Formulário**
```
Como investidor,
Quero informar apenas o valor que tenho disponível para aportar,
Para receber recomendações rápidas sem preencher múltiplos campos.

Critérios de Aceitação:
✅ Formulário exibe apenas campo "Valor do Aporte"
✅ Validação: valor mínimo R$ 50, máximo R$ 1.000.000
✅ Campos anteriores (risco, objetivo, preferências) removidos da UI
✅ Sistema infere perfil de risco da carteira atual do usuário
✅ Tempo de preenchimento < 10 segundos
```

#### **US-002: Algoritmo de Priorização Inteligente**
```
Como investidor,
Quero que o sistema priorize fundos que estão desbalanceados E com desconto,
Para maximizar oportunidades de compra e rebalancear minha carteira.

Critérios de Aceitação:
✅ Sistema calcula desbalanceamento (% atual vs. % ideal)
✅ Sistema calcula desconto (preço atual vs. preço teto)
✅ Priorização: maior desbalanceamento + maior desconto = prioridade 1
✅ Fundos sem desconto (preço > teto) são marcados como "Aguardar momento melhor"
✅ Fundos com desconto mínimo (> 0%) são elegíveis para investimento
✅ Sistema sugere alocação sequencial (preenche gap do mais prioritário primeiro)
```

#### **US-003: Alocação de Valor Inteligente**
```
Como investidor com R$ 10.000 disponíveis,
Quero que o sistema distribua este valor entre os fundos prioritários,
Para equilibrar minha carteira de forma otimizada.

Critérios de Aceitação:
✅ Se valor é insuficiente (ex: R$ 300), aloca no fundo prioritário até esgotar
✅ Se valor é suficiente (ex: R$ 10.000), distribui sequencialmente entre top prioritários
✅ Para cada fundo, calcula: número de cotas, valor investido, % pós-aporte
✅ Sistema para de alocar quando carteira está equilibrada
✅ Exibe resumo: "Investir R$ X em Y cotas de Z fundos"
```

#### **US-004: Recomendações com Justificativa**
```
Como investidor,
Quero entender POR QUE cada fundo foi recomendado,
Para tomar decisões informadas e confiar no sistema.

Critérios de Aceitação:
✅ Para cada recomendação, exibe:
   - Posição atual vs. posição ideal (ex: 5% → 10%)
   - % de desconto (ex: 10% abaixo do teto)
   - Prioridade numérica (1º, 2º, 3º)
   - Status: "Comprar agora" ou "Aguardar desconto"
✅ Recomendações ordenadas por prioridade decrescente
✅ Fundos "Aguardar" aparecem separados no final da lista
✅ Tooltip com explicação do cálculo de prioridade
```

#### **US-005: Painel Admin de Regras Configuráveis**
```
Como administrador,
Quero configurar as regras do algoritmo de direcionamento,
Para adaptar o sistema a diferentes perfis de investidores.

Critérios de Aceitação:
✅ Painel em /admin/regras-direcionamento-aportes
✅ Configurações disponíveis:
   - Desconto mínimo aceitável (ex: 0%, 2%, 5%)
   - Peso desbalanceamento vs. desconto (slider 0-100%)
   - Limite máximo de fundos na recomendação (ex: 5 fundos)
   - Permitir investir sem desconto? (toggle)
   - % de tolerância ao desbalanceamento (ex: ±2%)
✅ Preview do impacto das mudanças antes de salvar
✅ Histórico de alterações com timestamp e autor
✅ Possibilidade de criar "perfis" (conservador, moderado, agressivo)
```

---

## 🏗️ Arquitetura da Solução

### **Componentes Principais:**

```typescript
// Estrutura de Dados

interface AporteRequest {
  userId: string;
  valorDisponivel: number; // Valor que o usuário tem para investir
  portfolioId: string; // Carteira atual do usuário
}

interface FundoPrioritizado {
  fiiCode: string;
  fiiName: string;
  setor: string;

  // Situação atual
  percentualAtual: number;
  percentualIdeal: number;
  desbalanceamento: number; // Em pontos percentuais (ex: -5%)

  // Situação de preço
  precoAtual: number;
  precoTeto: number;
  percentualDesconto: number; // Positivo = desconto, Negativo = sem desconto

  // Priorização
  prioridade: number; // 1 = mais prioritário
  score: number; // Cálculo: (desbalanceamento * peso1) + (desconto * peso2)
  status: 'COMPRAR_AGORA' | 'AGUARDAR_DESCONTO' | 'NAO_INVESTIR';

  // Recomendação
  valorInvestir?: number;
  cotasComprar?: number;
  percentualPosAporte?: number;
  justificativa: string;
}

interface RecomendacaoAporte {
  fundosPrioritarios: FundoPrioritizado[];
  fundosAguardar: FundoPrioritizado[];
  resumo: {
    totalInvestido: number;
    fundosRecomendados: number;
    equilibrioAlcancado: boolean;
    sobraValor?: number;
  };
  metadata: {
    regrasAplicadas: RegrasConfiguraveis;
    timestamp: Date;
    versaoAlgoritmo: string;
  };
}

interface RegrasConfiguraveis {
  id: string;

  // Regras de desconto
  descontoMinimoAceitavel: number; // % (ex: 0 = qualquer desconto, 5 = mínimo 5%)
  permitirSemDesconto: boolean; // Se true, ignora desconto mínimo

  // Regras de balanceamento
  toleranciaDesbalanceamento: number; // % (ex: 2 = tolera até ±2% de diferença)
  pesosCalculo: {
    desbalanceamento: number; // 0-100
    desconto: number; // 0-100
  };

  // Regras de recomendação
  limiteMaximoFundos: number; // Máximo de fundos a recomendar (ex: 5)
  alocacaoSequencial: boolean; // Se true, aloca no #1 até equilibrar antes de ir para #2

  // Metadados
  nome: string; // Ex: "Perfil Conservador"
  descricao: string;
  ativo: boolean;
  criadoPor: string;
  atualizadoEm: Date;
}
```

---

## 🔧 Implementação Técnica

### **FASE 1: Backend - Algoritmo de Priorização (4 sprints)**

#### **1.1 Service: Análise de Desbalanceamento**
**Arquivo:** `src/services/aporte/desbalanceamento-service.ts`

```typescript
export class DesbalanceamentoService {
  /**
   * Calcula desbalanceamento de cada fundo na carteira
   * Desbalanceamento = % Ideal - % Atual (em pontos percentuais)
   * Ex: Ideal 10%, Atual 5% → Desbalanceamento = +5pp
   */
  async calcularDesbalanceamento(portfolioId: string): Promise<FundoDesbalanceamento[]> {
    const portfolio = await db.userPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: true,
        idealAllocation: true, // Alocação ideal definida pelo usuário
      },
    });

    const totalValue = portfolio.positions.reduce((sum, pos) => sum + pos.currentValue, 0);

    return portfolio.positions.map((position) => {
      const percentualAtual = (position.currentValue / totalValue) * 100;
      const idealTarget = portfolio.idealAllocation?.find(
        (ideal) => ideal.fiiCode === position.fiiCode
      );
      const percentualIdeal = idealTarget?.percentage || 0;
      const desbalanceamento = percentualIdeal - percentualAtual;

      return {
        fiiCode: position.fiiCode,
        fiiName: position.fiiName,
        setor: position.sector,
        percentualAtual,
        percentualIdeal,
        desbalanceamento, // Positivo = precisa aumentar, Negativo = precisa reduzir
        prioridadeDesbalanceamento: Math.abs(desbalanceamento), // Quanto maior, mais prioritário
      };
    });
  }

  /**
   * Identifica fundos ausentes na carteira mas presentes na alocação ideal
   */
  async identificarFundosAusentes(portfolioId: string): Promise<FundoDesbalanceamento[]> {
    const portfolio = await db.userPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: true,
        idealAllocation: true,
      },
    });

    const fundosNaCarteira = new Set(portfolio.positions.map((p) => p.fiiCode));

    return portfolio.idealAllocation
      .filter((ideal) => !fundosNaCarteira.has(ideal.fiiCode))
      .map((ideal) => ({
        fiiCode: ideal.fiiCode,
        fiiName: ideal.fiiName,
        setor: ideal.sector,
        percentualAtual: 0,
        percentualIdeal: ideal.percentage,
        desbalanceamento: ideal.percentage,
        prioridadeDesbalanceamento: ideal.percentage,
      }));
  }
}
```

#### **1.2 Service: Análise de Desconto**
**Arquivo:** `src/services/aporte/desconto-service.ts`

```typescript
export class DescontoService {
  /**
   * Calcula desconto de cada fundo com base em preço teto
   * Desconto % = ((Preço Teto - Preço Atual) / Preço Teto) * 100
   * Positivo = desconto, Negativo = acima do teto
   */
  async calcularDescontos(fundoCodes: string[]): Promise<FundoDesconto[]> {
    // Buscar preços atuais de API externa (ex: B3, Alpha Vantage)
    const precosAtuais = await this.buscarPrecosAtuais(fundoCodes);

    // Buscar preços teto do banco (configurado pelo usuário ou sistema)
    const precosTeto = await db.fiiPrecoTeto.findMany({
      where: {
        fiiCode: { in: fundoCodes },
      },
    });

    return fundoCodes.map((code) => {
      const precoAtual = precosAtuais.get(code) || 0;
      const precoTeto = precosTeto.find((p) => p.fiiCode === code)?.valorTeto || 0;

      if (precoTeto === 0) {
        return {
          fiiCode: code,
          precoAtual,
          precoTeto: null,
          percentualDesconto: null,
          status: 'SEM_PRECO_TETO',
        };
      }

      const percentualDesconto = ((precoTeto - precoAtual) / precoTeto) * 100;

      return {
        fiiCode: code,
        precoAtual,
        precoTeto,
        percentualDesconto,
        status: percentualDesconto > 0 ? 'COM_DESCONTO' : 'SEM_DESCONTO',
        prioridadeDesconto: Math.max(0, percentualDesconto), // Apenas descontos positivos
      };
    });
  }

  /**
   * Busca preços atuais de APIs externas com cache
   */
  private async buscarPrecosAtuais(fundoCodes: string[]): Promise<Map<string, number>> {
    const cacheKey = `precos_atuais_${fundoCodes.join('_')}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return new Map(JSON.parse(cached));
    }

    // Integração com API de cotações (ex: B3, Brapi, Status Invest)
    const precos = await this.fetchPrecosFromAPI(fundoCodes);

    // Cache por 15 minutos (dados em tempo real não necessários)
    await redis.setex(cacheKey, 900, JSON.stringify(Array.from(precos.entries())));

    return precos;
  }
}
```

#### **1.3 Service: Motor de Priorização**
**Arquivo:** `src/services/aporte/priorizacao-service.ts`

```typescript
export class PriorizacaoService {
  constructor(
    private desbalanceamentoService: DesbalanceamentoService,
    private descontoService: DescontoService
  ) {}

  /**
   * Algoritmo principal de priorização
   * Combina desbalanceamento + desconto com pesos configuráveis
   */
  async priorizarFundos(
    portfolioId: string,
    regras: RegrasConfiguraveis
  ): Promise<FundoPrioritizado[]> {
    // 1. Obter desbalanceamento
    const desbalanceamentos = await this.desbalanceamentoService.calcularDesbalanceamento(portfolioId);
    const fundosAusentes = await this.desbalanceamentoService.identificarFundosAusentes(portfolioId);
    const todosFundos = [...desbalanceamentos, ...fundosAusentes];

    // 2. Obter descontos
    const fundoCodes = todosFundos.map((f) => f.fiiCode);
    const descontos = await this.descontoService.calcularDescontos(fundoCodes);

    // 3. Combinar dados
    const fundosCombinados = todosFundos.map((fundo) => {
      const desconto = descontos.find((d) => d.fiiCode === fundo.fiiCode);

      // Cálculo do score de prioridade
      const scoreDesbalanceamento = fundo.prioridadeDesbalanceamento;
      const scoreDesconto = desconto?.prioridadeDesconto || 0;

      const pesoDesbalanceamento = regras.pesosCalculo.desbalanceamento / 100;
      const pesoDesconto = regras.pesosCalculo.desconto / 100;

      const score = (scoreDesbalanceamento * pesoDesbalanceamento) + (scoreDesconto * pesoDesconto);

      // Determinar status
      let status: FundoPrioritizado['status'] = 'NAO_INVESTIR';

      if (desconto?.percentualDesconto === null) {
        status = 'NAO_INVESTIR'; // Sem preço teto configurado
      } else if (desconto.percentualDesconto >= regras.descontoMinimoAceitavel) {
        status = 'COMPRAR_AGORA';
      } else if (regras.permitirSemDesconto && desconto.percentualDesconto > 0) {
        status = 'COMPRAR_AGORA'; // Permite mesmo com desconto mínimo
      } else {
        status = 'AGUARDAR_DESCONTO';
      }

      // Justificativa
      const justificativa = this.gerarJustificativa(fundo, desconto, status);

      return {
        ...fundo,
        precoAtual: desconto?.precoAtual || 0,
        precoTeto: desconto?.precoTeto || 0,
        percentualDesconto: desconto?.percentualDesconto || 0,
        score,
        status,
        justificativa,
      };
    });

    // 4. Ordenar por score (maior score = maior prioridade)
    const fundosOrdenados = fundosCombinados.sort((a, b) => b.score - a.score);

    // 5. Atribuir prioridade numérica apenas para fundos "COMPRAR_AGORA"
    let prioridadeAtual = 1;
    fundosOrdenados.forEach((fundo) => {
      if (fundo.status === 'COMPRAR_AGORA') {
        fundo.prioridade = prioridadeAtual++;
      } else {
        fundo.prioridade = 999; // Fundos "aguardar" não têm prioridade
      }
    });

    // 6. Limitar ao máximo configurado
    return fundosOrdenados.slice(0, regras.limiteMaximoFundos);
  }

  private gerarJustificativa(
    fundo: FundoDesbalanceamento,
    desconto: FundoDesconto | undefined,
    status: string
  ): string {
    const desbalanceamentoTexto = fundo.desbalanceamento > 0
      ? `abaixo do ideal (${fundo.percentualAtual.toFixed(1)}% vs. ${fundo.percentualIdeal.toFixed(1)}%)`
      : `acima do ideal`;

    const descontoTexto = desconto?.percentualDesconto
      ? `com ${desconto.percentualDesconto.toFixed(2)}% de desconto`
      : `sem desconto disponível`;

    if (status === 'COMPRAR_AGORA') {
      return `${fundo.fiiName} está ${desbalanceamentoTexto} e ${descontoTexto}. Prioridade para rebalanceamento.`;
    } else if (status === 'AGUARDAR_DESCONTO') {
      return `${fundo.fiiName} está ${desbalanceamentoTexto}, mas o preço atual está acima do teto. Aguarde desconto.`;
    } else {
      return `${fundo.fiiName} não possui preço teto configurado. Configure para receber recomendações.`;
    }
  }
}
```

#### **1.4 Service: Alocação de Valor**
**Arquivo:** `src/services/aporte/alocacao-service.ts`

```typescript
export class AlocacaoService {
  /**
   * Distribui valor disponível entre fundos prioritários
   * Estratégia: Preencher gap do fundo mais prioritário antes de ir para próximo
   */
  async calcularAlocacao(
    fundosPrioritarios: FundoPrioritizado[],
    valorDisponivel: number,
    portfolioAtual: UserPortfolio,
    regras: RegrasConfiguraveis
  ): Promise<RecomendacaoAporte> {
    const fundosComprar = fundosPrioritarios.filter((f) => f.status === 'COMPRAR_AGORA');
    const fundosAguardar = fundosPrioritarios.filter((f) => f.status !== 'COMPRAR_AGORA');

    let valorRestante = valorDisponivel;
    const alocacoes: FundoPrioritizado[] = [];

    // Valor total atual da carteira
    const totalCarteira = portfolioAtual.positions.reduce((sum, pos) => sum + pos.currentValue, 0);

    for (const fundo of fundosComprar) {
      if (valorRestante <= 0) break;

      // Calcular quanto precisa para equilibrar este fundo
      const valorAtual = portfolioAtual.positions.find((p) => p.fiiCode === fundo.fiiCode)?.currentValue || 0;
      const percentualAtual = (valorAtual / totalCarteira) * 100;
      const percentualIdeal = fundo.percentualIdeal;

      // Quanto precisa para chegar no ideal (em reais)
      const valorIdeal = (percentualIdeal / 100) * totalCarteira;
      const gapValor = Math.max(0, valorIdeal - valorAtual);

      // Se alocação sequencial, preenche gap completo antes de ir para próximo
      let valorAlocar = regras.alocacaoSequencial
        ? Math.min(gapValor, valorRestante)
        : Math.min(gapValor / fundosComprar.length, valorRestante); // Distribui proporcionalmente

      // Calcular cotas
      const cotasComprar = Math.floor(valorAlocar / fundo.precoAtual);
      valorAlocar = cotasComprar * fundo.precoAtual; // Valor exato das cotas

      if (cotasComprar === 0) continue; // Não dá nem para 1 cota

      // Calcular percentual pós-aporte
      const novoValor = valorAtual + valorAlocar;
      const percentualPosAporte = (novoValor / (totalCarteira + valorAlocar)) * 100;

      alocacoes.push({
        ...fundo,
        valorInvestir: valorAlocar,
        cotasComprar,
        percentualPosAporte,
      });

      valorRestante -= valorAlocar;
    }

    // Verificar se carteira está equilibrada
    const equilibrioAlcancado = alocacoes.every((aloc) => {
      const diferencaIdeal = Math.abs((aloc.percentualPosAporte || 0) - aloc.percentualIdeal);
      return diferencaIdeal <= regras.toleranciaDesbalanceamento;
    });

    return {
      fundosPrioritarios: alocacoes,
      fundosAguardar,
      resumo: {
        totalInvestido: valorDisponivel - valorRestante,
        fundosRecomendados: alocacoes.length,
        equilibrioAlcancado,
        sobraValor: valorRestante > 0 ? valorRestante : undefined,
      },
      metadata: {
        regrasAplicadas: regras,
        timestamp: new Date(),
        versaoAlgoritmo: '1.0.0',
      },
    };
  }
}
```

#### **1.5 API Route Principal**
**Arquivo:** `src/app/api/aporte/recomendacao/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const AporteRequestSchema = z.object({
  valorDisponivel: z.number().min(50).max(1_000_000),
  portfolioId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    // 1. Autenticação
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);

    // 2. Validação
    const body = await request.json();
    const { valorDisponivel, portfolioId } = AporteRequestSchema.parse(body);

    // 3. Verificar ownership do portfólio
    const portfolio = await db.userPortfolio.findFirst({
      where: { id: portfolioId, userId: user.id },
      include: { positions: true, idealAllocation: true },
    });

    if (!portfolio) {
      return Response.json({ error: 'Portfólio não encontrado' }, { status: 404 });
    }

    // 4. Consumir créditos
    const creditService = new CreditService();
    await creditService.consumeCredits(user.id, 'APORTE_RECOMENDACAO', 5); // 5 créditos

    // 5. Obter regras ativas
    const regras = await db.regrasAporte.findFirst({
      where: { ativo: true },
      orderBy: { atualizadoEm: 'desc' },
    });

    if (!regras) {
      return Response.json({ error: 'Regras não configuradas' }, { status: 500 });
    }

    // 6. Executar análise
    const priorizacaoService = new PriorizacaoService(
      new DesbalanceamentoService(),
      new DescontoService()
    );

    const fundosPrioritarios = await priorizacaoService.priorizarFundos(portfolioId, regras);

    const alocacaoService = new AlocacaoService();
    const recomendacao = await alocacaoService.calcularAlocacao(
      fundosPrioritarios,
      valorDisponivel,
      portfolio,
      regras
    );

    // 7. Salvar histórico
    await db.aporteRecomendacao.create({
      data: {
        userId: user.id,
        userPortfolioId: portfolioId,
        valorDisponivel,
        recomendacao: recomendacao as any,
        regrasUtilizadas: regras as any,
      },
    });

    // 8. Retornar recomendação
    return Response.json(recomendacao, { status: 200 });

  } catch (error) {
    return handleAPIError(error);
  }
}
```

---

### **FASE 2: Painel Admin - Regras Configuráveis (3 sprints)**

#### **2.1 Schema do Banco de Dados**
**Arquivo:** `prisma/schema.prisma`

```prisma
model RegrasAporte {
  id                          String   @id @default(cuid())

  // Identificação
  nome                        String   @db.VarChar(255)
  descricao                   String?  @db.Text
  ativo                       Boolean  @default(true)

  // Regras de desconto
  descontoMinimoAceitavel     Float    @default(0.0)  // % (ex: 0 = qualquer desconto)
  permitirSemDesconto         Boolean  @default(true)

  // Regras de balanceamento
  toleranciaDesbalanceamento  Float    @default(2.0)  // % (ex: 2 = tolera ±2%)
  pesoDesbalanceamento        Int      @default(60)   // 0-100
  pesoDesconto                Int      @default(40)   // 0-100

  // Regras de recomendação
  limiteMaximoFundos          Int      @default(5)
  alocacaoSequencial          Boolean  @default(true)

  // Metadados
  criadoPor                   String
  criadoEm                    DateTime @default(now())
  atualizadoEm                DateTime @updatedAt

  @@map("regras_aporte")
}

model AporteRecomendacao {
  id                String      @id @default(cuid())
  userId            String
  userPortfolioId   String
  valorDisponivel   Float
  recomendacao      Json        // Estrutura completa de RecomendacaoAporte
  regrasUtilizadas  Json        // Snapshot das regras no momento da análise
  criadoEm          DateTime    @default(now())

  user              User        @relation(fields: [userId], references: [id])
  portfolio         UserPortfolio @relation(fields: [userPortfolioId], references: [id])

  @@index([userId, criadoEm])
  @@map("aporte_recomendacoes")
}

model FiiPrecoTeto {
  id         String   @id @default(cuid())
  fiiCode    String   @unique @db.VarChar(10)
  valorTeto  Float    // Preço teto configurado
  fonte      String?  // "usuario" | "sistema" | "api"

  // Metadados
  atualizadoEm DateTime @updatedAt

  @@map("fii_preco_teto")
}
```

#### **2.2 Componente Admin - Configuração de Regras**
**Arquivo:** `src/app/admin/regras-direcionamento-aportes/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useAdminRegrasAporte } from "@/hooks/admin/use-admin-regras-aporte";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function RegrasAporteAdmin() {
  const { regras, isLoading, updateRegras } = useAdminRegrasAporte();
  const [localRegras, setLocalRegras] = useState(regras);

  const handleSave = async () => {
    await updateRegras.mutateAsync(localRegras);
  };

  const handleReset = () => {
    setLocalRegras(regras);
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Regras de Direcionamento de Aportes</h1>
        <p className="text-muted-foreground mt-2">
          Configure como o algoritmo prioriza fundos para recomendações de investimento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEÇÃO 1: REGRAS DE DESCONTO */}
        <Card>
          <CardHeader>
            <CardTitle>Regras de Desconto</CardTitle>
            <CardDescription>
              Define como o sistema avalia oportunidades de preço
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="desconto-minimo">Desconto Mínimo Aceitável</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Apenas fundos com desconto maior ou igual a este valor serão recomendados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="desconto-minimo"
                  min={0}
                  max={20}
                  step={0.5}
                  value={[localRegras.descontoMinimoAceitavel]}
                  onValueChange={(val) =>
                    setLocalRegras({ ...localRegras, descontoMinimoAceitavel: val[0] })
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">
                  {localRegras.descontoMinimoAceitavel.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="permitir-sem-desconto">Permitir Investir Sem Desconto</Label>
                <p className="text-sm text-muted-foreground">
                  Se ativado, recomenda fundos mesmo com desconto mínimo
                </p>
              </div>
              <Switch
                id="permitir-sem-desconto"
                checked={localRegras.permitirSemDesconto}
                onCheckedChange={(checked) =>
                  setLocalRegras({ ...localRegras, permitirSemDesconto: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 2: REGRAS DE BALANCEAMENTO */}
        <Card>
          <CardHeader>
            <CardTitle>Regras de Balanceamento</CardTitle>
            <CardDescription>
              Controla priorização entre desbalanceamento e desconto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Pesos do Cálculo de Prioridade</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Define a importância relativa de cada fator
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Peso Desbalanceamento</span>
                    <span className="text-sm font-medium">{localRegras.pesoDesbalanceamento}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[localRegras.pesoDesbalanceamento]}
                    onValueChange={(val) => {
                      setLocalRegras({
                        ...localRegras,
                        pesoDesbalanceamento: val[0],
                        pesoDesconto: 100 - val[0],
                      });
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Peso Desconto</span>
                    <span className="text-sm font-medium">{localRegras.pesoDesconto}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[localRegras.pesoDesconto]}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajustado automaticamente (soma = 100%)
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="tolerancia">Tolerância ao Desbalanceamento</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Aceita diferença de até ±X% entre atual e ideal
              </p>
              <div className="flex items-center gap-4">
                <Slider
                  id="tolerancia"
                  min={0}
                  max={10}
                  step={0.5}
                  value={[localRegras.toleranciaDesbalanceamento]}
                  onValueChange={(val) =>
                    setLocalRegras({ ...localRegras, toleranciaDesbalanceamento: val[0] })
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">
                  ±{localRegras.toleranciaDesbalanceamento.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3: REGRAS DE RECOMENDAÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle>Regras de Recomendação</CardTitle>
            <CardDescription>
              Controla como as recomendações são apresentadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="limite-fundos">Limite Máximo de Fundos</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Número máximo de fundos na lista de recomendações
              </p>
              <Input
                id="limite-fundos"
                type="number"
                min={1}
                max={20}
                value={localRegras.limiteMaximoFundos}
                onChange={(e) =>
                  setLocalRegras({ ...localRegras, limiteMaximoFundos: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="alocacao-sequencial">Alocação Sequencial</Label>
                <p className="text-sm text-muted-foreground">
                  Se ativado, preenche gap do #1 antes de ir para #2
                </p>
              </div>
              <Switch
                id="alocacao-sequencial"
                checked={localRegras.alocacaoSequencial}
                onCheckedChange={(checked) =>
                  setLocalRegras({ ...localRegras, alocacaoSequencial: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 4: PREVIEW DO IMPACTO */}
        <Card>
          <CardHeader>
            <CardTitle>Preview do Impacto</CardTitle>
            <CardDescription>
              Visualize como as mudanças afetam as recomendações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Exemplo de Priorização</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fundo A: 8% desbal. + 10% desconto</span>
                    <span className="font-medium">Score: {(8 * localRegras.pesoDesbalanceamento / 100 + 10 * localRegras.pesoDesconto / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fundo B: 5% desbal. + 15% desconto</span>
                    <span className="font-medium">Score: {(5 * localRegras.pesoDesbalanceamento / 100 + 15 * localRegras.pesoDesconto / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fundo C: 10% desbal. + 2% desconto</span>
                    <span className="font-medium">Score: {(10 * localRegras.pesoDesbalanceamento / 100 + 2 * localRegras.pesoDesconto / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-primary/5">
                <h4 className="font-medium mb-2 text-primary">Recomendações com Base Atual</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>
                    {localRegras.permitirSemDesconto
                      ? "Fundos com qualquer desconto serão recomendados"
                      : `Apenas fundos com desconto ≥ ${localRegras.descontoMinimoAceitavel}%`}
                  </li>
                  <li>
                    Priorização: {localRegras.pesoDesbalanceamento > localRegras.pesoDesconto
                      ? "Desbalanceamento mais importante"
                      : "Desconto mais importante"}
                  </li>
                  <li>Máximo de {localRegras.limiteMaximoFundos} fundos recomendados</li>
                  <li>
                    Alocação: {localRegras.alocacaoSequencial ? "Sequencial (preenche #1 primeiro)" : "Distribuída"}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AÇÕES */}
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline" onClick={handleReset} disabled={updateRegras.isPending}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar Mudanças
        </Button>
        <Button onClick={handleSave} disabled={updateRegras.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateRegras.isPending ? "Salvando..." : "Salvar Regras"}
        </Button>
      </div>
    </div>
  );
}
```

---

### **FASE 3: Frontend - Interface Simplificada (3 sprints)**

#### **3.1 Página de Direcionamento de Aportes**
**Arquivo:** `src/app/(protected)/dashboard/direcionar-aportes/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useUserPortfolios } from "@/hooks/use-portfolios";
import { useRecomendacaoAporte } from "@/hooks/use-aporte";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { RecomendacaoTable } from "@/components/aporte/recomendacao-table";
import { ResumoAlocacao } from "@/components/aporte/resumo-alocacao";

export default function DirecionarAportesPage() {
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [valorDisponivel, setValorDisponivel] = useState<string>("");

  const { portfolios } = useUserPortfolios();
  const recomendacao = useRecomendacaoAporte();

  const handleAnalyze = () => {
    if (!portfolioId || !valorDisponivel) return;

    recomendacao.mutate({
      portfolioId,
      valorDisponivel: parseFloat(valorDisponivel),
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          Direcionador de Aportes Inteligente
        </h1>
        <p className="text-muted-foreground mt-2">
          Descubra onde investir com base em desbalanceamento e oportunidades de desconto
        </p>
      </div>

      {/* FORMULÁRIO SIMPLIFICADO */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Informações do Aporte</CardTitle>
          <CardDescription>
            Informe o valor disponível e receba recomendações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="portfolio">Carteira</Label>
              <Select value={portfolioId} onValueChange={setPortfolioId}>
                <SelectTrigger id="portfolio">
                  <SelectValue placeholder="Selecione uma carteira" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.originalFileName || `Carteira ${p.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="valor">Valor Disponível para Investir</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor"
                  type="number"
                  min={50}
                  max={1000000}
                  step={100}
                  value={valorDisponivel}
                  onChange={(e) => setValorDisponivel(e.target.value)}
                  className="pl-10"
                  placeholder="10.000,00"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Valor mínimo: R$ 50,00
              </p>
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!portfolioId || !valorDisponivel || recomendacao.isPending}
            className="mt-6 w-full md:w-auto"
          >
            {recomendacao.isPending ? "Analisando..." : "Gerar Recomendações"}
          </Button>
        </CardContent>
      </Card>

      {/* RESULTADOS */}
      {recomendacao.isSuccess && recomendacao.data && (
        <>
          {/* RESUMO DA ALOCAÇÃO */}
          <ResumoAlocacao resumo={recomendacao.data.resumo} />

          {/* FUNDOS PRIORITÁRIOS */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success-500" />
                Fundos Recomendados para Compra
              </CardTitle>
              <CardDescription>
                Fundos com melhor oportunidade de compra e rebalanceamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecomendacaoTable fundos={recomendacao.data.fundosPrioritarios} />
            </CardContent>
          </Card>

          {/* FUNDOS PARA AGUARDAR */}
          {recomendacao.data.fundosAguardar.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning-500" />
                  Fundos para Aguardar Melhor Momento
                </CardTitle>
                <CardDescription>
                  Fundos desbalanceados mas sem desconto no momento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecomendacaoTable fundos={recomendacao.data.fundosAguardar} aguardar />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
```

#### **3.2 Componente - Tabela de Recomendações**
**Arquivo:** `src/components/aporte/recomendacao-table.tsx`

```typescript
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { FundoPrioritizado } from "@/types/aporte";

interface RecomendacaoTableProps {
  fundos: FundoPrioritizado[];
  aguardar?: boolean;
}

export function RecomendacaoTable({ fundos, aguardar = false }: RecomendacaoTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {!aguardar && <TableHead className="w-[60px]">Prioridade</TableHead>}
            <TableHead>Fundo</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead className="text-right">Atual</TableHead>
            <TableHead className="text-right">Ideal</TableHead>
            <TableHead className="text-right">Desbalanceamento</TableHead>
            <TableHead className="text-right">Desconto</TableHead>
            {!aguardar && (
              <>
                <TableHead className="text-right">Investir</TableHead>
                <TableHead className="text-right">Cotas</TableHead>
                <TableHead className="text-right">Pós-Aporte</TableHead>
              </>
            )}
            <TableHead>Justificativa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fundos.map((fundo) => (
            <TableRow key={fundo.fiiCode}>
              {!aguardar && (
                <TableCell className="font-bold text-center">
                  <Badge variant={fundo.prioridade === 1 ? "default" : "secondary"}>
                    #{fundo.prioridade}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="font-medium">
                <div>
                  <div className="font-bold">{fundo.fiiCode}</div>
                  <div className="text-sm text-muted-foreground">{fundo.fiiName}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{fundo.setor}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatPercentage(fundo.percentualAtual)}</TableCell>
              <TableCell className="text-right">{formatPercentage(fundo.percentualIdeal)}</TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    fundo.desbalanceamento > 0
                      ? "text-warning-500 font-medium"
                      : "text-success-500"
                  }
                >
                  {fundo.desbalanceamento > 0 ? "+" : ""}
                  {formatPercentage(fundo.desbalanceamento)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    fundo.percentualDesconto > 0
                      ? "text-success-500 font-medium"
                      : "text-error-500"
                  }
                >
                  {formatPercentage(fundo.percentualDesconto)}
                </span>
              </TableCell>
              {!aguardar && (
                <>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(fundo.valorInvestir || 0)}
                  </TableCell>
                  <TableCell className="text-right">{fundo.cotasComprar || 0}</TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(fundo.percentualPosAporte || 0)}
                  </TableCell>
                </>
              )}
              <TableCell className="max-w-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate">{fundo.justificativa}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>{fundo.justificativa}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 📝 Cronograma de Implementação

### **Sprint 1-2: Fundação Backend**
- [ ] Schema do banco (RegrasAporte, AporteRecomendacao, FiiPrecoTeto)
- [ ] Service: DesbalanceamentoService
- [ ] Service: DescontoService (com integração API externa)
- [ ] Testes unitários dos services

### **Sprint 3-4: Algoritmo de Priorização**
- [ ] Service: PriorizacaoService (lógica principal)
- [ ] Service: AlocacaoService (distribuição de valor)
- [ ] API Route: POST /api/aporte/recomendacao
- [ ] Testes de integração do algoritmo

### **Sprint 5-6: Painel Admin**
- [ ] Página: /admin/regras-direcionamento-aportes
- [ ] Componentes: Sliders, Switches, Preview
- [ ] API Routes: GET/PUT /api/admin/regras-aporte
- [ ] Sistema de versionamento de regras

### **Sprint 7-8: Frontend Usuário**
- [ ] Refatorar página /dashboard/direcionar-aportes
- [ ] Remover campos antigos (risco, objetivo, preferências)
- [ ] Componente: RecomendacaoTable
- [ ] Componente: ResumoAlocacao
- [ ] Hooks: useRecomendacaoAporte

### **Sprint 9-10: Refinamento e QA**
- [ ] Testes E2E (Playwright)
- [ ] Otimização de performance
- [ ] Documentação de API
- [ ] Ajustes de UX com base em feedback

---

## 🧪 Estratégia de Testes

### **Testes Unitários:**
```typescript
// Exemplo: desbalanceamento-service.test.ts
describe('DesbalanceamentoService', () => {
  it('deve calcular desbalanceamento corretamente', async () => {
    const portfolio = mockPortfolio({
      positions: [
        { fiiCode: 'HGRE11', currentValue: 2000, totalValue: 10000 }, // 20%
      ],
      idealAllocation: [
        { fiiCode: 'HGRE11', percentage: 30 }, // Ideal 30%
      ],
    });

    const result = await service.calcularDesbalanceamento(portfolio.id);

    expect(result[0].desbalanceamento).toBe(10); // 30% - 20% = +10pp
  });
});
```

### **Testes de Integração:**
```typescript
// Exemplo: aporte-recomendacao.test.ts
describe('POST /api/aporte/recomendacao', () => {
  it('deve retornar recomendações priorizadas', async () => {
    const response = await request(app)
      .post('/api/aporte/recomendacao')
      .set('Authorization', `Bearer ${token}`)
      .send({
        portfolioId: 'portfolio-123',
        valorDisponivel: 10000,
      });

    expect(response.status).toBe(200);
    expect(response.body.fundosPrioritarios).toHaveLength(5);
    expect(response.body.fundosPrioritarios[0].prioridade).toBe(1);
  });
});
```

---

## 📊 Métricas de Sucesso

### **KPIs de Produto:**
- **Adoção:** 50% dos usuários ativos usam direcionador de aportes mensalmente
- **Satisfação:** NPS > 8 para esta feature
- **Conversão:** 70% dos usuários seguem pelo menos 1 recomendação
- **Performance:** Análise completa em < 5 segundos

### **KPIs Técnicos:**
- **Disponibilidade:** 99.9% uptime da API
- **Latência:** P95 < 3 segundos
- **Taxa de erro:** < 0.5%
- **Cobertura de testes:** > 80%

---

## 🚨 Riscos e Mitigações

### **Risco 1: Qualidade das Recomendações**
- **Descrição:** Algoritmo pode gerar recomendações subótimas
- **Impacto:** Alto - Perda de confiança dos usuários
- **Mitigação:**
  - Validar com investidores reais (beta testers)
  - Implementar feedback loop (usuários avaliam recomendações)
  - Monitorar métricas de conversão (% que seguem recomendações)

### **Risco 2: Integração com APIs de Preços**
- **Descrição:** APIs externas podem ter instabilidade ou custo elevado
- **Impacto:** Médio - Feature pode ficar indisponível
- **Mitigação:**
  - Cache agressivo (15 minutos)
  - Fallback para preços históricos
  - Múltiplas fontes de dados (B3, Brapi, Status Invest)

### **Risco 3: Complexidade do Admin**
- **Descrição:** Admins podem configurar regras inconsistentes
- **Impacto:** Médio - Recomendações podem ficar ruins
- **Mitigação:**
  - Validações no backend (soma de pesos = 100%)
  - Preview antes de salvar
  - Possibilidade de reverter para versão anterior

---

## 📚 Documentação Adicional

### **Documentos a Criar:**
1. **API Documentation** - Swagger/OpenAPI para endpoints
2. **User Guide** - Como usar o direcionador de aportes
3. **Admin Guide** - Como configurar regras
4. **Algorithm Whitepaper** - Explicação detalhada do algoritmo

### **Referências Técnicas:**
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TanStack Query](https://tanstack.com/query/latest)

---

## ✅ Checklist de Conclusão

- [ ] Todos os testes passando (unit + integration + E2E)
- [ ] Cobertura de testes > 80%
- [ ] Performance: P95 < 3s
- [ ] Documentação técnica completa
- [ ] User guide publicado
- [ ] Deploy em staging aprovado
- [ ] Beta test com 10 usuários reais
- [ ] Métricas instrumentadas no Vercel Analytics
- [ ] Alertas configurados (Sentry/Vercel)
- [ ] Code review aprovado por 2+ desenvolvedores

---

**Status:** 🟡 Aguardando Aprovação
**Próximo Passo:** Revisão com Product Manager e início da Sprint 1
