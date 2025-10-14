# Plan-006: Otimização de Performance - Database e Backend Essencial

## 📋 Metadados do Plano

- **ID:** PLAN-006
- **Título:** Otimização Essencial de Performance (Database Focus)
- **Agente Responsável:** Database Agent
- **Prioridade:** Alta
- **Complexidade:** Média
- **Estimativa:** 2-3 dias
- **Data de Criação:** 2025-10-10

## 🎯 Objetivo

Implementar otimizações essenciais e práticas no banco de dados para melhorar significativamente a performance da aplicação FiiAI, sem adicionar complexidade desnecessária ou dependências externas como Redis.

## 📊 Análise Atual do Sistema

### **Pontos Críticos Identificados:**

1. **Banco de Dados:**
   - ❌ Faltam índices compostos para queries complexas
   - ❌ Sem índices parciais para dados filtrados
   - ❌ JSON fields sem otimização de acesso
   - ❌ Queries N+1 em relações aninhadas
   - ❌ Connection pooling não configurado

2. **Backend (APIs):**
   - ❌ Chamadas sequenciais que poderiam ser paralelas
   - ❌ Sem memoização de dados estáticos
   - ❌ Queries redundantes

3. **Frontend:**
   - ❌ TanStack Query sem configuração ideal
   - ❌ Re-renders desnecessários em componentes

## 🏗️ Arquitetura da Solução (Simplificada)

```
┌─────────────────────────────────────┐
│        OTIMIZAÇÕES APLICADAS        │
├─────────────────────────────────────┤
│  1. Índices Compostos (Database)    │
│  2. Índices Parciais (Database)     │
│  3. Queries Paralelas (Backend)     │
│  4. Memoização In-Memory (Backend)  │
│  5. TanStack Query Config (Frontend)│
└─────────────────────────────────────┘
```

## 📝 FASE 1: Otimização do Banco de Dados

### **1.1 Análise de Queries Lentas**

**Objetivo:** Identificar queries problemáticas

**Arquivo:** `scripts/analyze-slow-queries.ts` (novo)

