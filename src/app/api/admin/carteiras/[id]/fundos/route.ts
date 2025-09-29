import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { createFundSchema, calculateTotalAllocation } from '@/lib/validations/carteiras';
import { validatePortfolioAllocation, validateUniqueTickerInPortfolio, validatePriceRelationships } from '@/lib/validations/business-rules';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify portfolio exists
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: params.id }
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const funds = await db.recommendedFund.findMany({
      where: { portfolioId: params.id },
      orderBy: { ticker: 'asc' }
    });

    // Convert Decimal to number for JSON serialization
    const serializedFunds = funds.map(fund => ({
      ...fund,
      currentPrice: Number(fund.currentPrice),
      averagePrice: Number(fund.averagePrice),
      ceilingPrice: Number(fund.ceilingPrice),
      allocation: Number(fund.allocation)
    }));

    return NextResponse.json(serializedFunds);
  } catch (error) {
    console.error('Error fetching funds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify portfolio exists
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: params.id }
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createFundSchema.parse(body);

    // Validate ticker uniqueness
    const tickerValidation = await validateUniqueTickerInPortfolio(
      params.id,
      validatedData.ticker
    );

    if (!tickerValidation.isValid) {
      return NextResponse.json(
        { error: tickerValidation.errorMessage },
        { status: 400 }
      );
    }

    // Validate allocation limits
    const allocationValidation = await validatePortfolioAllocation(
      params.id,
      validatedData.allocation
    );

    if (!allocationValidation.isValid) {
      return NextResponse.json(
        { error: allocationValidation.errorMessage },
        { status: 400 }
      );
    }

    // Validate price relationships
    const priceValidation = validatePriceRelationships(
      validatedData.currentPrice,
      validatedData.averagePrice,
      validatedData.ceilingPrice
    );

    if (!priceValidation.isValid) {
      return NextResponse.json(
        { error: priceValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    const fund = await db.recommendedFund.create({
      data: {
        ...validatedData,
        portfolioId: params.id,
      }
    });

    // Convert Decimal to number for JSON serialization
    const serializedFund = {
      ...fund,
      currentPrice: Number(fund.currentPrice),
      averagePrice: Number(fund.averagePrice),
      ceilingPrice: Number(fund.ceilingPrice),
      allocation: Number(fund.allocation)
    };

    return NextResponse.json(serializedFund, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating fund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}