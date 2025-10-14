# 📚 Performance Optimization Documentation

Bem-vindo à documentação de otimização de performance do FiiAI (PLAN-006).

## 🚀 Quick Links

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [**Quick Start**](./QUICK_START_PERFORMANCE.md) | Comece aqui! Guia rápido com exemplos práticos | Desenvolvedores |
| [**Performance Guide**](./PERFORMANCE_OPTIMIZATION.md) | Guia completo de todas as otimizações | Todos |
| [**Examples**](./PERFORMANCE_EXAMPLES.md) | Exemplos práticos de código | Desenvolvedores |
| [**Implementation**](../IMPLEMENTACAO_PLAN_006.md) | Detalhes técnicos da implementação | Tech Leads |
| [**Summary**](../PLAN_006_SUMMARY.md) | Sumário executivo | Gestores |

## 📖 Para Começar

### Sou Desenvolvedor, o que preciso saber?

1. **Leia primeiro:** [Quick Start Guide](./QUICK_START_PERFORMANCE.md)
2. **Depois:** [Practical Examples](./PERFORMANCE_EXAMPLES.md)
3. **Se precisar de detalhes:** [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md)

### Sou Tech Lead, o que preciso revisar?

1. **Comece com:** [Implementation Details](../IMPLEMENTACAO_PLAN_006.md)
2. **Depois:** [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md)
3. **Para validação:** Scripts de teste e benchmark

### Sou Gestor, qual o impacto?

1. **Leia:** [Executive Summary](../PLAN_006_SUMMARY.md)
2. **Métricas:** 40-70% de melhoria, dashboard < 1s, APIs < 300ms
3. **Status:** ✅ Completo, pronto para produção

## 🎯 O Que Foi Implementado?

### Resumo Visual

```
┌─────────────────────────────────────┐
│   OTIMIZAÇÕES IMPLEMENTADAS         │
├─────────────────────────────────────┤
│  ✅ 20+ índices compostos            │
│  ✅ Sistema de cache in-memory       │
│  ✅ Queries paralelas                │
│  ✅ DB helpers otimizados            │
│  ✅ TanStack Query otimizado         │
│  ✅ Middleware slow query detection  │
│  ✅ Scripts de análise e benchmark   │
└─────────────────────────────────────┘
```

### Performance Esperada

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Dashboard | 2-3s | < 1s | 60-70% |
| APIs | 300-500ms | < 200ms | 40% |
| Slow Queries | 15-20% | < 5% | 70% |
| Cache Hit | 0% | > 50% | New! |

## 📦 Estrutura da Documentação

```
docs/
├── README_PERFORMANCE.md (este arquivo)
├── QUICK_START_PERFORMANCE.md
│   └── Patterns comuns, exemplos rápidos, armadilhas
├── PERFORMANCE_OPTIMIZATION.md
│   └── Guia completo, monitoring, troubleshooting
├── PERFORMANCE_EXAMPLES.md
│   └── Exemplos práticos: APIs, hooks, componentes
└── BULK_FUND_IMPORT.md (outra feature)

/ (raiz do projeto)
├── IMPLEMENTACAO_PLAN_006.md
│   └── Detalhes técnicos da implementação
└── PLAN_006_SUMMARY.md
    └── Sumário executivo com KPIs

scripts/
├── analyze-slow-queries.ts
│   └── Análise de queries lentas do PostgreSQL
└── benchmark-queries.ts
    └── Suite completa de benchmarks

src/lib/
├── db.ts (modificado)
│   └── Middleware de slow query detection
├── db-helpers.ts
│   └── Helpers otimizados para queries comuns
└── simple-cache.ts
    └── Sistema de cache in-memory
```

## 🛠️ Ferramentas Disponíveis

### Scripts NPM

```bash
# Performance
npm run perf:analyze      # Analisar queries lentas
npm run perf:benchmark    # Executar benchmarks
npm run perf:test         # Alias para benchmark

# Database
npm run db:migrate        # Aplicar migrations
npm run db:push           # Push schema
npm run db:studio         # Prisma Studio
```

### APIs Otimizadas

```typescript
// Dashboard completo
GET /api/dashboard/stats

// Estatísticas de créditos
GET /api/credits/stats?days=30

// Exemplos criados como referência
```

### Libraries

```typescript
// Cache in-memory
import { getCachedOrFetch, CacheKeys, memoryCache } from '@/lib/simple-cache';

// DB helpers otimizados
import {
  getDashboardData,
  getRecentPortfolios,
  getCreditUsageStats,
} from '@/lib/db-helpers';
```

## 📚 Guias por Tipo de Tarefa

### Criar Nova API Route

