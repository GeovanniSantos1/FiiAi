import type { FundoPrioritizado, FundoDesbalanceamento, FundoDesconto, RegrasConfiguraveis } from '@/types/aporte';
import { DesbalanceamentoService } from './desbalanceamento-service';
import { DescontoService } from './desconto-service';

/**
 * Service responsável pelo algoritmo de priorização de fundos
 */
export class PriorizacaoService {
  constructor(
    private desbalanceamentoService: DesbalanceamentoService,
    private descontoService: DescontoService
  ) {}

  /**
   * Algoritmo principal: prioriza fundos combinando desbalanceamento + desconto
   */
  async priorizarFundos(
    portfolioId: string,
    regras: RegrasConfiguraveis
  ): Promise<FundoPrioritizado[]> {
    // 1. Obter desbalanceamento
    const desbalanceamentos = await this.desbalanceamentoService.calcularDesbalanceamento(portfolioId);
    const fundosAusentes = await this.desbalanceamentoService.identificarFundosAusentes(portfolioId);
    const todosFundos = [...desbalanceamentos, ...fundosAusentes];

    console.log('🔍 DEBUG PRIORIZACAO:');
    console.log('  - Fundos com desbalanceamento (já na carteira):', desbalanceamentos.length, desbalanceamentos.map(f => f.fiiCode));
    console.log('  - Fundos ausentes (não possui):', fundosAusentes.length, fundosAusentes.map(f => f.fiiCode));
    console.log('  - Total de fundos:', todosFundos.length);

    if (todosFundos.length === 0) {
      return [];
    }

    // 2. Obter descontos
    const fundoCodes = todosFundos.map((f) => f.fiiCode);
    const descontos = await this.descontoService.calcularDescontos(fundoCodes);
    console.log('  - Descontos obtidos:', descontos.length);

    // 3. Combinar dados e calcular scores
    const fundosCombinados = todosFundos.map((fundo) => {
      const desconto = descontos.find((d) => d.fiiCode === fundo.fiiCode);

      // Só considera fundos desbalanceados (abaixo do ideal)
      const isDesbalanceado = fundo.desbalanceamento > 0; // Precisa aumentar alocação

      // Cálculo do score de prioridade
      // Prioridade 1: Desbalanceamento (quanto mais desbalanceado, maior prioridade)
      // Prioridade 2: Desconto (quanto maior desconto, melhor)
      const scoreDesbalanceamento = fundo.prioridadeDesbalanceamento;
      const scoreDesconto = desconto?.percentualDesconto && desconto.percentualDesconto > 0
        ? desconto.percentualDesconto
        : 0;

      // Score combinado: desbalanceamento tem peso maior
      const pesoDesbalanceamento = regras.pesoDesbalanceamento / 100;
      const pesoDesconto = regras.pesoDesconto / 100;
      const score = (scoreDesbalanceamento * pesoDesbalanceamento) + (scoreDesconto * pesoDesconto);

      // Determinar status baseado na lógica:
      // 1. Sem preço teto = NAO_INVESTIR
      // 2. Desbalanceado + qualquer desconto (>0%) = COMPRAR_AGORA
      // 3. Desbalanceado + sem desconto ou preço acima teto = AGUARDAR_DESCONTO
      // 4. Não desbalanceado = NAO_INVESTIR
      let status: FundoPrioritizado['status'] = 'NAO_INVESTIR';
      let motivoNaoInvestir = '';

      if (desconto?.percentualDesconto === null || desconto?.precoTeto === null) {
        status = 'NAO_INVESTIR';
        motivoNaoInvestir = 'sem_preco_teto';
      } else if (!isDesbalanceado) {
        // Fundo já está no nível ideal ou acima - não investir
        status = 'NAO_INVESTIR';
        motivoNaoInvestir = `nao_desbalanceado (atual:${fundo.percentualAtual.toFixed(1)}% ideal:${fundo.percentualIdeal.toFixed(1)}% desb:${fundo.desbalanceamento.toFixed(1)})`;
      } else if (desconto.percentualDesconto > 0) {
        // Desbalanceado + tem desconto (mesmo que pequeno) = COMPRAR
        status = 'COMPRAR_AGORA';
      } else {
        // Desbalanceado + sem desconto = AGUARDAR
        status = 'AGUARDAR_DESCONTO';
      }

      // Log detalhado para fundos NAO_INVESTIR
      if (status === 'NAO_INVESTIR' && fundo.percentualAtual > 0) {
        console.log(`  ⚠️ ${fundo.fiiCode} → NAO_INVESTIR: ${motivoNaoInvestir}`);
      }

      const justificativa = this.gerarJustificativa(fundo, desconto, status);

      return {
        ...fundo,
        precoAtual: desconto?.precoAtual || 0,
        precoTeto: desconto?.precoTeto || null,
        percentualDesconto: desconto?.percentualDesconto || null,
        score,
        status,
        justificativa,
        prioridade: 999,
      };
    });

    // 4. Separar fundos por status
    const fundosComprar = fundosCombinados.filter(f => f.status === 'COMPRAR_AGORA');
    const fundosAguardar = fundosCombinados.filter(f => f.status === 'AGUARDAR_DESCONTO');
    const fundosNaoInvestir = fundosCombinados.filter(f => f.status === 'NAO_INVESTIR');

    console.log('📈 STATUS DOS FUNDOS:');
    console.log('  - COMPRAR_AGORA:', fundosComprar.length, fundosComprar.map(f => ({
      code: f.fiiCode,
      atual: f.percentualAtual.toFixed(1),
      ideal: f.percentualIdeal.toFixed(1),
      desb: f.desbalanceamento.toFixed(1),
      desc: f.percentualDesconto?.toFixed(2)
    })));
    console.log('  - AGUARDAR_DESCONTO:', fundosAguardar.length, fundosAguardar.map(f => f.fiiCode));
    console.log('  - NAO_INVESTIR:', fundosNaoInvestir.length, fundosNaoInvestir.map(f => f.fiiCode));

    // 5. Ordenar fundos COMPRAR por:
    //    Primeiro: maior desbalanceamento
    //    Segundo: maior desconto
    fundosComprar.sort((a, b) => {
      // Priorizar desbalanceamento
      const diffDesbalanceamento = b.prioridadeDesbalanceamento - a.prioridadeDesbalanceamento;
      if (Math.abs(diffDesbalanceamento) > 0.5) { // Se diferença > 0.5pp, usar como critério
        return diffDesbalanceamento;
      }
      // Se desbalanceamento similar, usar desconto como desempate
      return (b.percentualDesconto || 0) - (a.percentualDesconto || 0);
    });

    // 6. Ordenar fundos AGUARDAR por desbalanceamento
    fundosAguardar.sort((a, b) => b.prioridadeDesbalanceamento - a.prioridadeDesbalanceamento);

    // 7. Atribuir prioridade numérica
    let prioridadeAtual = 1;
    fundosComprar.forEach((fundo) => {
      fundo.prioridade = prioridadeAtual++;
    });

    // 8. Combinar resultados: COMPRAR primeiro, depois AGUARDAR
    const fundosOrdenados = [...fundosComprar, ...fundosAguardar, ...fundosNaoInvestir];

    // 9. Retornar todos os fundos organizados por categoria
    // Não limitamos aqui - o serviço de alocação que vai decidir
    const resultado = [...fundosComprar, ...fundosAguardar, ...fundosNaoInvestir];

    console.log('📦 RETORNANDO:', {
      comprar: fundosComprar.length,
      aguardar: fundosAguardar.length,
      naoInvestir: fundosNaoInvestir.length,
      total: resultado.length
    });

    return resultado;
  }

