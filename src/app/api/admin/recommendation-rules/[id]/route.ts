import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRulesService } from '@/lib/services/recommendation-rules.service';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { isAdmin } from '@/lib/admin-utils';

const rulesService = new RecommendationRulesService();

// GET /api/admin/recommendation-rules/[id] - Get specific ruleset
export async function GET(
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

    const ruleset = await rulesService.getRuleSetById(params.id);

    if (!ruleset) {
      return NextResponse.json({ error: 'Ruleset not found' }, { status: 404 });
    }

    return NextResponse.json(ruleset);
  } catch (error) {
    console.error('Error fetching ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ruleset' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/recommendation-rules/[id] - Update ruleset
export async function PUT(
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
    const { changesSummary, ...updates } = body;

    const ruleset = await rulesService.updateRuleSet(
      params.id,
      updates,
      changesSummary || 'Atualização manual',
      user.id
    );

    return NextResponse.json(ruleset);
  } catch (error: any) {
    console.error('Error updating ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to update ruleset', details: error.message },
      { status: 400 }
    );
  }
}

// DELETE /api/admin/recommendation-rules/[id] - Delete ruleset
export async function DELETE(
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

    await rulesService.deleteRuleSet(params.id);

    return NextResponse.json({ message: 'Ruleset deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to delete ruleset', details: error.message },
      { status: 400 }
    );
  }
}