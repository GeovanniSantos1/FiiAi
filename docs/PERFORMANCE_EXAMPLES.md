# 💡 Performance Optimization - Practical Examples

Exemplos práticos de como aplicar as otimizações do PLAN-006 em cenários reais.

## 📖 Índice

1. [API Routes Otimizadas](#api-routes-otimizadas)
2. [Custom Hooks com Cache](#custom-hooks-com-cache)
3. [Componentes Otimizados](#componentes-otimizados)
4. [Server Actions](#server-actions)
5. [Casos de Uso Específicos](#casos-de-uso-específicos)

---

## 1. API Routes Otimizadas

### Exemplo 1: Lista de Usuários com Filtros

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCachedOrFetch, CacheKeys } from '@/lib/simple-cache';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const isActive = searchParams.get('active') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Cache por filtros (5 minutos)
  const cacheKey = `admin:users:active:${isActive}:page:${page}:limit:${limit}`;

  const data = await getCachedOrFetch(
    cacheKey,
    async () => {
      // ✅ Queries paralelas
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: { isActive },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          // ✅ Select apenas campos necessários
          select: {
            id: true,
            clerkId: true,
            email: true,
            name: true,
            isActive: true,
            createdAt: true,
            // Contagens via aggregation
            _count: {
              select: {
                userPortfolios: true,
                analysisReports: true,
              },
            },
          },
        }),
        prisma.user.count({ where: { isActive } }),
      ]);

      return { users, total, page, limit };
    },
    300 // 5 minutos
  );

  return NextResponse.json(data);
}
```

### Exemplo 2: Detalhes de Portfolio com Análises

```typescript
// src/app/api/portfolios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCachedOrFetch, CacheKeys } from '@/lib/simple-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const portfolioId = params.id;

  // Cache de 5 minutos
  const data = await getCachedOrFetch(
    CacheKeys.portfolio(portfolioId),
    async () => {
      // ✅ Buscar portfolio com verificação de ownership
      const portfolio = await prisma.userPortfolio.findFirst({
        where: {
          id: portfolioId,
          user: { clerkId: clerkUserId },
        },
        select: {
          id: true,
          originalFileName: true,
          uploadedAt: true,
          totalValue: true,
          lastAnalyzedAt: true,
          positions: true, // JSON field - incluir aqui
          // ✅ Análises recentes (limitadas)
          analysisReports: {
            take: 5,
            orderBy: { generatedAt: 'desc' },
            select: {
              id: true,
              analysisType: true,
              summary: true,
              generatedAt: true,
              creditsUsed: true,
            },
          },
        },
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      return portfolio;
    },
    300 // 5 minutos
  );

  return NextResponse.json(data);
}

// ✅ Invalidar cache ao atualizar
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... atualizar portfolio

  // Invalidar caches relacionados
  memoryCache.delete(CacheKeys.portfolio(params.id));
  memoryCache.delete(CacheKeys.portfolioList(userId));

  return NextResponse.json({ success: true });
}
```

### Exemplo 3: Estatísticas do Admin

```typescript
// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCachedOrFetch } from '@/lib/simple-cache';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cache de 10 minutos (dados mudam lentamente)
  const stats = await getCachedOrFetch(
    'admin:stats:overview',
    async () => {
      // ✅ Todas as contagens em paralelo
      const [
        totalUsers,
        activeUsers,
        totalPortfolios,
        totalAnalyses,
        recentUsers,
        creditUsage,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.userPortfolio.count(),
        prisma.analysisReport.count(),
        // Usuários dos últimos 7 dias
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        // Total de créditos usados (últimos 30 dias)
        prisma.usageHistory.aggregate({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _sum: { creditsUsed: true },
        }),
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          recent: recentUsers,
        },
        portfolios: { total: totalPortfolios },
        analyses: { total: totalAnalyses },
        credits: {
          used30days: creditUsage._sum.creditsUsed || 0,
        },
      };
    },
    600 // 10 minutos
  );

  return NextResponse.json(stats);
}
```

---

## 2. Custom Hooks com Cache

### Exemplo 1: Hook de Portfolios

```typescript
// src/hooks/use-portfolios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface Portfolio {
  id: string;
  originalFileName: string;
  uploadedAt: Date;
  totalValue: number;
}

