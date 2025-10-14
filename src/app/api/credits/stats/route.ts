import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCachedOrFetch, CacheKeys } from '@/lib/simple-cache';
import { getCreditUsageStats } from '@/lib/db-helpers';

/**
 * API otimizada para estatísticas de créditos
 * PLAN-006 - Queries otimizadas + Cache
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Query params para customizar período
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    // ✅ Queries paralelas com cache de 5 minutos
    const [balance, stats] = await Promise.all([
      getCachedOrFetch(
        CacheKeys.userCredits(clerkUserId),
        () =>
          prisma.creditBalance.findUnique({
            where: { clerkUserId },
            select: {
              creditsRemaining: true,
              lastSyncedAt: true,
            },
          }),
        300 // 5 minutos
      ),
      getCachedOrFetch(
        CacheKeys.creditStats(user.id, days),
        () => getCreditUsageStats(user.id, days),
        300 // 5 minutos
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        balance: balance?.creditsRemaining || 0,
        lastSynced: balance?.lastSyncedAt,
        stats,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error('Error fetching credit stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
