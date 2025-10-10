import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { updatePortfolioSchema } from '@/lib/validations/carteiras';

interface RouteContext {
  params: Promise<{ id: string }>;
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

    const { id } = await params;
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id },
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
    console.error('Error fetching portfolio:', error);
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

    const { id } = await params;
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id }
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updatePortfolioSchema.parse(body);

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== portfolio.name) {
      const existingPortfolio = await db.recommendedPortfolio.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id }
        }
      });

      if (existingPortfolio) {
        return NextResponse.json(
          { error: 'Já existe uma carteira com este nome' },
          { status: 400 }
        );
      }
    }

    const updatedPortfolio = await db.recommendedPortfolio.update({
      where: { id },
      data: validatedData,
      include: {
        funds: {
          orderBy: { ticker: 'asc' }
        },
        _count: {
          select: { funds: true }
        }
      }
    });

    // Convert Decimal to number for JSON serialization
    const serializedPortfolio = {
      ...updatedPortfolio,
      funds: updatedPortfolio.funds.map(fund => ({
        ...fund,
        currentPrice: Number(fund.currentPrice),
        averagePrice: Number(fund.averagePrice),
        ceilingPrice: Number(fund.ceilingPrice),
        allocation: Number(fund.allocation)
      }))
    };

    return NextResponse.json(serializedPortfolio);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating portfolio:', error);
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

    const { id } = await params;
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id }
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Delete portfolio (cascade will delete associated funds)
    await db.recommendedPortfolio.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}