import { db } from '@/lib/db';
import type { FundoDesconto } from '@/types/aporte';

/**
 * Service para análise de descontos em FIIs
 */
export class DescontoService {
  /**
   * Calcula desconto de cada fundo com base em preço teto
   * Desconto % = ((Preço Teto - Preço Atual) / Preço Teto) * 100
   * Positivo = desconto, Negativo = acima do teto
   */
  async calcularDescontos(fundoCodes: string[]): Promise<FundoDesconto[]> {
    if (fundoCodes.length === 0) {
      return [];
    }

    // Buscar preços atuais (simulado - em produção, buscar de API externa)
    const precosAtuais = await this.buscarPrecosAtuais(fundoCodes);

    // Buscar preços teto da tabela RecommendedFund
    const precosTeto = await db.recommendedFund.findMany({
      where: {
        ticker: { in: fundoCodes },
      },
      select: {
        ticker: true,
        ceilingPrice: true,
        currentPrice: true,
      },
    });

    return fundoCodes.map((code) => {
      const fundoData = precosTeto.find((p) => p.ticker === code);
      // Usar preço atual do banco se disponível, senão usar o simulado
      const precoAtual = fundoData ? Number(fundoData.currentPrice) : (precosAtuais.get(code) || 0);
      const precoTeto = fundoData ? Number(fundoData.ceilingPrice) : null;

      if (precoTeto === null || precoTeto === 0) {
        return {
          fiiCode: code,
          precoAtual,
          precoTeto: null,
          percentualDesconto: null,
          status: 'SEM_PRECO_TETO' as const,
          prioridadeDesconto: 0,
        };
      }

      const percentualDesconto = ((precoTeto - precoAtual) / precoTeto) * 100;

      return {
        fiiCode: code,
        precoAtual,
        precoTeto,
        percentualDesconto,
        status: percentualDesconto > 0 ? 'COM_DESCONTO' as const : 'SEM_DESCONTO' as const,
        prioridadeDesconto: Math.max(0, percentualDesconto), // Apenas descontos positivos
      };
    });
  }

  /**
   * Busca preços atuais dos fundos
   * TODO: Integrar com API externa real (Brapi, Status Invest, B3)
   * Por enquanto, simula preços com base em valores mockados
   */
  private async buscarPrecosAtuais(fundoCodes: string[]): Promise<Map<string, number>> {
    // MOCK: Simulando preços atuais
    // Em produção, fazer integração com API real
    const precosMock = new Map<string, number>([
      ['HGRE11', 116.26],
      ['BTLG11', 104.10],
      ['LVBI11', 108.11],
      ['TRXF11', 100.14],
      ['XPML11', 105.53],
      ['HSML11', 83.68],
      ['HGRU11', 126.17],
      ['CVBI11', 83.43],
      ['VGIP11', 79.69],
      ['WHGR11', 9.10],
      ['RBRY11', 95.61],
      ['PVBI11', 95.00],
    ]);

    // Retornar preços mockados ou valor padrão
    const resultado = new Map<string, number>();
    fundoCodes.forEach((code) => {
      resultado.set(code, precosMock.get(code) || 100.0);
    });

    return resultado;
  }

  /**
   * Cria ou atualiza preço teto para um fundo
   * Admin pode configurar preços teto manualmente
   */
  async configurarPrecoTeto(
    fiiCode: string,
    valorTeto: number,
    fonte: string = 'usuario'
  ): Promise<void> {
    await db.fiiPrecoTeto.upsert({
      where: { fiiCode },
      update: {
        valorTeto,
        fonte,
        atualizadoEm: new Date(),
      },
      create: {
        fiiCode,
        valorTeto,
        fonte,
      },
    });
  }

  /**
   * Importa preços teto em lote (para admin)
   */
  async importarPrecosTeto(precos: Array<{ fiiCode: string; valorTeto: number }>): Promise<void> {
    for (const preco of precos) {
      await this.configurarPrecoTeto(preco.fiiCode, preco.valorTeto, 'sistema');
    }
  }

  /**
   * Lista todos os preços teto configurados
   */
  async listarPrecosTeto(): Promise<Array<{ fiiCode: string; valorTeto: number; fonte: string | null }>> {
    const precos = await db.fiiPrecoTeto.findMany({
      orderBy: { fiiCode: 'asc' },
    });

    return precos.map((p) => ({
      fiiCode: p.fiiCode,
      valorTeto: p.valorTeto,
      fonte: p.fonte,
    }));
  }
}
