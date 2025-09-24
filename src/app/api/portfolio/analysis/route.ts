import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { analyzeFIIPortfolio, type PortfolioData, type FIIAnalysisResult } from '@/lib/openai';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { portfolioId } = await request.json();

    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
    }

    // Get the portfolio
    const portfolio = await prisma.userPortfolio.findUnique({
      where: { id: portfolioId }
    });

    if (!portfolio || portfolio.userId !== userId) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Extract positions from JSON field
    const positions = Array.isArray(portfolio.positions) ? portfolio.positions : [];
    
    if (positions.length === 0) {
      return NextResponse.json({ 
        error: 'No positions found in portfolio' 
      }, { status: 400 });
    }

    // Calculate total value and percentages
    const totalValue = portfolio.totalValue;
    
    const portfolioData: PortfolioData = {
      positions: positions.map((pos: any) => ({
        fiiCode: pos.fiiCode,
        quantity: pos.quantity,
        avgPrice: pos.avgPrice,
        currentValue: pos.currentValue,
        percentage: (pos.currentValue / totalValue) * 100
      })),
      totalValue
    };

    // Analyze portfolio using OpenAI
    const analysis: FIIAnalysisResult = await analyzeFIIPortfolio(portfolioData);

    // Save analysis to database
    const analysisReport = await prisma.analysisReport.create({
      data: {
        userId,
        userPortfolioId: portfolioId,
        analysisType: 'PORTFOLIO_EVALUATION',
        summary: analysis.summary,
        currentAllocation: analysis.sectorAnalysis.distribution,
        riskAssessment: {
          overallScore: analysis.overallScore,
          riskLevel: analysis.riskLevel,
          diversificationScore: analysis.diversificationScore,
          concentrationRisk: analysis.concentrationRisk
        },
        performanceMetrics: analysis.performanceAnalysis,
        recommendations: analysis.recommendations,
        creditsUsed: 15
      }
    });

    return NextResponse.json({
      success: true,
      analysis,
      reportId: analysisReport.id
    });

  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to analyze portfolio' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
    }

    // Verify portfolio ownership
    const portfolio = await prisma.userPortfolio.findUnique({
      where: { id: portfolioId }
    });

    if (!portfolio || portfolio.userId !== userId) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Get latest analysis report
    const latestReport = await prisma.analysisReport.findFirst({
      where: { userPortfolioId: portfolioId },
      orderBy: { generatedAt: 'desc' }
    });

    if (!latestReport) {
      return NextResponse.json({ 
        error: 'No analysis found for this portfolio' 
      }, { status: 404 });
    }

    // Reconstruct analysis from stored data
    const analysis: FIIAnalysisResult = {
      overallScore: (latestReport.riskAssessment as any).overallScore,
      riskLevel: (latestReport.riskAssessment as any).riskLevel,
      diversificationScore: (latestReport.riskAssessment as any).diversificationScore,
      concentrationRisk: (latestReport.riskAssessment as any).concentrationRisk,
      sectorAnalysis: {
        distribution: latestReport.currentAllocation as Record<string, number>,
        recommendations: latestReport.recommendations as string[]
      },
      performanceAnalysis: latestReport.performanceMetrics as any,
      recommendations: latestReport.recommendations as string[],
      summary: latestReport.summary
    };

    return NextResponse.json({
      success: true,
      analysis,
      reportId: latestReport.id,
      createdAt: latestReport.generatedAt
    });

  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}