export function usePortfolios(userId: string) {
  return useQuery<Portfolio[]>({
    queryKey: ['portfolios', userId],
    queryFn: () => api.get(`/api/portfolios?userId=${userId}`),
    // ✅ Cache de 5 minutos (TanStack Query)
    staleTime: 5 * 60 * 1000,
    // ✅ Não refetch ao focar janela
    refetchOnWindowFocus: false,
  });
}

export function usePortfolio(portfolioId: string) {
  return useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => api.get(`/api/portfolios/${portfolioId}`),
    staleTime: 5 * 60 * 1000,
    // ✅ Só buscar se ID existir
    enabled: !!portfolioId,
  });
}

export function useUploadPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/api/portfolio/upload', formData),
    onSuccess: (data) => {
      // ✅ Invalidar lista de portfolios
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (portfolioId: string) =>
      api.delete(`/api/portfolios/${portfolioId}`),
    onSuccess: (_, portfolioId) => {
      // ✅ Invalidar múltiplos caches
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.removeQueries({ queryKey: ['portfolio', portfolioId] });
    },
  });
}
```

### Exemplo 2: Hook de Dashboard

```typescript
// src/hooks/use-dashboard.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  credits: {
    remaining: number;
    lastSynced: Date;
  };
  portfolios: Portfolio[];
  analyses: Analysis[];
  unreadNotifications: number;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard/stats'),
    // ✅ Cache de 2 minutos (dados atualizados)
    staleTime: 2 * 60 * 1000,
    // ✅ Refetch ao reconectar
    refetchOnReconnect: true,
  });
}

export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    // ✅ Invalidar cache do dashboard
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}
```

---

## 3. Componentes Otimizados

### Exemplo 1: Lista de Portfolios

```typescript
// src/components/portfolios/portfolio-list.tsx
'use client';

import { useMemo, useCallback, memo } from 'react';
import { usePortfolios } from '@/hooks/use-portfolios';

// ✅ Memoizar componente filho
const PortfolioCard = memo(({ portfolio, onSelect }: any) => {
  return (
    <div
      onClick={() => onSelect(portfolio.id)}
      className="p-4 border rounded cursor-pointer hover:bg-gray-50"
    >
      <h3 className="font-semibold">{portfolio.originalFileName}</h3>
      <p className="text-sm text-gray-600">
        R$ {portfolio.totalValue.toLocaleString('pt-BR')}
      </p>
      <p className="text-xs text-gray-400">
        {new Date(portfolio.uploadedAt).toLocaleDateString('pt-BR')}
      </p>
    </div>
  );
});
PortfolioCard.displayName = 'PortfolioCard';

export function PortfolioList({ userId }: { userId: string }) {
  const { data: portfolios, isLoading } = usePortfolios(userId);

  // ✅ Memoizar cálculo pesado
  const totalValue = useMemo(() => {
    return portfolios?.reduce((sum, p) => sum + p.totalValue, 0) || 0;
  }, [portfolios]);

  // ✅ Memoizar callback
  const handleSelect = useCallback((id: string) => {
    console.log('Selected:', id);
    // Navegação ou ação
  }, []);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!portfolios || portfolios.length === 0) {
    return <div>Nenhum portfolio encontrado</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-bold">
        Total: R$ {totalValue.toLocaleString('pt-BR')}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => (
          <PortfolioCard
            key={portfolio.id}
            portfolio={portfolio}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
```

### Exemplo 2: Dashboard com Suspense

```typescript
// src/components/dashboard/dashboard-content.tsx
'use client';

import { Suspense } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';

function DashboardStats() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Créditos"
        value={data.credits.remaining}
        icon="💰"
      />
      <StatCard
        title="Portfolios"
        value={data.portfolios.length}
        icon="📊"
      />
      <StatCard
        title="Análises"
        value={data.analyses.length}
        icon="📈"
      />
    </div>
  );
}

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats />
      </Suspense>
    </div>
  );
}
```

---

## 4. Server Actions

### Exemplo 1: Upload de Portfolio (Server Action)

```typescript
// src/app/actions/portfolio-actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { memoryCache, CacheKeys } from '@/lib/simple-cache';