  private gerarJustificativa(
    fundo: FundoDesbalanceamento,
    desconto: FundoDesconto | undefined,
    status: string
  ): string {
    const desbalanceamentoTexto = fundo.desbalanceamento > 0
      ? `abaixo do ideal (${fundo.percentualAtual.toFixed(1)}% vs. ${fundo.percentualIdeal.toFixed(1)}%)`
      : fundo.desbalanceamento < 0
        ? `acima do ideal (${fundo.percentualAtual.toFixed(1)}% vs. ${fundo.percentualIdeal.toFixed(1)}%)`
        : `no nível ideal (${fundo.percentualAtual.toFixed(1)}%)`;

    const descontoTexto = desconto?.percentualDesconto && desconto.percentualDesconto > 0
      ? `com ${desconto.percentualDesconto.toFixed(2)}% de desconto`
      : desconto?.percentualDesconto && desconto.percentualDesconto < 0
        ? `${Math.abs(desconto.percentualDesconto).toFixed(2)}% acima do preço teto`
        : `sem desconto disponível`;

    if (status === 'COMPRAR_AGORA') {
      return `${fundo.fiiName} está ${desbalanceamentoTexto} e ${descontoTexto}. Prioridade para rebalanceamento.`;
    } else if (status === 'AGUARDAR_DESCONTO') {
      return `${fundo.fiiName} está ${desbalanceamentoTexto}, mas o preço atual está acima do teto. Aguarde desconto.`;
    } else if (fundo.desbalanceamento < 0) {
      // Fundo acima do ideal - não deve receber aportes
      return `${fundo.fiiName} está ${desbalanceamentoTexto}. Não investir (já possui alocação suficiente).`;
    } else if (fundo.percentualIdeal === 0) {
      // Fundo não está na carteira ideal
      return `${fundo.fiiName} não está na carteira ideal recomendada (possui ${fundo.percentualAtual.toFixed(1)}%). Considere reduzir exposição.`;
    } else {
      return `${fundo.fiiName} não possui preço teto configurado. Configure para receber recomendações.`;
    }
  }
}
