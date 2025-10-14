/**
 * API Endpoint: Importação em massa de fundos
 * POST /api/admin/carteiras/[id]/fundos/bulk-import
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const FundRowSchema = z.object({
  ticker: z.string().min(1).max(10),
  nome: z.string().min(1),
  segmento: z.string().min(1),
  precoAtual: z.number().positive(),
  precoMedio: z.number().positive(),
  precoTeto: z.number().positive(),
  alocacao: z.number().min(0).max(100),
  recomendacao: z.enum(['BUY', 'SELL', 'HOLD']),
  rowNumber: z.number(),
});

const BulkImportSchema = z.object({
  funds: z.array(FundRowSchema),
  mode: z.enum(['replace', 'merge']).default('merge'), // replace = deleta tudo antes
});

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const startTime = Date.now();

  try {
    // 1. Autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { id: portfolioId } = await params;

    // 2. Verificar carteira
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        funds: {
          select: { id: true, ticker: true }
        }
      }
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Carteira não encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar payload
    const body = await request.json();
    const validation = BulkImportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { funds, mode } = validation.data;

    // 4. Validar alocação total
    const totalAllocation = funds.reduce((sum, f) => sum + f.alocacao, 0);
    if (Math.abs(totalAllocation - 100) > 0.1) {
      return NextResponse.json(
        { error: `Alocação total inválida: ${totalAllocation.toFixed(1)}%. Deve somar 100%.` },
        { status: 400 }
      );
    }

    // 5. Processar em transação
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ rowNumber: number; ticker: string; error: string }> = [];

    const existingTickerMap = new Map(
      portfolio.funds.map(f => [f.ticker.toUpperCase(), f.id])
    );

    try {
      await db.$transaction(async (tx) => {
        // Se mode = 'replace', deletar todos os fundos existentes
        if (mode === 'replace') {
          await tx.recommendedFund.deleteMany({
            where: { portfolioId }
          });
        }

        // Processar cada fundo
        for (const fund of funds) {
          try {
            const existingId = existingTickerMap.get(fund.ticker.toUpperCase());

            if (existingId && mode === 'merge') {
              // Atualizar existente
              await tx.recommendedFund.update({
                where: { id: existingId },
                data: {
                  name: fund.nome,
                  segment: fund.segmento,
                  currentPrice: fund.precoAtual,
                  averagePrice: fund.precoMedio,
                  ceilingPrice: fund.precoTeto,
                  allocation: fund.alocacao,
                  recommendation: fund.recomendacao
                }
              });
              updated++;
            } else {
              // Criar novo
              await tx.recommendedFund.create({
                data: {
                  portfolioId,
                  ticker: fund.ticker.toUpperCase(),
                  name: fund.nome,
                  segment: fund.segmento,
                  currentPrice: fund.precoAtual,
                  averagePrice: fund.precoMedio,
                  ceilingPrice: fund.precoTeto,
                  allocation: fund.alocacao,
                  recommendation: fund.recomendacao
                }
              });
              created++;
            }
          } catch (error: any) {
            failed++;
            errors.push({
              rowNumber: fund.rowNumber,
              ticker: fund.ticker,
              error: error.message || 'Erro ao processar fundo'
            });
            // Em caso de erro, faz rollback da transação
            throw error;
          }
        }
      });

      // 6. Calcular alocação final
      const finalFunds = await db.recommendedFund.findMany({
        where: { portfolioId },
        select: { allocation: true }
      });

      const finalAllocation = finalFunds.reduce(
        (sum, f) => sum + Number(f.allocation),
        0
      );

      const duration = Date.now() - startTime;

      // 7. Retornar resultado
      return NextResponse.json({
        total: funds.length,
        created,
        updated,
        failed,
        errors,
        finalAllocation,
        duration,
        timestamp: new Date()
      });
    } catch (error: any) {
      console.error('Erro na transação de importação:', error);
      return NextResponse.json(
        { error: 'Erro ao processar importação. Nenhuma alteração foi salva.', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro na importação em massa de fundos:', error);
    return NextResponse.json(
      { error: 'Erro ao importar fundos', details: error.message },
      { status: 500 }
    );
  }
}
