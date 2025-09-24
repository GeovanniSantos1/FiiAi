import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { generateInvestmentRecommendations, type PortfolioData } from '@/lib/openai';

interface InvestmentRequest {
  investmentAmount: number;
  preferences?: string;
  riskTolerance?: 'CONSERVADOR' | 'MODERADO' | 'ARROJADO';
  investmentGoal?: 'RENDA' | 'CRESCIMENTO' | 'BALANCEADO';
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the internal user by Clerk ID
    const internalUser = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!internalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { investmentAmount, preferences, riskTolerance, investmentGoal }: InvestmentRequest = await request.json();

    if (!investmentAmount || investmentAmount <= 0) {
      return NextResponse.json({ error: 'Investment amount is required and must be positive' }, { status: 400 });
    }

    // Get user's current portfolio (latest one)
    const userPortfolio = await db.userPortfolio.findFirst({
      where: { userId: internalUser.id },
      orderBy: { uploadedAt: 'desc' }
    });

    let portfolioData: PortfolioData;

    if (userPortfolio && userPortfolio.positions) {
      // User has existing portfolio - use it for analysis
      const positions = Array.isArray(userPortfolio.positions) ? userPortfolio.positions : [];
      
      portfolioData = {
        positions: positions.map((pos: any) => ({
          fiiCode: pos.fiiCode,
          quantity: pos.quantity,
          avgPrice: pos.avgPrice,
          currentValue: pos.currentValue,
          percentage: (pos.currentValue / userPortfolio.totalValue) * 100
        })),
        totalValue: userPortfolio.totalValue
      };
    } else {
      // No existing portfolio - create empty one for new investor
      portfolioData = {
        positions: [],
        totalValue: 0
      };
    }

    // Check user credits before proceeding
    const creditBalance = await db.creditBalance.findUnique({
      where: { userId: internalUser.id }
    });

    const requiredCredits = 8;
    if (!creditBalance || creditBalance.creditsRemaining < requiredCredits) {
      return NextResponse.json({ 
        error: `Créditos insuficientes. Você precisa de ${requiredCredits} créditos para esta análise.` 
      }, { status: 402 });
    }

    // Create user profile from request data and preferences
    const userProfile = {
      investmentGoal: investmentGoal || 'BALANCEADO',
      riskTolerance: riskTolerance || 'MODERADO', 
      monthlyInvestment: investmentAmount,
      preferences: preferences || '' // Add preferences to profile
    };

    // Generate investment recommendations using OpenAI
    const recommendations = await generateInvestmentRecommendations(portfolioData, userProfile);

    // Deduct credits after successful generation
    await db.creditBalance.update({
      where: { userId: internalUser.id },
      data: {
        creditsRemaining: {
          decrement: requiredCredits
        }
      }
    });

    // Log usage history
    await db.usageHistory.create({
      data: {
        userId: internalUser.id,
        creditBalanceId: creditBalance.id,
        operationType: 'AI_TEXT_CHAT',
        creditsUsed: requiredCredits
      }
    });

    // Save investment consultation to database for future reference
    const consultation = await db.analysisReport.create({
      data: {
        userId: internalUser.id,
        userPortfolioId: userPortfolio?.id || null,
        analysisType: 'INVESTMENT_RECOMMENDATION',
        summary: recommendations.strategy,
        currentAllocation: {
          investmentAmount,
          preferences: preferences || '',
          userProfile
        },
        riskAssessment: {
          overallScore: 0, // Not applicable for investment recommendations
          riskLevel: riskTolerance || 'MODERADO',
          diversificationScore: 0,
          concentrationRisk: 0
        },
        performanceMetrics: {
          expectedYield: recommendations.expectedYield,
          recommendations: recommendations.recommendations
        },
        recommendations: recommendations.recommendations.map(rec => `${rec.fiiCode}: ${rec.reason}`),
        creditsUsed: requiredCredits
      }
    });

    return NextResponse.json({
      success: true,
      investmentAmount,
      recommendations: recommendations.recommendations,
      strategy: recommendations.strategy,
      expectedYield: recommendations.expectedYield,
      consultationId: consultation.id,
      hasExistingPortfolio: !!userPortfolio
    });

  } catch (error) {
    console.error('Error generating investment recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate investment recommendations' },
      { status: 500 }
    );
  }
}