```typescript
import { prisma } from '@/lib/db';

/**
 * Script para analisar queries lentas
 * Execução: npx tsx scripts/analyze-slow-queries.ts
 */
async function analyzeSlowQueries() {
  console.log('🔍 Analisando queries lentas...\n');

  try {
    // Verificar se pg_stat_statements está habilitado
    const extension = await prisma.$queryRaw<Array<{extname: string}>>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_stat_statements';
    `;

    if (extension.length === 0) {
      console.warn('⚠️  pg_stat_statements não está habilitado.');
      console.log('Execute no banco: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\n');
      return;
    }

    // Queries mais lentas (média > 100ms)
    const slowQueries = await prisma.$queryRaw<Array<{
      query: string;
      calls: number;
      total_time: number;
      mean_time: number;
      max_time: number;
    }>>`
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        max_time
      FROM pg_stat_statements
      WHERE mean_time > 100
        AND query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC
      LIMIT 10;
    `;

    console.log('📊 Top 10 Queries Mais Lentas:\n');
    slowQueries.forEach((q, i) => {
      console.log(`${i + 1}. Query: ${q.query.substring(0, 80)}...`);
      console.log(`   Calls: ${q.calls}, Avg: ${Math.round(q.mean_time)}ms, Max: ${Math.round(q.max_time)}ms\n`);
    });

    // Queries mais chamadas
    const mostCalled = await prisma.$queryRaw<Array<{
      query: string;
      calls: number;
      mean_time: number;
    }>>`
      SELECT
        query,
        calls,
        mean_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY calls DESC
      LIMIT 10;
    `;

    console.log('🔥 Top 10 Queries Mais Chamadas:\n');
    mostCalled.forEach((q, i) => {
      console.log(`${i + 1}. Calls: ${q.calls}, Avg: ${Math.round(q.mean_time)}ms`);
      console.log(`   Query: ${q.query.substring(0, 80)}...\n`);
    });

  } catch (error) {
    console.error('❌ Erro ao analisar queries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSlowQueries();
```

**Como usar:**
```bash
# Instalar tsx se necessário
npm install -D tsx

# Executar análise
npx tsx scripts/analyze-slow-queries.ts
```

### **1.2 Índices Compostos Críticos**

**Objetivo:** Adicionar índices para queries mais frequentes

**Arquivo:** `prisma/schema.prisma` (atualização)

```prisma
// ===================================
// ÍNDICES OTIMIZADOS - PLAN-006
// ===================================

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String?  @unique
  name      String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // ... relações existentes

  // ÍNDICES EXISTENTES
  @@index([email])
  @@index([name])
  @@index([createdAt])
  @@index([isActive])

  // NOVOS ÍNDICES COMPOSTOS
  @@index([isActive, createdAt(sort: Desc)])  // Usuários ativos recentes
  @@index([email, isActive])                   // Login rápido
}

model UsageHistory {
  id              String   @id @default(cuid())
  userId          String
  creditBalanceId String
  operationType   OperationType
  creditsUsed     Int
  details         Json?
  timestamp       DateTime @default(now())

  // ... relações existentes

  // ÍNDICES EXISTENTES
  @@index([userId])
  @@index([creditBalanceId])
  @@index([timestamp])
  @@index([operationType])
  @@index([userId, timestamp])
  @@index([operationType, timestamp])

  // NOVOS ÍNDICES COMPOSTOS
  @@index([userId, operationType, timestamp(sort: Desc)])  // Histórico por tipo
  @@index([timestamp(sort: Desc)])                         // Ordenação otimizada
}

model UserPortfolio {
  id               String     @id @default(cuid())
  userId           String
  originalFileName String
  uploadedAt       DateTime   @default(now())
  positions        Json
  totalValue       Float
  lastAnalyzedAt   DateTime?

  // ... relações existentes

  // ÍNDICES EXISTENTES
  @@index([userId])
  @@index([uploadedAt])
  @@index([totalValue])

  // NOVOS ÍNDICES COMPOSTOS
  @@index([userId, uploadedAt(sort: Desc)])          // Últimos portfolios
  @@index([userId, lastAnalyzedAt])                  // Análises pendentes
}

model AnalysisReport {
  id                String     @id @default(cuid())
  userId            String
  userPortfolioId   String?
  analysisType      AnalysisType
  aiAgentVersion    String     @default("v1.0")
  summary           String     @db.Text
  currentAllocation Json
  riskAssessment    Json
  performanceMetrics Json
  recommendations   Json
  processingTime    Int?
  creditsUsed       Int        @default(10)
  generatedAt       DateTime   @default(now())
  ruleSetId         String?
  ruleSetVersion    Int?

  // ... relações existentes

  // ÍNDICES EXISTENTES
  @@index([userId])
  @@index([analysisType])
  @@index([generatedAt])
  @@index([userPortfolioId])
  @@index([ruleSetId])

  // NOVOS ÍNDICES COMPOSTOS
  @@index([userId, generatedAt(sort: Desc)])              // Dashboard do usuário
  @@index([userId, analysisType, generatedAt(sort: Desc)]) // Filtro por tipo
  @@index([userPortfolioId, generatedAt(sort: Desc)])     // Histórico por portfolio
}

model InvestmentRecommendation {
  id              String             @id @default(cuid())
  analysisReportId String
  fiiCode         String
  fiiName         String
  recommendation  RecommendationType
  targetPercentage Float?
  investmentAmount Float?
  reasoning       String    @db.Text
  confidence      Float
  priority        Int       @default(1)

  // ... relações existentes

  // ÍNDICES EXISTENTES
  @@index([analysisReportId])
  @@index([fiiCode])
  @@index([recommendation])
  @@index([priority])

  // NOVOS ÍNDICES COMPOSTOS
  @@index([fiiCode, recommendation])                  // Busca por FII
  @@index([recommendation, confidence(sort: Desc)])   // Melhores recomendações
  @@index([analysisReportId, priority(sort: Asc)])   // Priorização
}

model CreditBalance {
  id                String   @id @default(cuid())
  userId            String   @unique
  clerkUserId       String   @unique
  creditsRemaining  Int      @default(100)
  lastSyncedAt      DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // ... relações existentes

  // ÍNDICES EXISTENTES
  @@index([userId])
  @@index([clerkUserId])
  @@index([creditsRemaining])
  @@index([lastSyncedAt])

  // NOVOS ÍNDICES COMPOSTOS
  @@index([creditsRemaining(sort: Asc), lastSyncedAt])  // Saldos baixos prioritários
}

model StorageObject {
  id           String   @id @default(cuid())
  userId       String
  clerkUserId  String
  provider     String   @default("vercel_blob")
  url          String
  pathname     String
  name         String
  contentType  String?
  size         Int
  deletedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // ... relações existentes

  // ÍNDICES EXISTENTES
  @@index([userId])
  @@index([createdAt])
  @@index([clerkUserId])
  @@index([contentType])
  @@index([deletedAt])
  @@index([name])

  // NOVOS ÍNDICES COMPOSTOS
  @@index([userId, deletedAt, createdAt(sort: Desc)])  // Arquivos ativos do usuário
  @@index([contentType, size(sort: Desc)])              // Maiores arquivos por tipo
}

model RecommendedFund {
  id              String                @id @default(cuid())
  portfolioId     String
  ticker          String
  name            String
  segment         String
  currentPrice    Decimal               @db.Decimal(10,2)
  averagePrice    Decimal               @db.Decimal(10,2)
  ceilingPrice    Decimal               @db.Decimal(10,2)
  allocation      Decimal               @db.Decimal(5,2)
  recommendation  FundRecommendation
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  // ... relações existentes

  @@map("recommended_funds")

  // ÍNDICES EXISTENTES
  @@index([portfolioId])
  @@index([ticker])
  @@index([recommendation])

  // NOVOS ÍNDICES COMPOSTOS
  @@index([recommendation, allocation(sort: Desc)])  // Fundos por alocação
  @@index([ticker, currentPrice])                    // Preços atuais
}

model AporteRecomendacao {
  id                    String   @id @default(cuid())
  userId                String
  portfolioId           String
  valorAporte           Float
  recomendacoes         Json
  estrategia            Json
  dataRecomendacao      DateTime @default(now())
  ruleSetId             String?
  ruleSetVersion        Int?

  // ... relações existentes

  // NOVOS ÍNDICES
  @@index([userId, dataRecomendacao(sort: Desc)])        // Últimas recomendações
  @@index([portfolioId, dataRecomendacao(sort: Desc)])  // Histórico por portfolio
  @@index([ruleSetId, dataRecomendacao])                 // Por regra aplicada
}
```

### **1.3 Índices Parciais (Conditional Indexes)**

**Objetivo:** Índices apenas para subconjuntos específicos de dados

**Adicionar no schema:**

```prisma
model StorageObject {
  // ... campos existentes

  // ÍNDICE PARCIAL: Apenas arquivos NÃO deletados
  @@index([userId, createdAt(sort: Desc)], where: { deletedAt: null }, name: "idx_active_storage")

  // ÍNDICE PARCIAL: Apenas arquivos grandes (> 1MB)
  @@index([contentType, size(sort: Desc)], where: { size: { gt: 1048576 } }, name: "idx_large_files")
}

model Notification {
  // ... campos existentes (assumindo estrutura)

  // ÍNDICE PARCIAL: Apenas notificações não lidas
  @@index([userId, createdAt(sort: Desc)], where: { isRead: false }, name: "idx_unread_notifications")
}
```

> **Nota:** Índices parciais podem não ser suportados pelo Prisma diretamente. Nesses casos, criar via migration SQL manual.

### **1.4 Helpers para Queries JSON Otimizadas**

**Objetivo:** Funções auxiliares para queries em campos JSON

**Arquivo:** `src/lib/db-helpers.ts` (novo)

```typescript
import { prisma } from './db';
import { Prisma } from '@prisma/client';

/**
 * Buscar portfolios que contêm um FII específico
 * Usa operador JSONB @> para performance
 */
export async function findPortfoliosWithFii(
  userId: string,
  fiiCode: string
) {
  // Query otimizada com JSONB operator
  return await prisma.$queryRaw<Array<{
    id: string;
    originalFileName: string;
    positions: any;
    uploadedAt: Date;
  }>>`
    SELECT id, "originalFileName", positions, "uploadedAt"
    FROM "UserPortfolio"
    WHERE "userId" = ${userId}
      AND positions::jsonb @> ${JSON.stringify([{ fiiCode }])}::jsonb
    ORDER BY "uploadedAt" DESC
    LIMIT 20;
  `;
}

/**
 * Buscar análises com recomendações específicas
 */
export async function findAnalysesWithRecommendation(
  userId: string,
  recommendationType: string
) {
  return await prisma.$queryRaw<Array<{
    id: string;
    analysisType: string;
    recommendations: any;
    generatedAt: Date;
  }>>`
    SELECT id, "analysisType", recommendations, "generatedAt"
    FROM "AnalysisReport"
    WHERE "userId" = ${userId}
      AND recommendations::jsonb @> ${JSON.stringify([{ type: recommendationType }])}::jsonb
    ORDER BY "generatedAt" DESC
    LIMIT 10;
  `;
}

/**
 * Aggregação de uso de créditos por tipo de operação
 */
export async function getCreditUsageByType(userId: string, days: number = 30) {
  return await prisma.usageHistory.groupBy({
    by: ['operationType'],
    where: {
      userId,
      timestamp: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    _sum: {
      creditsUsed: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        creditsUsed: 'desc',
      },
    },
  });
}
```

### **1.5 Connection Pooling Otimizado**

**Objetivo:** Configurar pool de conexões do Prisma

**Arquivo:** `src/lib/db.ts` (atualização)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configuração do Prisma com logging e middleware
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

// Middleware para detectar queries lentas
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;

  // Log queries que demoram mais de 1 segundo
  if (duration > 1000) {
    console.warn(`⚠️  Slow query detected (${duration}ms):`, {
      model: params.model,
      action: params.action,
      duration,
    });
  }

  return result;
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

**Arquivo:** `.env` (configuração)

```bash
# Connection pooling otimizado
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20&connect_timeout=10"

# connection_limit: Máximo de conexões no pool (10 é bom para serverless)
# pool_timeout: Tempo máximo de espera por conexão (20s)
# connect_timeout: Timeout de conexão inicial (10s)
```

## 📝 FASE 2: Otimização do Backend (Simples)

### **2.1 Paralelizar Queries Independentes**

**Objetivo:** Usar Promise.all para queries que não dependem uma da outra

**Exemplo:** `src/app/api/dashboard/route.ts` (atualização)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ❌ ANTES (Sequencial - 4 queries em série)
  // const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  // const credits = await prisma.creditBalance.findUnique({ where: { clerkUserId: userId } });
  // const portfolios = await prisma.userPortfolio.findMany({ where: { userId: user.id } });
  // const analyses = await prisma.analysisReport.findMany({ where: { userId: user.id } });

  // ✅ DEPOIS (Paralelo - todas queries ao mesmo tempo)
  const [user, credits, portfolios, analyses, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId: userId },
    }),
    prisma.creditBalance.findUnique({
      where: { clerkUserId: userId },
    }),
    prisma.userPortfolio.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      take: 10, // Limitar resultados
      select: { // Selecionar apenas campos necessários
        id: true,
        originalFileName: true,
        uploadedAt: true,
        totalValue: true,
        lastAnalyzedAt: true,
      },
    }),
    prisma.analysisReport.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        analysisType: true,
        generatedAt: true,
        creditsUsed: true,
      },
    }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  return NextResponse.json({
    user: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
    },
    credits: {
      remaining: credits?.creditsRemaining || 0,
      lastSynced: credits?.lastSyncedAt,
    },
    portfolios,
    recentAnalyses: analyses,
    unreadNotifications: notifications,
  });
}
```

### **2.2 Memoização In-Memory (Simples)**

**Objetivo:** Cache simples em memória para dados estáticos

**Arquivo:** `src/lib/simple-cache.ts` (novo)

```typescript
/**
 * Cache simples em memória para dados que mudam raramente
 * Sem dependência externa (Redis, etc.)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  /**
   * Clear specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const memoryCache = new SimpleMemoryCache();

/**
 * Helper function to get or fetch data
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    console.log(`✅ Cache hit: ${key}`);
    return cached;
  }

  // Cache miss - fetch data
  console.log(`⏳ Cache miss: ${key}`);
  const data = await fetcher();

  // Store in cache
  memoryCache.set(key, data, ttlSeconds);

  return data;
}
```

**Uso em APIs:**

```typescript
// src/app/api/admin/settings/route.ts
import { getCachedOrFetch, memoryCache } from '@/lib/simple-cache';

export async function GET() {
  // Cache de 10 minutos para configurações admin
  const settings = await getCachedOrFetch(
    'admin:settings',
    async () => {
      return await prisma.adminSettings.findUnique({
        where: { id: 'singleton' },
      });
    },
    600 // 10 minutos
  );

  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  // ... atualizar settings

  // Invalidar cache após atualização
  memoryCache.delete('admin:settings');

  return NextResponse.json({ success: true });
}
```

### **2.3 Select Apenas Campos Necessários**

**Objetivo:** Reduzir dados trafegados

**Exemplo de otimização:**

```typescript
// ❌ ANTES: Busca TODOS os campos
const portfolios = await prisma.userPortfolio.findMany({
  where: { userId },
});

// ✅ DEPOIS: Busca apenas campos necessários
const portfolios = await prisma.userPortfolio.findMany({
  where: { userId },
  select: {
    id: true,
    originalFileName: true,
    uploadedAt: true,
    totalValue: true,
    // positions: false (não incluir JSON grande)
  },
});
```

## 📝 FASE 3: Otimização Frontend (Básica)

### **3.1 TanStack Query Configuração Otimizada**

**Arquivo:** `src/components/providers/query-provider.tsx` (atualização)

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache por 5 minutos
            staleTime: 5 * 60 * 1000,

            // Garbage collection após 10 minutos
            gcTime: 10 * 60 * 1000,

            // Não refetch ao focar janela (melhora performance)
            refetchOnWindowFocus: false,

            // Refetch ao reconectar
            refetchOnReconnect: true,

            // Apenas 1 retry
            retry: 1,
            retryDelay: 1000,
          },
          mutations: {
            // Mutations não fazem retry
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### **3.2 Memoização de Componentes**

**Exemplo:** Componente de lista

```typescript
'use client';

import { useMemo, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';

// Memoizar componente filho
const PortfolioCard = memo(({ portfolio, onSelect }: any) => {
  return (
    <div onClick={() => onSelect(portfolio.id)}>
      <h3>{portfolio.originalFileName}</h3>
      <p>R$ {portfolio.totalValue.toLocaleString()}</p>
    </div>
  );
});

export function PortfolioList() {
  const { data: portfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => api.get('/api/portfolios'),
  });

  // Memoizar cálculo pesado
  const totalValue = useMemo(() => {
    return portfolios?.reduce((sum, p) => sum + p.totalValue, 0) || 0;
  }, [portfolios]);

  // Memoizar callback
  const handleSelect = useCallback((id: string) => {
    console.log('Selected:', id);
  }, []);

  return (
    <div>
      <p>Total: R$ {totalValue.toLocaleString()}</p>
      {portfolios?.map((portfolio) => (
        <PortfolioCard
          key={portfolio.id}
          portfolio={portfolio}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

## 📋 Checklist de Implementação

### **Dia 1: Análise e Índices**
- [ ] Habilitar `pg_stat_statements` no Postgres
- [ ] Criar e executar script `analyze-slow-queries.ts`
- [ ] Analisar resultados e identificar queries críticas
- [ ] Adicionar índices compostos no `schema.prisma`
- [ ] Adicionar índices parciais (se suportado)
- [ ] Executar `npx prisma migrate dev --name add-performance-indexes`
- [ ] Testar performance das queries principais

### **Dia 2: Backend e Helpers**
- [ ] Criar `src/lib/db-helpers.ts` com queries otimizadas
- [ ] Implementar `src/lib/simple-cache.ts`
- [ ] Atualizar `src/lib/db.ts` com middleware de slow queries
- [ ] Configurar connection pooling no `.env`
- [ ] Paralelizar queries em APIs principais (dashboard, etc.)
- [ ] Adicionar `select` específico onde aplicável
- [ ] Aplicar cache in-memory em endpoints lentos

### **Dia 3: Frontend e Testes**
- [ ] Atualizar `query-provider.tsx` com configuração otimizada
- [ ] Adicionar memoização em componentes pesados
- [ ] Executar script de benchmark
- [ ] Testar performance end-to-end
- [ ] Documentar melhorias obtidas

## 🧪 Testes de Performance

### **Script de Benchmark**

**Arquivo:** `scripts/benchmark-queries.ts` (novo)

```typescript
import { performance } from 'perf_hooks';
import { prisma } from '../src/lib/db';

async function runBenchmarks() {
  console.log('🚀 Iniciando benchmarks de queries...\n');

  const testUserId = 'test-user-id'; // Substituir por ID real

  // Benchmark 1: Query de usuários ativos
  const start1 = performance.now();
  await prisma.user.findMany({
    where: { isActive: true },
    take: 100,
  });
  const end1 = performance.now();
  console.log(`✅ Users Query: ${(end1 - start1).toFixed(2)}ms`);

  // Benchmark 2: Dashboard query paralela
  const start2 = performance.now();
  await Promise.all([
    prisma.user.findUnique({ where: { id: testUserId } }),
    prisma.creditBalance.findUnique({ where: { userId: testUserId } }),
    prisma.userPortfolio.findMany({ where: { userId: testUserId }, take: 10 }),
  ]);
  const end2 = performance.now();
  console.log(`✅ Dashboard Parallel Query: ${(end2 - start2).toFixed(2)}ms`);

  // Benchmark 3: Analysis reports com join
  const start3 = performance.now();
  await prisma.analysisReport.findMany({
    where: { userId: testUserId },
    include: {
      investmentRecommendations: {
        take: 5,
      },
    },
    take: 10,
  });
  const end3 = performance.now();
  console.log(`✅ Analysis with Recommendations: ${(end3 - start3).toFixed(2)}ms`);

  // Benchmark 4: Aggregation
  const start4 = performance.now();
  await prisma.usageHistory.groupBy({
    by: ['operationType'],
    where: { userId: testUserId },
    _sum: {
      creditsUsed: true,
    },
  });
  const end4 = performance.now();
  console.log(`✅ Usage Aggregation: ${(end4 - start4).toFixed(2)}ms`);

  console.log('\n✨ Benchmarks concluídos!');
  await prisma.$disconnect();
}

runBenchmarks().catch(console.error);
```

**Executar:**
```bash
npx tsx scripts/benchmark-queries.ts
```

## 📊 Métricas de Sucesso

### **Objetivos:**

1. **Queries:**
   - ✅ Reduzir queries > 500ms em 70%
   - ✅ Dashboard carrega em < 1s
   - ✅ Listagens carregam em < 500ms

2. **Backend:**
   - ✅ APIs respondem em < 300ms (média)
   - ✅ Cache hit rate > 50% (in-memory)

3. **Frontend:**
   - ✅ Menos re-renders desnecessários
   - ✅ TanStack Query cache configurado

## 📚 Documentação

### **Manutenção dos Índices:**

1. **Monitoring:** Executar `analyze-slow-queries.ts` mensalmente
2. **Novos Índices:** Adicionar conforme novas queries lentas
3. **Limpeza:** Remover índices não utilizados
4. **Cache:** Limpar cache in-memory ao atualizar dados

### **Quando Adicionar Índices:**

- ✅ Campos em `WHERE` clauses frequentes
- ✅ Campos em `ORDER BY`
- ✅ Foreign keys com muitas joins
- ✅ Campos usados em `GROUP BY`
- ❌ Campos que mudam muito (alto write load)
- ❌ Tabelas muito pequenas (< 1000 rows)

---

**Agente Responsável:** Database Agent
**Revisão:** Tech Lead
**Estimativa:** 2-3 dias
**Complexidade:** Média (Simplificado)
