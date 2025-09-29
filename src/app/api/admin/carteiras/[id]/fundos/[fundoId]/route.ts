import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { updateFundSchema, calculateTotalAllocation } from '@/lib/validations/carteiras';

interface RouteContext {
  params: { id: string; fundoId: string };
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

    const fund = await db.recommendedFund.findUnique({
      where: {
        id: params.fundoId,
        portfolioId: params.id
      },
      include: {
        portfolio: true
      }
    });

    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
    }

    // Convert Decimal to number for JSON serialization
    const serializedFund = {
      ...fund,
      currentPrice: Number(fund.currentPrice),
      averagePrice: Number(fund.averagePrice),
      ceilingPrice: Number(fund.ceilingPrice),
      allocation: Number(fund.allocation)
    };

    return NextResponse.json(serializedFund);
  } catch (error) {
    console.error('Error fetching fund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const fund = await db.recommendedFund.findUnique({
      where: {
        id: params.fundoId,
        portfolioId: params.id
      }
    });

    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateFundSchema.parse(body);

    // Check for duplicate ticker if ticker is being updated
    if (validatedData.ticker && validatedData.ticker !== fund.ticker) {
      const existingFund = await db.recommendedFund.findFirst({
        where: {
          portfolioId: params.id,
          ticker: validatedData.ticker,
          id: { not: params.fundoId }
        }
      });

      if (existingFund) {
        return NextResponse.json(
          { error: 'Este ticker já existe nesta carteira' },
          { status: 400 }
        );
      }
    }

    // Check total allocation limit if allocation is being updated
    if (validatedData.allocation !== undefined) {
      const allFunds = await db.recommendedFund.findMany({
        where: {
          portfolioId: params.id,
          id: { not: params.fundoId }
        }
      });

      const otherFundsAllocation = calculateTotalAllocation(
        allFunds.map(f => ({ allocation: Number(f.allocation) }))
      );

      if (otherFundsAllocation + validatedData.allocation > 100) {
        return NextResponse.json(
          {
            error: `Alocação total excederia 100%. Alocação dos outros fundos: ${otherFundsAllocation.toFixed(2)}%`
          },
          { status: 400 }
        );
      }
    }

    const updatedFund = await db.recommendedFund.update({
      where: { id: params.fundoId },
      data: validatedData
    });

    // Convert Decimal to number for JSON serialization
    const serializedFund = {
      ...updatedFund,
      currentPrice: Number(updatedFund.currentPrice),
      averagePrice: Number(updatedFund.averagePrice),
      ceilingPrice: Number(updatedFund.ceilingPrice),
      allocation: Number(updatedFund.allocation)
    };

    return NextResponse.json(serializedFund);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating fund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const fund = await db.recommendedFund.findUnique({
      where: {
        id: params.fundoId,
        portfolioId: params.id
      }
    });

    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
    }

    await db.recommendedFund.delete({
      where: { id: params.fundoId }
    });

    return NextResponse.json({ message: 'Fund deleted successfully' });
  } catch (error) {
    console.error('Error deleting fund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}