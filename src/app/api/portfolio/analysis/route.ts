import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { analyzeFIIPortfolio, type PortfolioData, type FIIAnalysisResult } from '@/lib/openai';
import { NotificationService } from '@/lib/notification-service';

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

    // Find the internal user by Clerk ID
    const internalUser = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!internalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the portfolio
    const portfolio = await db.userPortfolio.findUnique({
      where: { id: portfolioId }
    });

    if (!portfolio || portfolio.userId !== internalUser.id) {
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
    const analysisReport = await db.analysisReport.create({
      data: {
        userId: internalUser.id,
        userPortfolioId: portfolioId,
        analysisType: 'PORTFOLIO_EVALUATION',
        summary: analysis.summary,
        currentAllocation: {
          distribution: analysis.sectorAnalysis.distribution,
          sectorRecommendations: analysis.sectorAnalysis.recommendations
        },
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

    // Create notification for completed analysis
    try {
      await NotificationService.notifyAnalysisComplete(
        internalUser.id,
        'PORTFOLIO_EVALUATION',
        portfolio.originalFileName
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Continue without failing the main request
    }

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

    // Find the internal user by Clerk ID
    const internalUser = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!internalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify portfolio ownership
    const portfolio = await db.userPortfolio.findUnique({
      where: { id: portfolioId }
    });

    if (!portfolio || portfolio.userId !== internalUser.id) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Get latest analysis report
    const latestReport = await db.analysisReport.findFirst({
      where: { userPortfolioId: portfolioId },
      orderBy: { generatedAt: 'desc' }
    });

    if (!latestReport) {
      return NextResponse.json({ 
        error: 'No analysis found for this portfolio' 
      }, { status: 404 });
    }

    // Reconstruct analysis from stored data
    const currentAllocation = latestReport.currentAllocation as any;
    const analysis: FIIAnalysisResult = {
      overallScore: (latestReport.riskAssessment as any).overallScore,
      riskLevel: (latestReport.riskAssessment as any).riskLevel,
      diversificationScore: (latestReport.riskAssessment as any).diversificationScore,
      concentrationRisk: (latestReport.riskAssessment as any).concentrationRisk,
      sectorAnalysis: {
        distribution: currentAllocation.distribution || currentAllocation,
        recommendations: currentAllocation.sectorRecommendations || []
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