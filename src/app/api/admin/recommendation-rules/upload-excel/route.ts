import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRulesService } from '@/lib/services/recommendation-rules.service';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { isAdmin } from '@/lib/admin-utils';

const rulesService = new RecommendationRulesService();

// POST /api/admin/recommendation-rules/upload-excel - Upload Excel file
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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file || !name) {
      return NextResponse.json(
        { error: 'File and name are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ruleset = await rulesService.createRuleSetFromExcel(
      buffer,
      file.name,
      name,
      user.id
    );

    return NextResponse.json(ruleset, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading Excel:', error);
    return NextResponse.json(
      { error: 'Failed to process Excel file', details: error.message },
      { status: 400 }
    );
  }
}