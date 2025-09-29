import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar apenas carteiras ativas para usuários normais
    const portfolios = await db.recommendedPortfolio.findMany({
      where: {
        isActive: true
      },
      include: {
        funds: {
          orderBy: { ticker: 'asc' }
        },
        _count: {
          select: { funds: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert Decimal to number for JSON serialization
    const serializedPortfolios = portfolios.map(portfolio => ({
      ...portfolio,
      funds: portfolio.funds.map(fund => ({
        ...fund,
        currentPrice: Number(fund.currentPrice),
        averagePrice: Number(fund.averagePrice),
        ceilingPrice: Number(fund.ceilingPrice),
        allocation: Number(fund.allocation)
      }))
    }));

    return NextResponse.json(serializedPortfolios);
  } catch (error) {
    console.error('Error fetching recommended portfolios:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
