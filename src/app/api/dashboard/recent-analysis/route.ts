import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    // Get recent analysis reports
    const analyses = await db.analysisReport.findMany({
      where: { userId: internalUser.id },
      orderBy: { generatedAt: 'desc' },
      take: 5, // Get last 5 analyses
      include: {
        userPortfolio: {
          select: {
            originalFileName: true
          }
        }
      }
    });

    if (analyses.length === 0) {
      return NextResponse.json({
        hasAnalysis: false,
        analyses: []
      });
    }

    const analysisData = analyses.map(analysis => {
      let score = null;
      let riskLevel = null;

      // Extract score and risk level from riskAssessment JSON
      if (analysis.riskAssessment) {
        const riskData = analysis.riskAssessment as any;
        score = riskData.overallScore;
        riskLevel = riskData.riskLevel;
      }

      return {
        id: analysis.id,
        type: analysis.analysisType,
        createdAt: analysis.generatedAt.toISOString(),
        summary: analysis.summary || 'Análise realizada com sucesso',
        score,
        riskLevel,
        portfolioName: analysis.userPortfolio?.originalFileName
      };
    });

    return NextResponse.json({
      hasAnalysis: true,
      analyses: analysisData
    });

  } catch (error) {
    console.error('Error fetching recent analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent analysis' },
      { status: 500 }
    );
  }
}