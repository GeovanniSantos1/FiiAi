import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRulesService } from '@/lib/services/recommendation-rules.service';
import { isAdmin } from '@/lib/admin-utils';

const rulesService = new RecommendationRulesService();

// GET /api/admin/recommendation-rules/active - Get active ruleset
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activeRuleSet = await rulesService.getActiveRuleSet();

    if (!activeRuleSet) {
      return NextResponse.json({ error: 'No active ruleset found' }, { status: 404 });
    }

    return NextResponse.json(activeRuleSet);
  } catch (error) {
    console.error('Error fetching active ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active ruleset' },
      { status: 500 }
    );
  }
}