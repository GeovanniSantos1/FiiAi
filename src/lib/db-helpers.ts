import { prisma } from './db';
import { Prisma } from '../../prisma/generated/client';

/**
 * Helpers para queries JSON otimizadas
 * Usa operadores JSONB do PostgreSQL para melhor performance
 */

/**
 * Buscar portfolios que contêm um FII específico
 * Usa operador JSONB @> para performance
 */
export async function findPortfoliosWithFii(userId: string, fiiCode: string) {
  // Query otimizada com JSONB operator
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

/**
 * Buscar análises com recomendações específicas
 */
export async function findAnalysesWithRecommendation(
  userId: string,
  recommendationType: string
) {
  return await prisma.$queryRaw<
    Array<{
      id: string;
      analysisType: string;
      recommendations: any;
      generatedAt: Date;
    }>
  >`
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

/**
 * Buscar últimos N portfolios de um usuário com select otimizado
 */
export async function getRecentPortfolios(userId: string, limit: number = 10) {
  return await prisma.userPortfolio.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      originalFileName: true,
      uploadedAt: true,
      totalValue: true,
      lastAnalyzedAt: true,
      // positions não incluído - economiza banda
    },
  });
}

/**
 * Buscar análises recentes com recomendações (otimizado)
 */
export async function getRecentAnalysesWithRecommendations(
  userId: string,
  limit: number = 5
) {
  return await prisma.analysisReport.findMany({
    where: { userId },
    orderBy: { generatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      analysisType: true,
      generatedAt: true,
      creditsUsed: true,
      summary: true,
      investmentRecommendations: {
        take: 5,
        orderBy: { priority: 'asc' },
        select: {
          id: true,
          fiiCode: true,
          fiiName: true,
          recommendation: true,
          confidence: true,
          priority: true,
        },
      },
    },
  });
}

/**
 * Contar notificações não lidas (otimizado)
 */
export async function countUnreadNotifications(userId: string) {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Buscar dados do dashboard em paralelo (otimizado)
 */
export async function getDashboardData(userId: string, clerkUserId: string) {
  const [user, credits, portfolios, analyses, unreadNotifications] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      }),
      prisma.creditBalance.findUnique({
        where: { clerkUserId },
        select: {
          creditsRemaining: true,
          lastSyncedAt: true,
        },
      }),
      getRecentPortfolios(userId, 10),
      getRecentAnalysesWithRecommendations(userId, 5),
      countUnreadNotifications(userId),
    ]);

  return {
    user,
    credits,
    portfolios,
    analyses,
    unreadNotifications,
  };
}

/**
 * Buscar fundos recomendados com filtros (otimizado)
 */
export async function getRecommendedFunds(
  portfolioId: string,
  recommendation?: string
) {
  return await prisma.recommendedFund.findMany({
    where: {
      portfolioId,
      ...(recommendation && { recommendation: recommendation as any }),
    },
    orderBy: {
      allocation: 'desc',
    },
    select: {
      id: true,
      ticker: true,
      name: true,
      segment: true,
      currentPrice: true,
      allocation: true,
      recommendation: true,
    },
  });
}

/**
 * Buscar histórico de aportes (otimizado)
 */
export async function getAporteHistory(userId: string, limit: number = 10) {
  return await prisma.aporteRecomendacao.findMany({
    where: { userId },
    orderBy: { criadoEm: 'desc' },
    take: limit,
    select: {
      id: true,
      valorDisponivel: true,
      criadoEm: true,
      userPortfolioId: true,
      recomendacao: true,
      portfolio: {
        select: {
          originalFileName: true,
        },
      },
    },
  });
}

/**
 * Buscar estatísticas de uso de créditos (otimizado)
 */
export async function getCreditUsageStats(userId: string, days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [byType, totalUsage] = await Promise.all([
    getCreditUsageByType(userId, days),
    prisma.usageHistory.aggregate({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      _sum: {
        creditsUsed: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  return {
    byType,
    total: totalUsage._sum.creditsUsed || 0,
    operations: totalUsage._count.id,
  };
}
