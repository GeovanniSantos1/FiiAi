// ============================================================================
// TIPOS PARA SISTEMA DE DIRECIONADOR DE APORTES
// ============================================================================

/**
 * Request para gerar recomendação de aporte
 */
export interface AporteRequest {
  userId: string;
  valorDisponivel: number; // Valor que o usuário tem para investir
  portfolioId: string; // Carteira atual do usuário
}

/**
 * Fundo priorizado para investimento
 */
export interface FundoPrioritizado {
  fiiCode: string;
  fiiName: string;
  setor: string;

  // Situação atual
  percentualAtual: number;
  percentualIdeal: number;
  desbalanceamento: number; // Em pontos percentuais (ex: -5%)

  // Situação de preço
  precoAtual: number;
  precoTeto: number;
  percentualDesconto: number; // Positivo = desconto, Negativo = sem desconto

  // Priorização
  prioridade: number; // 1 = mais prioritário
  score: number; // Cálculo: (desbalanceamento * peso1) + (desconto * peso2)
  status: 'COMPRAR_AGORA' | 'AGUARDAR_DESCONTO' | 'NAO_INVESTIR';

  // Recomendação
  valorInvestir?: number;
  cotasComprar?: number;
  percentualPosAporte?: number;
  justificativa: string;
}

/**
 * Recomendação completa de aporte
 */
export interface RecomendacaoAporte {
  fundosPrioritarios: FundoPrioritizado[];
  fundosAguardar: FundoPrioritizado[];
  fundosAcimaIdeal?: FundoPrioritizado[]; // Fundos que já estão acima da alocação ideal
  resumo: {
    totalInvestido: number;
    fundosRecomendados: number;
    equilibrioAlcancado: boolean;
    sobraValor?: number;
  };
  metadata: {
    regrasAplicadas: RegrasConfiguraveis;
    timestamp: Date;
    versaoAlgoritmo: string;
  };
}

/**
 * Regras configuráveis para o algoritmo
 */
export interface RegrasConfiguraveis {
  id: string;

  // Regras de desconto
  descontoMinimoAceitavel: number; // % (ex: 0 = qualquer desconto, 5 = mínimo 5%)
  permitirSemDesconto: boolean; // Se true, ignora desconto mínimo

  // Regras de balanceamento
  toleranciaDesbalanceamento: number; // % (ex: 2 = tolera até ±2% de diferença)
  pesoDesbalanceamento: number; // 0-100
  pesoDesconto: number; // 0-100

  // Regras de recomendação
  limiteMaximoFundos: number; // Máximo de fundos a recomendar (ex: 5)
  alocacaoSequencial: boolean; // Se true, aloca no #1 até equilibrar antes de ir para #2

  // Metadados
  nome: string; // Ex: "Perfil Conservador"
  descricao: string;
  ativo: boolean;
  criadoPor: string;
  atualizadoEm: Date;
}

/**
 * Informações de desbalanceamento de um fundo
 */
export interface FundoDesbalanceamento {
  fiiCode: string;
  fiiName: string;
  setor: string;
  percentualAtual: number;
  percentualIdeal: number;
  desbalanceamento: number;
  prioridadeDesbalanceamento: number;
}

/**
 * Informações de desconto de um fundo
 */
export interface FundoDesconto {
  fiiCode: string;
  precoAtual: number;
  precoTeto: number | null;
  percentualDesconto: number | null;
  status: 'COM_DESCONTO' | 'SEM_DESCONTO' | 'SEM_PRECO_TETO';
  prioridadeDesconto?: number;
}

/**
 * Posição ideal de alocação (esperada na carteira)
 */
export interface IdealAllocation {
  fiiCode: string;
  fiiName: string;
  sector: string;
  percentage: number; // % ideal na carteira
}

/**
 * Portfolio do usuário com posições
 */
export interface UserPortfolioWithPositions {
  id: string;
  userId: string;
  positions: PortfolioPosition[];
  idealAllocation?: IdealAllocation[];
  totalValue: number;
}

/**
 * Posição individual no portfolio
 */
export interface PortfolioPosition {
  fiiCode: string;
  fiiName: string;
  sector: string;
  quantity: number;
  avgPrice: number;
  currentValue: number;
  percentage?: number;
}

/**
 * Request para atualizar regras de aporte (Admin)
 */
export interface UpdateRegrasAporteRequest {
  descontoMinimoAceitavel?: number;
  permitirSemDesconto?: boolean;
  toleranciaDesbalanceamento?: number;
  pesoDesbalanceamento?: number;
  pesoDesconto?: number;
  limiteMaximoFundos?: number;
  alocacaoSequencial?: boolean;
  nome?: string;
  descricao?: string;
}

/**
 * Response da API de recomendação
 */
export interface AporteRecomendacaoResponse extends RecomendacaoAporte {
  success: boolean;
  error?: string;
}
