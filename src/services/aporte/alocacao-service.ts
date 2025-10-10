import type {
  FundoPrioritizado,
  RecomendacaoAporte,
  RegrasConfiguraveis,
  UserPortfolioWithPositions,
} from '@/types/aporte';

/**
 * Service responsável pela alocação de valor entre fundos prioritários
 */
export class AlocacaoService {
  /**
   * Distribui valor disponível entre fundos prioritários
   * Estratégia: Preencher gap do fundo mais prioritário antes de ir para próximo
   */
  async calcularAlocacao(
    fundosPrioritarios: FundoPrioritizado[],
    valorDisponivel: number,
    portfolioAtual: UserPortfolioWithPositions,
    regras: RegrasConfiguraveis
  ): Promise<RecomendacaoAporte> {
    const fundosComprar = fundosPrioritarios.filter((f) => f.status === 'COMPRAR_AGORA');
    const fundosAguardar = fundosPrioritarios.filter((f) => f.status === 'AGUARDAR_DESCONTO');
    const fundosAcimaIdeal = fundosPrioritarios.filter((f) => f.status === 'NAO_INVESTIR');

    let valorRestante = valorDisponivel;
    const alocacoes: FundoPrioritizado[] = [];

    // Valor total atual da carteira
    const totalCarteira = portfolioAtual.totalValue;

    for (const fundo of fundosComprar) {
      if (valorRestante <= 0) break;

      // Calcular quanto precisa para equilibrar este fundo
      const posicaoAtual = portfolioAtual.positions.find((p) => p.fiiCode === fundo.fiiCode);
      const valorAtual = posicaoAtual?.currentValue || 0;
      const percentualIdeal = fundo.percentualIdeal;

      // Quanto precisa para chegar no ideal (em reais)
      const valorIdeal = (percentualIdeal / 100) * (totalCarteira + valorDisponivel);
      const gapValor = Math.max(0, valorIdeal - valorAtual);

      // Se alocação sequencial, preenche gap completo antes de ir para próximo
      let valorAlocar = regras.alocacaoSequencial
        ? Math.min(gapValor, valorRestante)
        : Math.min(gapValor / fundosComprar.length, valorRestante);

      // Calcular cotas
      const cotasComprar = Math.floor(valorAlocar / fundo.precoAtual);
      valorAlocar = cotasComprar * fundo.precoAtual; // Valor exato das cotas

      if (cotasComprar === 0) continue; // Não dá nem para 1 cota

      // Calcular percentual pós-aporte
      const novoValor = valorAtual + valorAlocar;
      const novoTotalCarteira = totalCarteira + valorAlocar;
      const percentualPosAporte = (novoValor / novoTotalCarteira) * 100;

      alocacoes.push({
        ...fundo,
        valorInvestir: valorAlocar,
        cotasComprar,
        percentualPosAporte,
      });

      valorRestante -= valorAlocar;
    }

    // Verificar se carteira está equilibrada
    const equilibrioAlcancado = alocacoes.every((aloc) => {
      const diferencaIdeal = Math.abs((aloc.percentualPosAporte || 0) - aloc.percentualIdeal);
      return diferencaIdeal <= regras.toleranciaDesbalanceamento;
    });

    return {
      fundosPrioritarios: alocacoes,
      fundosAguardar,
      fundosAcimaIdeal, // Adiciona fundos acima do ideal
      resumo: {
        totalInvestido: valorDisponivel - valorRestante,
        fundosRecomendados: alocacoes.length,
        equilibrioAlcancado,
        sobraValor: valorRestante > 0 ? valorRestante : undefined,
      },
      metadata: {
        regrasAplicadas: regras,
        timestamp: new Date(),
        versaoAlgoritmo: '1.0.0',
      },
    };
  }
}
