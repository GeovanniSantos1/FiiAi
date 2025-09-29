import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar carteira específica (apenas se estiver ativa)
    const portfolio = await db.recommendedPortfolio.findFirst({
      where: { 
        id: params.id,
        isActive: true // Apenas carteiras ativas para usuários normais
      },
      include: {
        funds: {
          orderBy: { ticker: 'asc' }
        },
        _count: {
          select: { funds: true }
        }
      }
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Convert Decimal to number for JSON serialization
    const serializedPortfolio = {
      ...portfolio,
      funds: portfolio.funds.map(fund => ({
        ...fund,
        currentPrice: Number(fund.currentPrice),
        averagePrice: Number(fund.averagePrice),
        ceilingPrice: Number(fund.ceilingPrice),
        allocation: Number(fund.allocation)
      }))
    };

    return NextResponse.json(serializedPortfolio);
  } catch (error) {
    console.error('Error fetching recommended portfolio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
