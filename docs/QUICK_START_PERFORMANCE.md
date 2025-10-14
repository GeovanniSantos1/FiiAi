# 🚀 Quick Start - Performance Optimization

Guia rápido para usar as otimizações de performance implementadas no PLAN-006.

## ⚡ TL;DR - Start Here

```bash
# 1. Aplicar índices do banco (quando DB disponível)
npx prisma migrate dev

# 2. Executar benchmark
npx tsx scripts/benchmark-queries.ts

# 3. Analisar queries lentas (se houver)
npx tsx scripts/analyze-slow-queries.ts
```

## 📦 Features Disponíveis

### 1. Cache In-Memory (Mais Comum)

**Use para dados que mudam raramente:**

```typescript
import { getCachedOrFetch, CacheKeys } from '@/lib/simple-cache';

// GET endpoint com cache de 5 minutos
export async function GET() {
  const data = await getCachedOrFetch(
    CacheKeys.adminSettings(),
    () => prisma.adminSettings.findUnique({ where: { id: 'singleton' } }),
    300 // 5 minutos
  );

  return NextResponse.json(data);
}

// POST endpoint - invalidar cache
export async function POST() {
  // ... atualizar dados

  memoryCache.delete(CacheKeys.adminSettings());
  return NextResponse.json({ success: true });
}
```

### 2. Queries Paralelas

**Use quando queries são independentes:**

```typescript
// ❌ NÃO FAÇA (sequencial)
const user = await prisma.user.findUnique({ where: { id } });
const credits = await prisma.creditBalance.findUnique({ where: { userId: id } });
const portfolios = await prisma.userPortfolio.findMany({ where: { userId: id } });

// ✅ FAÇA (paralelo)
const [user, credits, portfolios] = await Promise.all([
  prisma.user.findUnique({ where: { id } }),
  prisma.creditBalance.findUnique({ where: { userId: id } }),
  prisma.userPortfolio.findMany({ where: { userId: id } }),
]);
```

### 3. DB Helpers Otimizados

**Use helpers pré-otimizados:**

```typescript
import { getDashboardData, getRecentPortfolios } from '@/lib/db-helpers';

// Dashboard completo em uma chamada
const dashboardData = await getDashboardData(userId, clerkUserId);

// Portfolios com select otimizado
const portfolios = await getRecentPortfolios(userId, 10);
```

### 4. Select Apenas Campos Necessários

**Economize banda e processamento:**

```typescript
// ❌ NÃO FAÇA (busca tudo, inclusive JSON pesado)
const portfolios = await prisma.userPortfolio.findMany({
  where: { userId },
});

// ✅ FAÇA (apenas campos necessários)
const portfolios = await prisma.userPortfolio.findMany({
  where: { userId },
  select: {
    id: true,
    originalFileName: true,
    uploadedAt: true,
    totalValue: true,
    // positions: false - não incluir
  },
});
```

## 🎯 Patterns de Uso Comum

### Pattern 1: API com Cache

```typescript
// src/app/api/my-endpoint/route.ts
import { getCachedOrFetch, CacheKeys, memoryCache } from '@/lib/simple-cache';

export async function GET() {
  const data = await getCachedOrFetch(
    'my-unique-key',
    async () => {
      // Sua query aqui
      return await prisma.myModel.findMany();
    },
    300 // TTL em segundos
  );

  return NextResponse.json(data);
}

export async function POST() {
  // Atualizar dados...

  // Invalidar cache
  memoryCache.delete('my-unique-key');

  return NextResponse.json({ success: true });
}
```

### Pattern 2: Dashboard Otimizado

```typescript
// src/app/api/dashboard/route.ts
import { getDashboardData } from '@/lib/db-helpers';
import { getCachedOrFetch, CacheKeys } from '@/lib/simple-cache';

export async function GET() {
  const { userId } = await auth();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // Cache de 2 minutos
  const data = await getCachedOrFetch(
    CacheKeys.user(user.id),
    () => getDashboardData(user.id, userId),
    120
  );

  return NextResponse.json(data);
}
```

