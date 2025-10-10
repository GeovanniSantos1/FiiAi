import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';

/**
 * Endpoint de debug para verificar o conteúdo do portfolio
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);

    // Buscar todos os portfolios do usuário
    const portfolios = await db.userPortfolio.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        originalFileName: true,
        positions: true,
        totalValue: true,
        uploadedAt: true,
      },
    });

    // Buscar carteira ideal
    const recommendedPortfolio = await db.recommendedPortfolio.findFirst({
      where: { isActive: true },
      include: {
        funds: {
          select: {
            ticker: true,
            name: true,
            segment: true,
            allocation: true,
            currentPrice: true,
            ceilingPrice: true,
          },
        },
      },
    });

    return NextResponse.json({
      userPortfolios: portfolios.map(p => ({
        id: p.id,
        fileName: p.originalFileName,
        uploadedAt: p.uploadedAt,
        totalValue: p.totalValue,
        positionsCount: Array.isArray(p.positions) ? p.positions.length : 0,
        positions: p.positions,
      })),
      recommendedPortfolio: recommendedPortfolio ? {
        id: recommendedPortfolio.id,
        name: recommendedPortfolio.name,
        isActive: recommendedPortfolio.isActive,
        fundsCount: recommendedPortfolio.funds.length,
        funds: recommendedPortfolio.funds.map(f => ({
          ticker: f.ticker,
          name: f.name,
          segment: f.segment,
          allocation: Number(f.allocation),
          currentPrice: Number(f.currentPrice),
          ceilingPrice: Number(f.ceilingPrice),
        })),
      } : null,
    });

  } catch (error: any) {
    console.error('Erro no debug:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: error.message },
      { status: 500 }
    );
  }
}
