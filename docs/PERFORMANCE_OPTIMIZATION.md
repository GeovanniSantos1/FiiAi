# Performance Optimization Guide - PLAN-006

Este documento descreve todas as otimizações de performance implementadas no FiiAI, incluindo índices de banco de dados, cache in-memory, e configurações otimizadas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Otimizações Implementadas](#otimizações-implementadas)
- [Como Usar](#como-usar)
- [Monitoramento](#monitoramento)
- [Manutenção](#manutenção)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

### Objetivos de Performance

1. **Queries:** Reduzir queries > 500ms em 70%
2. **Dashboard:** Carregamento em < 1s
3. **APIs:** Resposta média < 300ms
4. **Cache Hit Rate:** > 50% para dados em memória

### Melhorias Implementadas

- ✅ **20+ índices compostos** no banco de dados
- ✅ **Sistema de cache in-memory** sem dependências externas
- ✅ **Queries paralelas** em APIs críticas
- ✅ **TanStack Query** otimizado com cache de 5 minutos
- ✅ **Middleware de detecção** de slow queries
- ✅ **Helpers otimizados** para queries JSON

## 🚀 Otimizações Implementadas

### 1. Índices de Banco de Dados

#### Índices Compostos Principais

```sql
-- Usuários ativos recentes
CREATE INDEX "User_isActive_createdAt_idx"
  ON "User"("isActive", "createdAt" DESC);

-- Dashboard de usuário
CREATE INDEX "UserPortfolio_userId_uploadedAt_idx"
  ON "UserPortfolio"("userId", "uploadedAt" DESC);

-- Análises recentes
CREATE INDEX "AnalysisReport_userId_generatedAt_idx"
  ON "AnalysisReport"("userId", "generatedAt" DESC);

-- Histórico de créditos
CREATE INDEX "UsageHistory_userId_operationType_timestamp_idx"
  ON "UsageHistory"("userId", "operationType", "timestamp" DESC);
```

#### Como Aplicar os Índices

**Opção 1: Via Prisma (quando DB estiver disponível)**
```bash
npx prisma migrate dev
```

**Opção 2: Via SQL Manual**
```bash
psql $DATABASE_URL -f prisma/migrations/add-performance-indexes-plan-006.sql
```

### 2. Sistema de Cache In-Memory

#### Uso Básico

```typescript
import { getCachedOrFetch, CacheKeys, memoryCache } from '@/lib/simple-cache';

// Buscar dados com cache
const data = await getCachedOrFetch(
  CacheKeys.user(userId),
  async () => {
    return await prisma.user.findUnique({ where: { id: userId } });
  },
  300 // TTL em segundos (5 minutos)
);

// Invalidar cache após atualização
memoryCache.delete(CacheKeys.user(userId));
```

#### Cache Keys Disponíveis

```typescript
CacheKeys.user(userId)
CacheKeys.userCredits(clerkUserId)
CacheKeys.portfolio(portfolioId)
CacheKeys.portfolioList(userId)
CacheKeys.analysis(analysisId)
CacheKeys.analysisList(userId)
CacheKeys.adminSettings()
CacheKeys.plans()
CacheKeys.activePlans()
CacheKeys.recommendedFunds(portfolioId)
CacheKeys.aporteHistory(userId)
CacheKeys.creditStats(userId, days)
CacheKeys.notifications(userId)
CacheKeys.unreadCount(userId)
```

#### Invalidação de Cache

```typescript
import { InvalidatePatterns, invalidateKeys } from '@/lib/simple-cache';

// Invalidar cache relacionado a um usuário
invalidateKeys(InvalidatePatterns.user(userId));

// Invalidar cache de portfolio
invalidateKeys(InvalidatePatterns.portfolio(userId, portfolioId));

// Invalidar cache de créditos
invalidateKeys(InvalidatePatterns.credits(userId, clerkUserId));
```

### 3. Queries Paralelas

#### Antes (Sequencial - Lento)
```typescript
const user = await prisma.user.findUnique({ where: { clerkId: userId } });
const credits = await prisma.creditBalance.findUnique({ where: { clerkUserId: userId } });
const portfolios = await prisma.userPortfolio.findMany({ where: { userId: user.id } });
// Total: 150ms + 100ms + 200ms = 450ms
```

#### Depois (Paralelo - Rápido)
```typescript
const [user, credits, portfolios] = await Promise.all([
  prisma.user.findUnique({ where: { clerkId: userId } }),
  prisma.creditBalance.findUnique({ where: { clerkUserId: userId } }),
  prisma.userPortfolio.findMany({ where: { userId } }),
]);
// Total: Max(150ms, 100ms, 200ms) = 200ms
```

### 4. Helpers Otimizados

#### Uso dos DB Helpers

```typescript
import {
  getDashboardData,
  getRecentPortfolios,
  getRecentAnalysesWithRecommendations,
  getCreditUsageStats,
} from '@/lib/db-helpers';

// Dashboard completo em uma chamada paralela
const dashboardData = await getDashboardData(userId, clerkUserId);

// Portfolios recentes com select otimizado
const portfolios = await getRecentPortfolios(userId, 10);

// Análises com recomendações
const analyses = await getRecentAnalysesWithRecommendations(userId, 5);

// Estatísticas de créditos
const stats = await getCreditUsageStats(userId, 30);
```

### 5. TanStack Query Otimizado

#### Configuração Aplicada

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,        // 5 minutos
    gcTime: 10 * 60 * 1000,          // 10 minutos
    refetchOnWindowFocus: false,     // Não refetch ao focar
    refetchOnReconnect: true,        // Refetch ao reconectar
    retry: 1,                        // Apenas 1 retry
    retryDelay: 1000,                // 1 segundo
  },
  mutations: {
    retry: 0,                        // Sem retry
  }
}
```

## 📊 Monitoramento

### 1. Detectar Queries Lentas

O middleware no `src/lib/db.ts` automaticamente loga queries lentas:

```typescript
// Queries > 1s
⚠️  Slow query detected (1234ms): { model: 'User', action: 'findMany', duration: 1234 }

// Queries > 500ms (em development)
⏱️  Query took 567ms: User.findMany
```

### 2. Executar Análise de Queries

```bash
# Habilitar pg_stat_statements no banco (uma vez)
# Execute no PostgreSQL:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

# Analisar queries lentas
npx tsx scripts/analyze-slow-queries.ts
```

**Output esperado:**
```
🔍 Analisando queries lentas...

📊 Top 10 Queries Mais Lentas:

1. Query: SELECT * FROM "UserPortfolio" WHERE "userId" = ...
   Calls: 150, Avg: 234ms, Max: 890ms

2. Query: SELECT * FROM "AnalysisReport" WHERE ...
   Calls: 80, Avg: 189ms, Max: 456ms
```

### 3. Executar Benchmark

```bash
npx tsx scripts/benchmark-queries.ts
```

**Output esperado:**
```
🚀 Iniciando benchmarks de queries...

✅ 1. Buscar usuários ativos (100 registros): 45.23ms
✅ 2. Buscar portfolios recentes (helper otimizado): 38.91ms
✅ 3. Dashboard com queries paralelas: 156.78ms
✅ 4. Analysis reports com recomendações: 92.45ms

📊 RESULTADOS DO BENCHMARK

✅ Sucesso: 10/10
❌ Falhas: 0/10

📈 Estatísticas (queries bem-sucedidas):
   Média: 78.34ms
   Mais rápida: 12.45ms
   Mais lenta: 156.78ms

✅ Todas as queries estão performando bem (< 500ms)
```

### 4. Verificar Cache

```typescript
import { memoryCache } from '@/lib/simple-cache';

// Obter estatísticas do cache
const stats = memoryCache.getStats();
console.log(stats);
// { total: 45, valid: 42, expired: 3, keys: [...] }

// Verificar tamanho
console.log(`Cache size: ${memoryCache.size()}`);

// Limpar entradas expiradas manualmente
const cleared = memoryCache.clearExpired();
console.log(`Cleared ${cleared} expired entries`);
```

## 🔧 Manutenção

### Quando Adicionar Novos Índices

✅ **Adicione índices quando:**
- Campos são usados frequentemente em `WHERE` clauses
- Campos são usados em `ORDER BY`
- Foreign keys com muitas JOINs
- Campos usados em `GROUP BY`

❌ **Não adicione índices quando:**
- Campos mudam com muita frequência (alto write load)
- Tabelas muito pequenas (< 1000 rows)
- Índice não é usado nas queries (verificar via EXPLAIN)

### Como Adicionar um Novo Índice

1. **Adicionar no schema.prisma:**
```prisma
model MyModel {
  // ... campos

  @@index([field1, field2(sort: Desc)])
}
```

2. **Criar migration:**
```bash
npx prisma migrate dev --name add-mymodel-index
```

3. **Testar performance:**
```bash
npx tsx scripts/benchmark-queries.ts
```

### Limpeza Periódica

Execute mensalmente:

```bash
# 1. Analisar queries lentas
npx tsx scripts/analyze-slow-queries.ts

# 2. Verificar índices não utilizados
# Execute no PostgreSQL:
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

# 3. Limpar cache em produção (se necessário)
# Via API: POST /api/cache/clear (implementar endpoint admin)
```

### Otimização Contínua

**Checklist Mensal:**

- [ ] Executar `analyze-slow-queries.ts`
- [ ] Revisar logs de slow queries (> 1s)
- [ ] Executar benchmark e comparar com baseline
- [ ] Verificar hit rate do cache (target: > 50%)
- [ ] Analisar índices não utilizados
- [ ] Atualizar estatísticas do banco (`ANALYZE`)

## ❗ Troubleshooting

### Problema: Queries Ainda Lentas

**Diagnóstico:**
```bash
# 1. Verificar se índices foram criados
psql $DATABASE_URL -c "\d+ UserPortfolio"

# 2. Ver plano de execução
# No código, adicionar temporariamente:
await prisma.$queryRaw`EXPLAIN ANALYZE SELECT ...`;
```

**Soluções:**
1. Verificar se migration foi aplicada
2. Executar `ANALYZE` nas tabelas
3. Verificar se query usa os índices (via EXPLAIN)
4. Considerar adicionar índices específicos

### Problema: Cache Não Está Funcionando

**Diagnóstico:**
```typescript
import { memoryCache } from '@/lib/simple-cache';

// Verificar se cache está sendo usado
console.log('Cache stats:', memoryCache.getStats());
console.log('Cache keys:', memoryCache.keys());
```

**Soluções:**
1. Verificar se TTL não está muito baixo
2. Verificar se cache não está sendo invalidado demais
3. Usar logs em development para ver hits/misses

### Problema: Memória Alta

**Diagnóstico:**
```typescript
const stats = memoryCache.getStats();
if (stats.total > 1000) {
  console.warn('Cache muito grande:', stats);
}
```

**Soluções:**
1. Reduzir TTL de alguns caches
2. Limpar cache manualmente: `memoryCache.clear()`
3. Ajustar o auto-cleanup (atualmente 5 minutos)

### Problema: Database Connection Pool Esgotado

**Sintoma:** `Error: Can't reach database server` ou timeouts

**Solução:**
```env
# Ajustar no .env
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20&connect_timeout=10"

# Para serverless (Vercel), use connection limit baixo (5-10)
# Para servidor tradicional, pode usar 20-50
```

## 📈 Métricas de Sucesso

### Baseline (Antes das Otimizações)

- Dashboard: ~2-3s
- Queries médias: ~300-500ms
- Queries lentas: 15-20% > 500ms

### Target (Após Otimizações)

- ✅ Dashboard: < 1s (melhoria de 50-70%)
- ✅ Queries médias: < 200ms (melhoria de 40%)
- ✅ Queries lentas: < 5% > 500ms (redução de 70%)
- ✅ Cache hit rate: > 50%

### Como Medir

```bash
# 1. Executar benchmark
npx tsx scripts/benchmark-queries.ts

# 2. Monitorar logs em produção
# Buscar por: "⚠️  Slow query detected"

# 3. Usar ferramentas de APM (se disponível)
# New Relic, Datadog, etc.
```

## 🔗 Recursos Adicionais

### Scripts Úteis

- `scripts/analyze-slow-queries.ts` - Análise de queries lentas
- `scripts/benchmark-queries.ts` - Benchmark de performance
- `prisma/migrations/add-performance-indexes-plan-006.sql` - Migration SQL manual

### Arquivos Importantes

- `src/lib/db.ts` - Cliente Prisma com middleware
- `src/lib/db-helpers.ts` - Helpers otimizados
- `src/lib/simple-cache.ts` - Sistema de cache
- `src/components/providers/query-provider.tsx` - TanStack Query config
- `prisma/schema.prisma` - Schema com índices

### Documentação Externa

- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [TanStack Query Guides](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)

---

**Implementado por:** PLAN-006
**Data:** 2025-10-14
**Versão:** 1.0