export async function uploadPortfolio(formData: FormData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Processar upload...
  const portfolio = await prisma.userPortfolio.create({
    data: {
      userId: user.id,
      originalFileName: 'portfolio.csv',
      positions: [],
      totalValue: 0,
    },
  });

  // ✅ Invalidar caches
  memoryCache.delete(CacheKeys.portfolioList(user.id));
  memoryCache.delete(CacheKeys.user(user.id));

  // ✅ Revalidar paths do Next.js
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/portfolios');

  return { success: true, portfolioId: portfolio.id };
}
```

---

## 5. Casos de Uso Específicos

### Caso 1: Buscar FIIs em Múltiplos Portfolios

```typescript
// src/lib/queries/fii-queries.ts
import { prisma } from '@/lib/db';

export async function findUserPortfoliosWithFii(
  userId: string,
  fiiCode: string
) {
  // ✅ Query otimizada com operador JSONB
  return await prisma.$queryRaw<
    Array<{
      id: string;
      originalFileName: string;
      positions: any;
      uploadedAt: Date;
    }>
  >`
    SELECT id, "originalFileName", positions, "uploadedAt"
    FROM "UserPortfolio"
    WHERE "userId" = ${userId}
      AND positions::jsonb @> ${JSON.stringify([{ fiiCode }])}::jsonb
    ORDER BY "uploadedAt" DESC
    LIMIT 20;
  `;
}
```

### Caso 2: Relatório de Uso de Créditos

```typescript
// src/app/api/reports/credit-usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCachedOrFetch } from '@/lib/simple-cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const days = parseInt(searchParams.get('days') || '30', 10);

  const cacheKey = `credit-report:${userId}:${days}`;

  const report = await getCachedOrFetch(
    cacheKey,
    async () => {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // ✅ Aggregations em paralelo
      const [byType, byDay, total] = await Promise.all([
        // Por tipo de operação
        prisma.usageHistory.groupBy({
          by: ['operationType'],
          where: {
            userId,
            timestamp: { gte: startDate },
          },
          _sum: { creditsUsed: true },
          _count: { id: true },
        }),

        // Por dia
        prisma.$queryRaw<
          Array<{ date: Date; total: number }>
        >`
          SELECT
            DATE("timestamp") as date,
            SUM("creditsUsed")::integer as total
          FROM "UsageHistory"
          WHERE "userId" = ${userId}
            AND "timestamp" >= ${startDate}
          GROUP BY DATE("timestamp")
          ORDER BY date DESC
        `,

        // Total geral
        prisma.usageHistory.aggregate({
          where: {
            userId,
            timestamp: { gte: startDate },
          },
          _sum: { creditsUsed: true },
        }),
      ]);

      return {
        period: { days, start: startDate, end: new Date() },
        byType,
        byDay,
        total: total._sum.creditsUsed || 0,
      };
    },
    600 // 10 minutos
  );

  return NextResponse.json(report);
}
```

### Caso 3: Notificações Não Lidas

```typescript
// src/app/api/notifications/unread/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCachedOrFetch, CacheKeys } from '@/lib/simple-cache';

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  // Cache de 30 segundos (dados em tempo real)
  const unreadCount = await getCachedOrFetch(
    CacheKeys.unreadCount(userId),
    () =>
      prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      }),
    30 // 30 segundos apenas
  );

  return NextResponse.json({ unread: unreadCount });
}

// ✅ Marcar como lida e invalidar cache
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const { notificationId } = await request.json();

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });

  // Invalidar cache
  memoryCache.delete(CacheKeys.unreadCount(userId));

  return NextResponse.json({ success: true });
}
```

---

## 🎯 Melhores Práticas Resumidas

### ✅ DOs

1. **Use Cache para dados estáveis** (> 2 minutos)
2. **Queries paralelas** com `Promise.all()`
3. **Select específico** em vez de buscar tudo
4. **Invalidar cache** após mutations
5. **Memoizar componentes** pesados
6. **Use DB helpers** quando disponível

### ❌ DON'Ts

1. **Não cache dados em tempo real** (< 30s)
2. **Não esqueça de invalidar** cache
3. **Não busque campos desnecessários**
4. **Não faça queries sequenciais** quando podem ser paralelas
5. **Não ignore slow query warnings**

---

**Ver também:**
- [Quick Start Guide](./QUICK_START_PERFORMANCE.md)
- [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md)
- [Implementação PLAN-006](../IMPLEMENTACAO_PLAN_006.md)
