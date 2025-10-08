import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRulesService } from '@/lib/services/recommendation-rules.service';
import { isAdmin } from '@/lib/admin-utils';

const rulesService = new RecommendationRulesService();

// GET /api/admin/recommendation-rules/download-template - Download Excel template
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return new Response('Forbidden', { status: 403 });
    }

    const buffer = await rulesService.generateExcelTemplate();

    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-regras-recomendacao.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return new Response('Failed to generate template', { status: 500 });
  }
}