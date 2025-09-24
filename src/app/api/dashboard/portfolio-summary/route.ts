import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

const SECTOR_COLORS = {
  'Logístico': '#0088FE',
  'Corporativo': '#00C49F', 
  'Shopping': '#FFBB28',
  'Residencial': '#FF8042',
  'Papel': '#8884D8',
  'Fundos': '#82CA9D',
  'Outros': '#FFC658'
};

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

    // Get user's latest portfolio
    const userPortfolio = await db.userPortfolio.findFirst({
      where: { userId: internalUser.id },
      orderBy: { uploadedAt: 'desc' }
    });

    if (!userPortfolio || !userPortfolio.positions) {
      return NextResponse.json({
        hasPortfolio: false,
        totalValue: 0,
        totalPositions: 0,
        sectorDistribution: [],
        topPositions: []
      });
    }

    const positions = Array.isArray(userPortfolio.positions) ? userPortfolio.positions : [];
    
    // Calculate sector distribution
    const sectorMap = new Map<string, number>();
    
    positions.forEach((pos: any) => {
      const sector = pos.sector || 'Outros';
      const currentValue = pos.currentValue || 0;
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + currentValue);
    });

    const sectorDistribution = Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value,
      percentage: (value / userPortfolio.totalValue) * 100,
      color: SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS] || '#666666'
    })).sort((a, b) => b.value - a.value);

    // Get top positions
    const topPositions = positions
      .map((pos: any) => ({
        fiiCode: pos.fiiCode,
        fiiName: pos.fiiName || pos.fiiCode,
        value: pos.currentValue || 0,
        percentage: ((pos.currentValue || 0) / userPortfolio.totalValue) * 100,
        trend: 'neutral' as const // Could be enhanced with price comparison
      }))
      .sort((a, b) => b.value - a.value);

    // Get latest analysis if available
    const latestAnalysis = await db.analysisReport.findFirst({
      where: { 
        userId: internalUser.id,
        analysisType: 'PORTFOLIO_EVALUATION'
      },
      orderBy: { generatedAt: 'desc' },
      select: {
        riskAssessment: true,
        generatedAt: true
      }
    });

    let recentAnalysis = null;
    if (latestAnalysis && latestAnalysis.riskAssessment) {
      const riskData = latestAnalysis.riskAssessment as any;
      recentAnalysis = {
        overallScore: riskData.overallScore || 0,
        riskLevel: riskData.riskLevel || 'MODERADO',
        createdAt: latestAnalysis.generatedAt.toISOString()
      };
    }

    return NextResponse.json({
      hasPortfolio: true,
      totalValue: userPortfolio.totalValue,
      totalPositions: positions.length,
      lastUpdated: userPortfolio.uploadedAt.toISOString(),
      sectorDistribution,
      topPositions,
      recentAnalysis
    });

  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio summary' },
      { status: 500 }
    );
  }
}