### Pattern 3: Lista com Paginação

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // Cache por página
  const cacheKey = `portfolios:${userId}:page:${page}:limit:${limit}`;

  const data = await getCachedOrFetch(
    cacheKey,
    async () => {
      return await prisma.userPortfolio.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          originalFileName: true,
          uploadedAt: true,
          totalValue: true,
        },
      });
    },
    180 // 3 minutos
  );

  return NextResponse.json({ data, page, limit });
}
```

## 🔍 Debugging

### Ver Logs de Queries Lentas

Queries > 1s são automaticamente logadas:

```typescript
⚠️  Slow query detected (1234ms): {
  model: 'UserPortfolio',
  action: 'findMany',
  duration: 1234
}
```

### Verificar Cache

```typescript
import { memoryCache } from '@/lib/simple-cache';

// Ver estatísticas
console.log(memoryCache.getStats());
// { total: 45, valid: 42, expired: 3, keys: [...] }

// Ver todas as chaves
console.log(memoryCache.keys());
// ['user:123', 'portfolios:456', ...]

// Verificar se chave existe
console.log(memoryCache.has('user:123')); // true/false
```

### Benchmark Manual

```typescript
const start = performance.now();
const data = await myQuery();
const end = performance.now();
console.log(`Query took ${end - start}ms`);
```

## 📋 Checklist para Nova API

Ao criar uma nova API route:

- [ ] Usar `Promise.all()` para queries independentes
- [ ] Adicionar cache se dados mudam raramente (> 1min)
- [ ] Usar `select` para escolher apenas campos necessários
- [ ] Usar helpers do `db-helpers.ts` quando disponível
- [ ] Invalidar cache em mutations (POST/PUT/DELETE)
- [ ] Testar com `scripts/benchmark-queries.ts`

## 🚨 Armadilhas Comuns

### ❌ Cache Demais
```typescript
// NÃO cache dados que mudam frequentemente
const balance = await getCachedOrFetch(
  'credits',
  () => prisma.creditBalance.findUnique({ where: { userId } }),
  3600 // ❌ 1 hora é muito para saldo que muda sempre
);
```

### ❌ Esquecer de Invalidar
```typescript
// POST para atualizar settings
export async function POST() {
  await prisma.adminSettings.update({ ... });

  // ❌ ERRO: esqueceu de invalidar cache!
  return NextResponse.json({ success: true });
}

// ✅ CORRETO:
export async function POST() {
  await prisma.adminSettings.update({ ... });
  memoryCache.delete(CacheKeys.adminSettings()); // ✅
  return NextResponse.json({ success: true });
}
```

### ❌ Select Incompleto
```typescript
// ❌ Busca tudo mas usa só alguns campos
const portfolios = await prisma.userPortfolio.findMany({
  where: { userId },
});
return portfolios.map(p => ({ id: p.id, name: p.originalFileName }));

// ✅ Select apenas o necessário
const portfolios = await prisma.userPortfolio.findMany({
  where: { userId },
  select: { id: true, originalFileName: true },
});
```

## 🎓 Aprenda Mais

- [Guia Completo de Performance](./PERFORMANCE_OPTIMIZATION.md)
- [Implementação PLAN-006](../IMPLEMENTACAO_PLAN_006.md)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## ⚙️ Configurações Recomendadas

### Cache TTL por Tipo de Dado

| Tipo de Dado | TTL Recomendado | Razão |
|--------------|-----------------|-------|
| Admin Settings | 10-30 min | Muda raramente |
| User Profile | 5 min | Pode mudar moderadamente |
| Credit Balance | 1-2 min | Muda com frequência |
| Portfolios List | 5 min | Muda ao upload |
| Analysis Reports | 10 min | Dados históricos |
| Notifications Count | 30s | Tempo real desejável |

### Quando Adicionar Índices

Adicione índice se:
- Query usada frequentemente (> 100x/dia)
- Query demora > 500ms
- Campo usado em WHERE, ORDER BY, ou JOIN

Não adicione índice se:
- Tabela muito pequena (< 1000 registros)
- Campo muda muito (> 1000 updates/min)
- Query raramente executada

---

**Dúvidas?** Consulte [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)
