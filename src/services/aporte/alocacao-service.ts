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
    // Valor total da carteira APÓS o aporte completo
    const totalCarteiraComAporte = totalCarteira + valorDisponivel;

    console.log('💰 DEBUG ALOCAÇÃO:');
    console.log(`  - Total carteira atual: R$ ${totalCarteira.toFixed(2)}`);
    console.log(`  - Valor disponível para aportar: R$ ${valorDisponivel.toFixed(2)}`);
    console.log(`  - Total carteira com aporte: R$ ${totalCarteiraComAporte.toFixed(2)}`);
    console.log(`  - Fundos para comprar: ${fundosComprar.length}`);
    console.log(`  - Alocação sequencial: ${regras.alocacaoSequencial ? 'SIM (preenche um por vez)' : 'NÃO (distribui proporcionalmente)'}`);

    // Calcular gaps de todos os fundos primeiro (para alocação proporcional)
    const fundosComGap = fundosComprar.map(fundo => {
      const posicaoAtual = portfolioAtual.positions.find((p) => p.fiiCode === fundo.fiiCode);
      const valorAtual = posicaoAtual?.currentValue || 0;
      const percentualIdeal = fundo.percentualIdeal;
      const valorIdeal = (percentualIdeal / 100) * totalCarteiraComAporte;
      const gap = Math.max(0, valorIdeal - valorAtual);
      return { fundo, valorAtual, valorIdeal, gap };
    });

    const totalGaps = fundosComGap.reduce((sum, f) => sum + f.gap, 0);
    console.log(`  - Total de gaps: R$ ${totalGaps.toFixed(2)}`);

    for (const { fundo, valorAtual, valorIdeal, gap } of fundosComGap) {
      if (valorRestante <= 0) break;

      console.log(`    📊 ${fundo.fiiCode}:`);
      console.log(`      - Valor atual: R$ ${valorAtual.toFixed(2)}`);
      console.log(`      - Percentual ideal: ${fundo.percentualIdeal.toFixed(2)}%`);
      console.log(`      - Valor ideal: R$ ${valorIdeal.toFixed(2)}`);
      console.log(`      - Gap: R$ ${gap.toFixed(2)}`);
      console.log(`      - Valor restante: R$ ${valorRestante.toFixed(2)}`);

      // Calcular valor a alocar baseado na estratégia
      let valorAlocar: number;

      if (regras.alocacaoSequencial) {
        // Sequencial: preenche gap completo antes de ir para próximo
        valorAlocar = Math.min(gap, valorRestante);
      } else {
        // Proporcional: distribui valor proporcionalmente aos gaps
        const proporcaoGap = totalGaps > 0 ? gap / totalGaps : 0;
        valorAlocar = Math.min(valorDisponivel * proporcaoGap, gap, valorRestante);
      }

      console.log(`      - Valor a alocar: R$ ${valorAlocar.toFixed(2)}`);
      console.log(`      - Preço atual: R$ ${fundo.precoAtual.toFixed(2)}`);

      // Calcular cotas
      const cotasComprar = Math.floor(valorAlocar / fundo.precoAtual);
      valorAlocar = cotasComprar * fundo.precoAtual; // Valor exato das cotas

      console.log(`      - Cotas: ${cotasComprar}`);
      console.log(`      - Valor final alocado: R$ ${valorAlocar.toFixed(2)}`);

      if (cotasComprar === 0) {
        console.log(`      ⚠️ Não dá para comprar nem 1 cota - PULANDO`);
        continue; // Não dá nem para 1 cota
      }

      // Calcular percentual pós-aporte
      // Importante: usar o total da carteira COM APORTE COMPLETO (não apenas este aporte parcial)
      const novoValor = valorAtual + valorAlocar;
      const percentualPosAporte = (novoValor / totalCarteiraComAporte) * 100;

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
