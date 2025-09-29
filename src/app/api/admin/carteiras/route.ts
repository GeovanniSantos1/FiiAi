import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { createPortfolioSchema } from '@/lib/validations/carteiras';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, allowing any authenticated user - in production you might want admin check
    // if (!user.isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const portfolios = await db.recommendedPortfolio.findMany({
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
    console.error('Error fetching portfolios:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, allowing any authenticated user - in production you might want admin check
    // if (!user.isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const body = await request.json();
    const validatedData = createPortfolioSchema.parse(body);

    // Check for duplicate portfolio name
    const existingPortfolio = await db.recommendedPortfolio.findFirst({
      where: {
        name: validatedData.name
      }
    });

    if (existingPortfolio) {
      return NextResponse.json(
        { error: 'Já existe uma carteira com este nome' },
        { status: 400 }
      );
    }

    const portfolio = await db.recommendedPortfolio.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
      include: {
        funds: true,
        _count: {
          select: { funds: true }
        }
      }
    });

    return NextResponse.json(portfolio, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating portfolio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}