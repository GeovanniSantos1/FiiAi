import { db } from '@/lib/db';
import type { FundoDesbalanceamento, IdealAllocation } from '@/types/aporte';
import { normalizeSector } from '@/types/fii-sectors';

/**
 * Service para análise de desbalanceamento de carteiras FII
 */
export class DesbalanceamentoService {
  /**
   * Calcula desbalanceamento de cada fundo na carteira
   * Desbalanceamento = % Ideal - % Atual (em pontos percentuais)
   * Ex: Ideal 10%, Atual 5% → Desbalanceamento = +5pp
   *
   * IMPORTANTE: Analisa TODOS os fundos da carteira atual, incluindo os que não estão na carteira ideal
   */
  async calcularDesbalanceamento(portfolioId: string): Promise<FundoDesbalanceamento[]> {
    const portfolio = await db.userPortfolio.findUnique({
      where: { id: portfolioId },
      select: {
        id: true,
        positions: true,
        totalValue: true,
      },
    });

    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} não encontrado`);
    }

    // Parse positions from JSON
    const positions = Array.isArray(portfolio.positions)
      ? (portfolio.positions as any[])
      : [];

    console.log('📊 DEBUG DESBALANCEAMENTO - calcularDesbalanceamento:');
    console.log('  - Portfolio ID:', portfolioId);
    console.log('  - Positions count:', positions.length);
    console.log('  - Positions:', positions.map(p => ({ code: p.fiiCode, value: p.currentValue })));

    if (positions.length === 0) {
      return [];
    }

    const totalValue = portfolio.totalValue || positions.reduce((sum: number, pos: any) => sum + (pos.currentValue || 0), 0);

    // Buscar alocação ideal da carteira recomendada
    const idealAllocation = await this.getIdealAllocation(portfolioId);
    console.log('  - Ideal allocation:', idealAllocation.map(i => ({ code: i.fiiCode, ideal: i.percentage })));

    // Mapear fundos atuais com seus percentuais ideais
    return positions.map((position: any) => {
      const percentualAtual = totalValue > 0 ? (position.currentValue / totalValue) * 100 : 0;

      // Buscar percentual ideal (pode não existir se fundo não está na carteira ideal)
      const idealTarget = idealAllocation.find(
        (ideal) => ideal.fiiCode === position.fiiCode
      );

      // Se o fundo não está na carteira ideal, consideramos ideal = 0%
      // Isso significa que o fundo está "acima do ideal" e não deve receber mais aportes
      const percentualIdeal = idealTarget?.percentage || 0;
      const desbalanceamento = percentualIdeal - percentualAtual;

      return {
        fiiCode: position.fiiCode,
        fiiName: position.fiiName || position.name || position.fiiCode,
        setor: normalizeSector(position.sector || position.setor || idealTarget?.sector || 'OUTROS'),
        percentualAtual,
        percentualIdeal,
        desbalanceamento, // Positivo = precisa aumentar, Negativo = precisa reduzir
        prioridadeDesbalanceamento: Math.abs(desbalanceamento), // Quanto maior, mais prioritário
      };
    });
  }

  /**
   * Identifica fundos ausentes na carteira mas presentes na alocação ideal
   */
  async identificarFundosAusentes(portfolioId: string): Promise<FundoDesbalanceamento[]> {
    const portfolio = await db.userPortfolio.findUnique({
      where: { id: portfolioId },
      select: {
        id: true,
        positions: true,
      },
    });

    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} não encontrado`);
    }

    const positions = Array.isArray(portfolio.positions)
      ? (portfolio.positions as any[])
      : [];

    const fundosNaCarteira = new Set(positions.map((p: any) => p.fiiCode));
    const idealAllocation = await this.getIdealAllocation(portfolioId);

    return idealAllocation
      .filter((ideal) => !fundosNaCarteira.has(ideal.fiiCode))
      .map((ideal) => ({
        fiiCode: ideal.fiiCode,
        fiiName: ideal.fiiName,
        setor: normalizeSector(ideal.sector),
        percentualAtual: 0,
        percentualIdeal: ideal.percentage,
        desbalanceamento: ideal.percentage,
        prioridadeDesbalanceamento: ideal.percentage,
      }));
  }

  /**
   * Obtém a alocação ideal para o portfolio
   * Busca da carteira recomendada ativa ou da primeira disponível
   */
  private async getIdealAllocation(portfolioId: string): Promise<IdealAllocation[]> {
    // Buscar a carteira recomendada ativa
    const recommendedPortfolio = await db.recommendedPortfolio.findFirst({
      where: { isActive: true },
      include: {
        funds: {
          select: {
            ticker: true,
            name: true,
            segment: true,
            allocation: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Se não houver carteira recomendada ativa, buscar qualquer uma
    const portfolio = recommendedPortfolio || await db.recommendedPortfolio.findFirst({
      include: {
        funds: {
          select: {
            ticker: true,
            name: true,
            segment: true,
            allocation: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!portfolio || !portfolio.funds || portfolio.funds.length === 0) {
      console.warn('Nenhuma carteira recomendada encontrada. Retornando alocação vazia.');
      return [];
    }

    // Mapear fundos da carteira recomendada para IdealAllocation
    const idealAllocation: IdealAllocation[] = portfolio.funds.map((fund) => ({
      fiiCode: fund.ticker,
      fiiName: fund.name,
      sector: normalizeSector(fund.segment),
      percentage: Number(fund.allocation), // Convert Decimal to number
    }));

    return idealAllocation;
  }
}
