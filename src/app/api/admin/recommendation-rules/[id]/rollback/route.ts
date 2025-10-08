import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRulesService } from '@/lib/services/recommendation-rules.service';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { isAdmin } from '@/lib/admin-utils';

const rulesService = new RecommendationRulesService();

// POST /api/admin/recommendation-rules/[id]/rollback - Rollback to version
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

    const user = await getUserFromClerkId(userId);
    const body = await request.json();
    const { version } = body;

    if (!version || typeof version !== 'number') {
      return NextResponse.json(
        { error: 'Version number is required' },
        { status: 400 }
      );
    }

    const ruleset = await rulesService.rollbackToVersion(params.id, version, user.id);

    return NextResponse.json(ruleset);
  } catch (error: any) {
    console.error('Error rolling back ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to rollback ruleset', details: error.message },
      { status: 400 }
    );
  }
}