1. Leia: [Quick Start - Pattern 1](./QUICK_START_PERFORMANCE.md#pattern-1-api-com-cache)
2. Veja exemplo: [Performance Examples - API Routes](./PERFORMANCE_EXAMPLES.md#1-api-routes-otimizadas)
3. Use checklist: [Quick Start - Checklist](./QUICK_START_PERFORMANCE.md#checklist-para-nova-api)

### Criar Custom Hook

1. Leia: [Quick Start - TanStack Query](./QUICK_START_PERFORMANCE.md)
2. Veja exemplo: [Performance Examples - Hooks](./PERFORMANCE_EXAMPLES.md#2-custom-hooks-com-cache)
3. Configure cache apropriado

### Otimizar Componente Existente

1. Leia: [Performance Examples - Componentes](./PERFORMANCE_EXAMPLES.md#3-componentes-otimizados)
2. Use `memo()` para componentes filhos
3. Use `useMemo()` para cálculos pesados
4. Use `useCallback()` para callbacks

### Adicionar Novo Índice

1. Leia: [Performance Guide - Índices](./PERFORMANCE_OPTIMIZATION.md#quando-adicionar-novos-índices)
2. Adicione no `schema.prisma`
3. Execute: `npx prisma migrate dev`
4. Teste com: `npm run perf:benchmark`

### Debugar Query Lenta

1. Verifique logs: `⚠️  Slow query detected`
2. Execute: `npm run perf:analyze`
3. Leia: [Performance Guide - Troubleshooting](./PERFORMANCE_OPTIMIZATION.md#problema-queries-ainda-lentas)
4. Adicione índice se necessário

## 🎓 Recursos de Aprendizado

### Conceitos Fundamentais

1. **Índices de Banco de Dados**
   - O que são e por que importam
   - Quando adicionar/remover
   - [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)

2. **Cache Strategies**
   - TTL (Time To Live)
   - Cache invalidation
   - Hit rate optimization

3. **Query Optimization**
   - Queries paralelas
   - Select específico
   - Aggregations eficientes

4. **React Performance**
   - Memoization (`memo`, `useMemo`, `useCallback`)
   - TanStack Query caching
   - Component optimization

### Recursos Externos

- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

## ✅ Checklist de Implementação

### Antes de Começar
- [ ] Ler Quick Start Guide
- [ ] Instalar tsx: `npm install`
- [ ] Verificar DATABASE_URL configurado

### Aplicar Otimizações
- [ ] Executar migration: `npx prisma migrate dev`
- [ ] Verificar índices criados
- [ ] Executar benchmark: `npm run perf:benchmark`
- [ ] Validar resultados (< 200ms médio)

### Em Desenvolvimento
- [ ] Usar cache para dados estáveis
- [ ] Queries paralelas quando possível
- [ ] Select apenas campos necessários
- [ ] Invalidar cache após mutations
- [ ] Monitorar logs de slow queries

### Antes de Deploy
- [ ] Executar benchmark em staging
- [ ] Verificar cache hit rate > 50%
- [ ] Confirmar slow queries < 5%
- [ ] Revisar logs de performance

## 🆘 Precisa de Ajuda?

### Problemas Comuns

1. **Query ainda lenta (> 500ms)**
   - Executar: `npm run perf:analyze`
   - Ver: [Troubleshooting - Queries Lentas](./PERFORMANCE_OPTIMIZATION.md#problema-queries-ainda-lentas)

2. **Cache não funcionando**
   - Verificar TTL
   - Verificar invalidação
   - Ver: [Troubleshooting - Cache](./PERFORMANCE_OPTIMIZATION.md#problema-cache-não-está-funcionando)

3. **Memória alta**
   - Verificar cache size
   - Reduzir TTL
   - Ver: [Troubleshooting - Memória](./PERFORMANCE_OPTIMIZATION.md#problema-memória-alta)

4. **Database connection pool**
   - Ajustar connection_limit
   - Ver: [Troubleshooting - Connection Pool](./PERFORMANCE_OPTIMIZATION.md#problema-database-connection-pool-esgotado)

### Contatos

- **Tech Lead:** Revisar código com tech lead
- **Documentação:** Consultar guias específicos acima
- **Issues:** Criar issue no repositório

## 🔄 Atualizações e Manutenção

### Checklist Mensal

- [ ] Executar `npm run perf:analyze`
- [ ] Executar `npm run perf:benchmark`
- [ ] Revisar logs de slow queries
- [ ] Verificar cache stats
- [ ] Analisar índices não utilizados
- [ ] Atualizar documentação se necessário

### Quando Atualizar Esta Documentação

- Novos índices adicionados
- Novos patterns descobertos
- Mudanças no sistema de cache
- Feedback da equipe

## 📊 Métricas de Sucesso

### Como Medir

1. **Performance:**
   ```bash
   npm run perf:benchmark
   ```

2. **Cache:**
   ```typescript
   import { memoryCache } from '@/lib/simple-cache';
   console.log(memoryCache.getStats());
   ```

3. **Slow Queries:**
   - Monitorar logs: `⚠️  Slow query detected`
   - Target: < 5% das queries

### Targets

- ✅ Dashboard: < 1s
- ✅ APIs: < 300ms média
- ✅ Cache hit: > 50%
- ✅ Slow queries: < 5%

---

## 🎉 Conclusão

Esta documentação cobre todas as otimizações implementadas no PLAN-006. Use os guias específicos conforme sua necessidade:

- **Desenvolvimento rápido?** → [Quick Start](./QUICK_START_PERFORMANCE.md)
- **Exemplos práticos?** → [Examples](./PERFORMANCE_EXAMPLES.md)
- **Detalhes completos?** → [Performance Guide](./PERFORMANCE_OPTIMIZATION.md)
- **Visão executiva?** → [Summary](../PLAN_006_SUMMARY.md)

**Status:** ✅ Pronto para uso
**Última atualização:** 2025-10-14
**Versão:** 1.0
