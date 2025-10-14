import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCachedOrFetch, CacheKeys, memoryCache } from '@/lib/simple-cache';
import { getDashboardData } from '@/lib/db-helpers';

/**
 * API otimizada para dados do dashboard
 * PLAN-006 - Queries paralelas + Cache in-memory
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar usuário do banco
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cache de 2 minutos para dados do dashboard
    const dashboardData = await getCachedOrFetch(
      CacheKeys.user(user.id),
      () => getDashboardData(user.id, clerkUserId),
      120 // 2 minutos
    );

    return NextResponse.json({
      success: true,
      data: dashboardData,
      cached: memoryCache.has(CacheKeys.user(user.id)),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint para invalidar cache do dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Invalidar cache
    memoryCache.delete(CacheKeys.user(user.id));
    memoryCache.delete(CacheKeys.portfolioList(user.id));
    memoryCache.delete(CacheKeys.analysisList(user.id));

    return NextResponse.json({
      success: true,
      message: 'Cache invalidated',
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
