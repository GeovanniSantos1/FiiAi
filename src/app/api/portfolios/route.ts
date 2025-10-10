import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);

    // Buscar todos os portfolios do usuário
    const portfolios = await db.userPortfolio.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        originalFileName: true,
        uploadedAt: true,
        totalValue: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(portfolios, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar portfolios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
