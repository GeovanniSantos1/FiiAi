import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRulesService } from '@/lib/services/recommendation-rules.service';
import { isAdmin } from '@/lib/admin-utils';

const rulesService = new RecommendationRulesService();

// POST /api/admin/recommendation-rules/[id]/activate - Activate ruleset
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await rulesService.activateRuleSet(params.id);

    return NextResponse.json({ message: 'Ruleset activated successfully' });
  } catch (error) {
    console.error('Error activating ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to activate ruleset' },
      { status: 500 }
    );
  }
}