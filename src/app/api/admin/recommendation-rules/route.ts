import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRulesService } from '@/lib/services/recommendation-rules.service';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { isAdmin } from '@/lib/admin-utils';
import { db } from '@/lib/db';

const rulesService = new RecommendationRulesService();

// GET /api/admin/recommendation-rules - List all rulesets
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rulesets = await db.recommendationRuleSet.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rulesets);
  } catch (error) {
    console.error('Error fetching rulesets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rulesets' },
      { status: 500 }
    );
  }
}

// POST /api/admin/recommendation-rules - Create new ruleset
export async function POST(request: NextRequest) {
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

    const ruleset = await rulesService.createRuleSet(body, user.id);

    return NextResponse.json(ruleset, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to create ruleset', details: error.message },
      { status: 400 }
    );
  }
}