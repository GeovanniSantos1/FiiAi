import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { DesbalanceamentoService } from '@/services/aporte/desbalanceamento-service';
import { DescontoService } from '@/services/aporte/desconto-service';
import { PriorizacaoService } from '@/services/aporte/priorizacao-service';
import { AlocacaoService } from '@/services/aporte/alocacao-service';
import type { UserPortfolioWithPositions } from '@/types/aporte';

const AporteRequestSchema = z.object({
  valorDisponivel: z.number().min(50, 'Valor mínimo: R$ 50').max(1_000_000, 'Valor máximo: R$ 1.000.000'),
  portfolioId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);

    // 2. Validação
    const body = await request.json();
    const validation = AporteRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { valorDisponivel, portfolioId } = validation.data;

    // 3. Verificar ownership do portfólio
    const portfolio = await db.userPortfolio.findFirst({
      where: { id: portfolioId, userId: user.id },
      select: {
        id: true,
        userId: true,
        positions: true,
        totalValue: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfólio não encontrado' }, { status: 404 });
    }

    // Parse portfolio positions
    const positions = Array.isArray(portfolio.positions) ? (portfolio.positions as any[]) : [];

    const portfolioData: UserPortfolioWithPositions = {
      id: portfolio.id,
      userId: portfolio.userId,
      positions,
      totalValue: portfolio.totalValue,
    };

    // 4. Obter regras ativas
    let regras = await db.regrasAporte.findFirst({
      where: { ativo: true },
      orderBy: { atualizadoEm: 'desc' },
    });

    // Se não houver regras, criar regras padrão
    if (!regras) {
      regras = await db.regrasAporte.create({
        data: {
          nome: 'Regras Padrão',
          descricao: 'Configuração inicial do sistema',
          ativo: true,
          descontoMinimoAceitavel: 0.0,
          permitirSemDesconto: true,
          toleranciaDesbalanceamento: 2.0,
          pesoDesbalanceamento: 60,
          pesoDesconto: 40,
          limiteMaximoFundos: 5,
          alocacaoSequencial: false, // Usar alocação proporcional para distribuir entre todos os fundos
          criadoPor: userId,
        },
      });
    }

    // 5. Executar análise
    const desbalanceamentoService = new DesbalanceamentoService();
    const descontoService = new DescontoService();
    const priorizacaoService = new PriorizacaoService(
      desbalanceamentoService,
      descontoService
    );

    const fundosPrioritarios = await priorizacaoService.priorizarFundos(
      portfolioId,
      regras as any
    );

    const alocacaoService = new AlocacaoService();
    const recomendacao = await alocacaoService.calcularAlocacao(
      fundosPrioritarios,
      valorDisponivel,
      portfolioData,
      regras as any
    );

    // 6. Salvar histórico
    await db.aporteRecomendacao.create({
      data: {
        userId: user.id,
        userPortfolioId: portfolioId,
        valorDisponivel,
        recomendacao: recomendacao as any,
        regrasUtilizadas: regras as any,
      },
    });

    // 7. Retornar recomendação
    return NextResponse.json({
      success: true,
      ...recomendacao,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao gerar recomendação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
