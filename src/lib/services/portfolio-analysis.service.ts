import { db } from '@/lib/db';
import { RecommendationRulesService } from './recommendation-rules.service';

// Define AnalysisType if not available from Prisma
type AnalysisType = 'PORTFOLIO_EVALUATION' | 'INVESTMENT_RECOMMENDATION';

export interface AnalysisOptions {
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  investmentGoal?: 'income' | 'growth' | 'balanced';
  timeHorizon?: 'short' | 'medium' | 'long';
}

export interface AnalysisContext {
  portfolio: any;
  marketData?: any;
  riskTolerance: string;
  investmentGoal: string;
  timeHorizon: string;
  rules: any;
}

export class PortfolioAnalysisService {
  private rulesService: RecommendationRulesService;

  constructor() {
    this.rulesService = new RecommendationRulesService();
  }

  /**
   * Analyze a user portfolio and generate recommendations
   */
  async analyzePortfolio(
    portfolioId: string,
    userId: string,
    analysisType: AnalysisType,
    options: AnalysisOptions = {}
  ) {
    const startTime = Date.now();

    try {
      // 1. Get portfolio data
      const portfolio = await this.getPortfolioData(portfolioId);

      // 2. Load active rules (NEW)
      const activeRuleSet = await this.rulesService.getActiveRuleSet();

      if (!activeRuleSet) {
        throw new Error('No active recommendation ruleset found. Please activate a ruleset in admin panel.');
      }

      // 3. Prepare context for AI with rules
      const context = await this.buildAnalysisContext(portfolio, options, activeRuleSet);

      // 4. Execute analysis with AI
      const analysisResult = await this.executeAIAnalysis(
        context,
        analysisType,
        activeRuleSet
      );

      // 5. Structure the result
      const structuredResult = await this.structureAnalysisResult(analysisResult);

      // 6. Save to database with ruleset reference
      const report = await this.saveAnalysisReport({
        userId,
        userPortfolioId: portfolioId,
        analysisType,
        processingTime: Date.now() - startTime,
        ruleSetId: activeRuleSet.id, // NEW: Track which ruleset was used
        ruleSetVersion: activeRuleSet.version, // NEW: Track version
        ...structuredResult,
      });

      return report;
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get portfolio data from database
   */
  private async getPortfolioData(portfolioId: string) {
    const portfolio = await db.userPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    return portfolio;
  }

  /**
   * Build analysis context with rules
   */
  private async buildAnalysisContext(
    portfolio: any,
    options: AnalysisOptions,
    ruleSet: any
  ): Promise<AnalysisContext> {
    return {
      portfolio,
      marketData: await this.getMarketData(),
      riskTolerance: options.riskTolerance || 'moderate',
      investmentGoal: options.investmentGoal || 'income',
      timeHorizon: options.timeHorizon || 'long',
      rules: ruleSet.rules, // NEW: Include rules in context
    };
  }

  /**
   * Get market data (placeholder for future implementation)
   */
  private async getMarketData() {
    // TODO: Implement market data fetching
    // This could fetch from an external API or database
    return {
      lastUpdated: new Date().toISOString(),
      indices: {},
      averages: {},
    };
  }

  /**
   * Execute AI analysis with rules
   */
  private async executeAIAnalysis(
    context: AnalysisContext,
    analysisType: AnalysisType,
    ruleSet: any
  ): Promise<any> {
    // Format rules for AI prompt
    const rulesPrompt = this.rulesService.formatRulesForAIPrompt(ruleSet.rules);

    // Build the complete prompt
    const prompt = this.buildAnalysisPrompt(context, analysisType, rulesPrompt);

    // TODO: Call AI service (Anthropic Claude, OpenAI, etc.)
    // For now, return a mock response
    console.log('AI Prompt:', prompt);

    // Mock response structure
    return {
      summary: 'Análise completa do portfólio de FIIs',
      currentAllocation: {},
      riskAssessment: {},
      performanceMetrics: {},
      recommendations: [],
    };
  }

  /**
   * Build AI prompt with rules
   */
  private buildAnalysisPrompt(
    context: AnalysisContext,
    analysisType: AnalysisType,
    rulesPrompt: string
  ): string {
    const basePrompt = `
Você é um especialista em análise de Fundos de Investimento Imobiliário (FIIs).
Analise o seguinte portfólio seguindo ESTRITAMENTE as regras fornecidas:

${rulesPrompt}

=== DADOS DO PORTFÓLIO ===
${JSON.stringify(context.portfolio, null, 2)}

=== PERFIL DO INVESTIDOR ===
- Tolerância ao risco: ${context.riskTolerance}
- Objetivo de investimento: ${context.investmentGoal}
- Horizonte de tempo: ${context.timeHorizon}

=== TIPO DE ANÁLISE SOLICITADA ===
${analysisType}

Por favor, forneça:
1. Resumo executivo da situação atual
2. Análise da alocação atual por segmento
3. Avaliação de riscos
4. Métricas de performance
5. Recomendações específicas baseadas nas regras configuradas

IMPORTANTE: Suas recomendações devem respeitar as regras fornecidas. Se você identificar uma oportunidade que está fora das regras, mencione-a mas indique claramente que está fora dos parâmetros configurados.
`;

    return basePrompt;
  }

  /**
   * Structure the AI analysis result
   */
  private async structureAnalysisResult(analysisResult: any) {
    return {
      summary: analysisResult.summary || '',
      currentAllocation: analysisResult.currentAllocation || {},
      riskAssessment: analysisResult.riskAssessment || {},
      performanceMetrics: analysisResult.performanceMetrics || {},
      recommendations: analysisResult.recommendations || [],
    };
  }

  /**
   * Save analysis report to database
   */
  private async saveAnalysisReport(data: any) {
    return db.analysisReport.create({
      data: {
        userId: data.userId,
        userPortfolioId: data.userPortfolioId,
        analysisType: data.analysisType,
        summary: data.summary,
        currentAllocation: data.currentAllocation,
        riskAssessment: data.riskAssessment,
        performanceMetrics: data.performanceMetrics,
        recommendations: data.recommendations,
        processingTime: data.processingTime,
        ruleSetId: data.ruleSetId, // NEW: Store ruleset reference
        ruleSetVersion: data.ruleSetVersion, // NEW: Store version used
        creditsUsed: 10, // TODO: Calculate based on complexity
      },
    });
  }

  /**
   * Get analysis report with rules metadata
   */
  async getAnalysisReport(reportId: string) {
    return db.analysisReport.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        userPortfolio: true,
        ruleSet: {
          select: {
            id: true,
            name: true,
            version: true,
            metadata: true,
          },
        },
        investmentRecommendations: true,
      },
    });
  }
}