/**
 * API Endpoint: Validação em massa de fundos antes de importar
 * POST /api/admin/carteiras/[id]/fundos/validate-bulk
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { getSectorOptions } from '@/types/fii-sectors';
import type { FundValidationError, FundValidationWarning } from '@/types/fund-import';

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

const BulkValidateSchema = z.object({
  funds: z.array(FundRowSchema),
});

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Autenticação admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { id: portfolioId } = await params;

    // 2. Verificar se carteira existe
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        funds: {
          select: { ticker: true, id: true, allocation: true }
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
    const validation = BulkValidateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { funds } = validation.data;

    // 4. Validar segmentos
    const validSegments = getSectorOptions().map(s => s.value);
    const errors: FundValidationError[] = [];
    const warnings: FundValidationWarning[] = [];

    funds.forEach(fund => {
      if (!validSegments.includes(fund.segmento)) {
        errors.push({
          rowNumber: fund.rowNumber,
          field: 'segmento',
          error: `Segmento inválido. Use um dos valores válidos: ${validSegments.slice(0, 5).join(', ')}...`,
          value: fund.segmento
        });
      }

      // Avisar se preço atual > preço teto
      if (fund.precoAtual > fund.precoTeto) {
        warnings.push({
          rowNumber: fund.rowNumber,
          message: `Preço atual (${fund.precoAtual}) maior que preço teto (${fund.precoTeto})`
        });
      }

      // Avisar se alocação muito baixa
      if (fund.alocacao < 1) {
        warnings.push({
          rowNumber: fund.rowNumber,
          message: `Alocação muito baixa (${fund.alocacao}%). Considere pelo menos 1%.`
        });
      }
    });

    // 5. Verificar fundos existentes vs novos
    const existingTickers = new Set(portfolio.funds.map(f => f.ticker.toUpperCase()));
    const existingFunds: Array<{ ticker: string; rowNumber: number; action: 'UPDATE' }> = [];
    const newFunds: Array<{ ticker: string; rowNumber: number; action: 'INSERT' }> = [];

    funds.forEach(fund => {
      if (existingTickers.has(fund.ticker.toUpperCase())) {
        existingFunds.push({
          ticker: fund.ticker,
          rowNumber: fund.rowNumber,
          action: 'UPDATE'
        });
      } else {
        newFunds.push({
          ticker: fund.ticker,
          rowNumber: fund.rowNumber,
          action: 'INSERT'
        });
      }
    });

    // 6. Verificar duplicatas na planilha
    const tickerMap = new Map<string, number[]>();
    funds.forEach(fund => {
      const rows = tickerMap.get(fund.ticker.toUpperCase()) || [];
      rows.push(fund.rowNumber);
      tickerMap.set(fund.ticker.toUpperCase(), rows);
    });

    const duplicatesInFile = Array.from(tickerMap.entries())
      .filter(([_, rows]) => rows.length > 1)
      .flatMap(([ticker, rows]) =>
        rows.map(rowNumber => ({ ticker, rowNumber }))
      );

    if (duplicatesInFile.length > 0) {
      duplicatesInFile.forEach(dup => {
        errors.push({
          rowNumber: dup.rowNumber,
          field: 'ticker',
          error: `Ticker duplicado na planilha: ${dup.ticker}`,
          value: dup.ticker
        });
      });
    }

    // 7. Validar alocação total
    const totalAllocation = funds.reduce((sum, fund) => sum + fund.alocacao, 0);
    const allocationValid = Math.abs(totalAllocation - 100) < 0.1; // tolerância de 0.1%

    if (!allocationValid) {
      warnings.push({
        rowNumber: 0,
        message: `Alocação total = ${totalAllocation.toFixed(1)}%. Deve somar 100%.`
      });
    }

    // 8. Retornar resultado
    return NextResponse.json({
      valid: funds.filter(f =>
        !errors.some(e => e.rowNumber === f.rowNumber)
      ),
      errors,
      warnings,
      existingFunds,
      newFunds,
      totalAllocation,
      allocationValid,
      summary: {
        total: funds.length,
        valid: funds.length - errors.filter((e, i, arr) =>
          arr.findIndex(x => x.rowNumber === e.rowNumber) === i
        ).length,
        toCreate: newFunds.length,
        toUpdate: existingFunds.length,
        errors: errors.length,
        warnings: warnings.length
      }
    });
  } catch (error: any) {
    console.error('Erro na validação em massa de fundos:', error);
    return NextResponse.json(
      { error: 'Erro ao validar fundos', details: error.message },
      { status: 500 }
    );
  }
}
