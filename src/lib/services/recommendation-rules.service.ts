import { db } from '@/lib/db';
import { z } from 'zod';
import * as XLSX from 'xlsx';

// Import types from generated Prisma client
type RecommendationRuleSet = {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  rules: any;
  metadata: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type RecommendationRuleVersion = {
  id: string;
  ruleSetId: string;
  version: number;
  rules: any;
  changesSummary: string;
  createdBy: string;
  createdAt: Date;
};

// Validation schemas
const CapitalRangeSchema = z.object({
  minCapital: z.number().min(0),
  maxCapital: z.number().nullable(),
  minFunds: z.number().int().min(1),
  maxFunds: z.number().int().min(1),
  recommended: z.number().int().min(1),
});

const SegmentRuleSchema = z.object({
  min: z.number().int().min(0),
  max: z.number().int().min(0),
  recommended: z.number().int().min(0),
});

const PercentageRuleSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
  recommended: z.number().min(0).max(100),
});

const RecommendationRuleSetSchema = z.object({
  name: z.string().min(1).max(255),
  rules: z.object({
    fundCountByCapital: z.object({
      ranges: z.array(CapitalRangeSchema),
    }),
    mandatorySegments: z.object({
      segments: z.array(z.string()),
      alertOnMissing: z.boolean(),
    }),
    fundsPerSegment: z.object({
      byCapitalRange: z.array(z.object({
        minCapital: z.number().min(0),
        maxCapital: z.number().nullable(),
        segmentRules: z.record(z.string(), SegmentRuleSchema),
      })),
    }),
    allocationPercentage: z.object({
      segments: z.record(z.string(), PercentageRuleSchema),
      alertOnOutOfRange: z.boolean(),
    }),
    tijoloPapelBalance: z.object({
      tijolo: z.object({
        segments: z.array(z.string()),
        minPercentage: z.number().min(0).max(100),
        maxPercentage: z.number().min(0).max(100),
        recommendedPercentage: z.number().min(0).max(100),
      }),
      papel: z.object({
        segments: z.array(z.string()),
        minPercentage: z.number().min(0).max(100),
        maxPercentage: z.number().min(0).max(100),
        recommendedPercentage: z.number().min(0).max(100),
      }),
      alertOnImbalance: z.boolean(),
    }),
    alternativeFunds: z.object({
      categories: z.array(z.string()),
      maxPercentage: z.number().min(0).max(100),
      idealMaxPercentage: z.number().min(0).max(100),
      alertThreshold: z.number().min(0).max(100),
    }),
    intraSegmentBalance: z.object({
      enabled: z.boolean(),
      maxDeviationPercentage: z.number().min(0).max(100),
      alertOnImbalance: z.boolean(),
    }),
    general: z.object({
      enforceStrictCompliance: z.boolean(),
      allowOverrides: z.boolean(),
      confidenceThreshold: z.number().min(0).max(1),
    }),
  }),
  metadata: z.object({
    source: z.enum(['manual', 'excel_upload', 'api_import']),
    description: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export type RecommendationRuleSetInput = z.infer<typeof RecommendationRuleSetSchema>;

export class RecommendationRulesService {
  /**
   * Get the currently active ruleset
   */
  async getActiveRuleSet(): Promise<RecommendationRuleSet | null> {
    return db.recommendationRuleSet.findFirst({
      where: { isActive: true },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Get all rulesets
   */
  async getAllRuleSets() {
    return db.recommendationRuleSet.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific ruleset by ID
   */
  async getRuleSetById(ruleSetId: string) {
    return db.recommendationRuleSet.findUnique({
      where: { id: ruleSetId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Create a new ruleset
   */
  async createRuleSet(
    data: RecommendationRuleSetInput,
    createdBy: string
  ): Promise<RecommendationRuleSet> {
    // Validate input
    const validatedData = RecommendationRuleSetSchema.parse(data);

    return db.$transaction(async (tx) => {
      // Create the ruleset
      const ruleSet = await tx.recommendationRuleSet.create({
        data: {
          name: validatedData.name,
          version: 1,
          isActive: false,
          rules: validatedData.rules as any,
          metadata: validatedData.metadata as any,
          createdBy,
        },
      });

      // Create first version
      await tx.recommendationRuleVersion.create({
        data: {
          ruleSetId: ruleSet.id,
          version: 1,
          rules: validatedData.rules as any,
          changesSummary: 'Criação inicial do ruleset',
          createdBy,
        },
      });

      return ruleSet;
    });
  }

  /**
   * Update an existing ruleset (creates a new version)
   */
  async updateRuleSet(
    ruleSetId: string,
    updates: Partial<RecommendationRuleSetInput>,
    changesSummary: string,
    updatedBy: string
  ): Promise<RecommendationRuleSet> {
    return db.$transaction(async (tx) => {
      // Get current ruleset
      const current = await tx.recommendationRuleSet.findUniqueOrThrow({
        where: { id: ruleSetId },
      });

      // Increment version
      const newVersion = current.version + 1;

      // Prepare update data
      const updateData: any = {
        version: newVersion,
        updatedAt: new Date(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.rules) updateData.rules = updates.rules as any;
      if (updates.metadata) updateData.metadata = updates.metadata as any;

      // Update ruleset
      const updated = await tx.recommendationRuleSet.update({
        where: { id: ruleSetId },
        data: updateData,
      });

      // Create version history
      await tx.recommendationRuleVersion.create({
        data: {
          ruleSetId,
          version: newVersion,
          rules: updated.rules,
          changesSummary,
          createdBy: updatedBy,
        },
      });

      return updated;
    });
  }

  /**
   * Activate a ruleset (deactivates all others)
   */
  async activateRuleSet(ruleSetId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      // Deactivate all rulesets
      await tx.recommendationRuleSet.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Activate the selected one
      await tx.recommendationRuleSet.update({
        where: { id: ruleSetId },
        data: { isActive: true },
      });
    });
  }

  /**
   * Delete a ruleset
   */
  async deleteRuleSet(ruleSetId: string): Promise<void> {
    // Check if it's the active ruleset
    const ruleSet = await db.recommendationRuleSet.findUnique({
      where: { id: ruleSetId },
    });

    if (ruleSet?.isActive) {
      throw new Error('Cannot delete the active ruleset. Please activate another ruleset first.');
    }

    await db.recommendationRuleSet.delete({
      where: { id: ruleSetId },
    });
  }

  /**
   * Get version history for a ruleset
   */
  async getVersionHistory(ruleSetId: string): Promise<RecommendationRuleVersion[]> {
    return db.recommendationRuleVersion.findMany({
      where: { ruleSetId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    ruleSetId: string,
    targetVersion: number,
    userId: string
  ): Promise<RecommendationRuleSet> {
    return db.$transaction(async (tx) => {
      // Find the target version
      const targetVersionData = await tx.recommendationRuleVersion.findUniqueOrThrow({
        where: {
          ruleSetId_version: {
            ruleSetId,
            version: targetVersion,
          },
        },
      });

      // Update to the target version (creates a new version)
      return this.updateRuleSet(
        ruleSetId,
        { rules: targetVersionData.rules as any },
        `Rollback para versão ${targetVersion}`,
        userId
      );
    });
  }

  /**
   * Process Excel upload and create ruleset
   */
  async createRuleSetFromExcel(
    fileBuffer: Buffer,
    fileName: string,
    name: string,
    createdBy: string
  ): Promise<RecommendationRuleSet> {
    const rules = await this.parseExcelToRules(fileBuffer);

    return this.createRuleSet(
      {
        name,
        rules,
        metadata: {
          source: 'excel_upload',
          description: `Importado do arquivo: ${fileName}`,
        },
      },
      createdBy
    );
  }

  /**
   * Parse Excel file to rules structure
   */
  private async parseExcelToRules(fileBuffer: Buffer): Promise<any> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    const rules: any = {
      fundCountByCapital: { ranges: [] },
      mandatorySegments: { segments: [], alertOnMissing: true },
      fundsPerSegment: { byCapitalRange: [] },
      allocationPercentage: { segments: {}, alertOnOutOfRange: true },
      tijoloPapelBalance: { tijolo: {}, papel: {}, alertOnImbalance: true },
      alternativeFunds: {
        categories: ['AGRO', 'INFRA', 'HIBRIDOS', 'FOFS', 'EDUCACIONAL', 'DESENVOLVIMENTO'],
        maxPercentage: 15,
        idealMaxPercentage: 10,
        alertThreshold: 12
      },
      intraSegmentBalance: { enabled: true, maxDeviationPercentage: 10, alertOnImbalance: true },
      general: { enforceStrictCompliance: false, allowOverrides: true, confidenceThreshold: 0.7 },
    };

    // Parse "Fundos por Capital"
    const fundCountSheet = workbook.Sheets['Fundos por Capital'];
    if (fundCountSheet) {
      const data = XLSX.utils.sheet_to_json(fundCountSheet);
      rules.fundCountByCapital.ranges = data.map((row: any) => ({
        minCapital: Number(row['Min Capital']),
        maxCapital: row['Max Capital'] ? Number(row['Max Capital']) : null,
        minFunds: Number(row['Min Fundos']),
        maxFunds: Number(row['Max Fundos']),
        recommended: Number(row['Recomendado']),
      }));
    }

    // Parse "Segmentos Obrigatórios"
    const mandatorySegmentsSheet = workbook.Sheets['Segmentos Obrigatórios'];
    if (mandatorySegmentsSheet) {
      const data = XLSX.utils.sheet_to_json(mandatorySegmentsSheet);
      rules.mandatorySegments.segments = data
        .filter((row: any) => row['Obrigatório']?.toUpperCase() === 'SIM')
        .map((row: any) => this.normalizeSegmentName(row['Segmento']));
    }

    // Parse funds per segment sheets (nomes abreviados por limite de 31 chars do Excel)
    const capitalRanges = [
      { sheet: 'Fundos Seg - Cap < 30K', minCapital: 0, maxCapital: 30000 },
      { sheet: 'Fundos Seg - Cap 30K-100K', minCapital: 30000, maxCapital: 100000 },
      { sheet: 'Fundos Seg - Cap > 100K', minCapital: 100000, maxCapital: null },
    ];

    for (const range of capitalRanges) {
      const sheet = workbook.Sheets[range.sheet];
      if (sheet) {
        const data = XLSX.utils.sheet_to_json(sheet);
        const segmentRules: any = {};

        for (const row of data as any[]) {
          const segment = this.normalizeSegmentName(row['Segmento']);
          segmentRules[segment] = {
            min: Number(row['Min']),
            max: Number(row['Max']),
            recommended: Number(row['Recomendado']),
          };
        }

        rules.fundsPerSegment.byCapitalRange.push({
          minCapital: range.minCapital,
          maxCapital: range.maxCapital,
          segmentRules,
        });
      }
    }

    // Parse "Alocação Percentual"
    const allocationSheet = workbook.Sheets['Alocação Percentual'];
    if (allocationSheet) {
      const data = XLSX.utils.sheet_to_json(allocationSheet);
      for (const row of data as any[]) {
        const segment = this.normalizeSegmentName(row['Segmento']);
        rules.allocationPercentage.segments[segment] = {
          min: Number(row['Min %']),
          max: Number(row['Max %']),
          recommended: Number(row['Recomendado %']),
        };
      }
    }

    // Parse "Tijolo vs Papel"
    const tijoloPapelSheet = workbook.Sheets['Tijolo vs Papel'];
    if (tijoloPapelSheet) {
      const data = XLSX.utils.sheet_to_json(tijoloPapelSheet);
      for (const row of data as any[]) {
        const type = row['Tipo']?.toLowerCase();
        const config = {
          segments: row['Segmentos'].split(',').map((s: string) => this.normalizeSegmentName(s.trim())),
          minPercentage: Number(row['Min %']),
          maxPercentage: Number(row['Max %']),
          recommendedPercentage: Number(row['Recomendado %']),
        };

        if (type === 'tijolo') {
          rules.tijoloPapelBalance.tijolo = config;
        } else if (type === 'papel') {
          rules.tijoloPapelBalance.papel = config;
        }
      }
    }

    // Parse "Alternativos"
    const alternativosSheet = workbook.Sheets['Alternativos'];
    if (alternativosSheet) {
      const data = XLSX.utils.sheet_to_json(alternativosSheet);
      const firstRow = data[0] as any;
      if (firstRow) {
        rules.alternativeFunds.maxPercentage = Number(firstRow['Max % Total']);
        rules.alternativeFunds.idealMaxPercentage = Number(firstRow['Ideal Max %']);
      }
    }

    // Parse "Configurações Gerais"
    const configSheet = workbook.Sheets['Configurações Gerais'];
    if (configSheet) {
      const data = XLSX.utils.sheet_to_json(configSheet);
      const configMap = (data as any[]).reduce((acc: any, row: any) => {
        acc[row['Configuração']] = row['Valor'];
        return acc;
      }, {});

      rules.general = {
        enforceStrictCompliance: configMap['Aplicar Regras Estritamente']?.toUpperCase() === 'SIM',
        allowOverrides: configMap['Permitir Exceções']?.toUpperCase() === 'SIM',
        confidenceThreshold: Number(configMap['Confiança Mínima IA']),
      };

      if (configMap['Desvio Máximo Intra-Segmento']) {
        rules.intraSegmentBalance.maxDeviationPercentage = parseFloat(
          String(configMap['Desvio Máximo Intra-Segmento']).replace('%', '')
        );
      }
    }

    return rules;
  }

  /**
   * Normalize segment names to standard format
   */
  private normalizeSegmentName(name: string): string {
    const map: Record<string, string> = {
      'Lajes': 'LAJES',
      'Lajes Corporativas': 'LAJES',
      'Logística': 'LOGISTICA',
      'Shopping': 'SHOPPING',
      'Varejo/Renda Urbana': 'VAREJO_RENDA_URBANA',
      'Papel': 'PAPEL',
      'Alternativos': 'ALTERNATIVOS',
    };

    return map[name] || name.toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Generate Excel template for download
   */
  async generateExcelTemplate(): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Fundos por Capital
    const fundCountData = [
      { 'Min Capital': 0, 'Max Capital': 30000, 'Min Fundos': 1, 'Max Fundos': 10, 'Recomendado': 8 },
      { 'Min Capital': 30000, 'Max Capital': 100000, 'Min Fundos': 10, 'Max Fundos': 15, 'Recomendado': 12 },
      { 'Min Capital': 100000, 'Max Capital': '', 'Min Fundos': 15, 'Max Fundos': 20, 'Recomendado': 18 },
    ];
    const fundCountSheet = XLSX.utils.json_to_sheet(fundCountData);
    XLSX.utils.book_append_sheet(workbook, fundCountSheet, 'Fundos por Capital');

    // Sheet 2: Segmentos Obrigatórios
    const mandatorySegmentsData = [
      { 'Segmento': 'Lajes', 'Obrigatório': 'SIM' },
      { 'Segmento': 'Logística', 'Obrigatório': 'SIM' },
      { 'Segmento': 'Shopping', 'Obrigatório': 'SIM' },
      { 'Segmento': 'Varejo/Renda Urbana', 'Obrigatório': 'SIM' },
      { 'Segmento': 'Papel', 'Obrigatório': 'SIM' },
    ];
    const mandatorySegmentsSheet = XLSX.utils.json_to_sheet(mandatorySegmentsData);
    XLSX.utils.book_append_sheet(workbook, mandatorySegmentsSheet, 'Segmentos Obrigatórios');

    // Sheets 3-5: Fundos por Segmento (3 capital ranges)
    // Nomes limitados a 31 caracteres (limite do Excel)
    const segmentTemplates = [
      {
        name: 'Fundos Seg - Cap < 30K',
        data: [
          { 'Segmento': 'Lajes', 'Min': 1, 'Max': 1, 'Recomendado': 1 },
          { 'Segmento': 'Logística', 'Min': 2, 'Max': 2, 'Recomendado': 2 },
          { 'Segmento': 'Shopping', 'Min': 2, 'Max': 2, 'Recomendado': 2 },
          { 'Segmento': 'Varejo/Renda Urbana', 'Min': 1, 'Max': 2, 'Recomendado': 1 },
          { 'Segmento': 'Papel', 'Min': 3, 'Max': 3, 'Recomendado': 3 },
          { 'Segmento': 'Alternativos', 'Min': 0, 'Max': 2, 'Recomendado': 1 },
        ],
      },
      {
        name: 'Fundos Seg - Cap 30K-100K',
        data: [
          { 'Segmento': 'Lajes', 'Min': 2, 'Max': 2, 'Recomendado': 2 },
          { 'Segmento': 'Logística', 'Min': 2, 'Max': 3, 'Recomendado': 2 },
          { 'Segmento': 'Shopping', 'Min': 2, 'Max': 3, 'Recomendado': 3 },
          { 'Segmento': 'Varejo/Renda Urbana', 'Min': 2, 'Max': 2, 'Recomendado': 2 },
          { 'Segmento': 'Papel', 'Min': 3, 'Max': 5, 'Recomendado': 4 },
          { 'Segmento': 'Alternativos', 'Min': 0, 'Max': 3, 'Recomendado': 2 },
        ],
      },
      {
        name: 'Fundos Seg - Cap > 100K',
        data: [
          { 'Segmento': 'Lajes', 'Min': 2, 'Max': 2, 'Recomendado': 2 },
          { 'Segmento': 'Logística', 'Min': 2, 'Max': 3, 'Recomendado': 3 },
          { 'Segmento': 'Shopping', 'Min': 2, 'Max': 3, 'Recomendado': 3 },
          { 'Segmento': 'Varejo/Renda Urbana', 'Min': 2, 'Max': 2, 'Recomendado': 2 },
          { 'Segmento': 'Papel', 'Min': 5, 'Max': 6, 'Recomendado': 5 },
          { 'Segmento': 'Alternativos', 'Min': 0, 'Max': 4, 'Recomendado': 3 },
        ],
      },
    ];

    for (const template of segmentTemplates) {
      const sheet = XLSX.utils.json_to_sheet(template.data);
      XLSX.utils.book_append_sheet(workbook, sheet, template.name);
    }

    // Sheet 6: Alocação Percentual
    const allocationData = [
      { 'Segmento': 'Lajes', 'Min %': 5, 'Max %': 10, 'Recomendado %': 7 },
      { 'Segmento': 'Logística', 'Min %': 15, 'Max %': 20, 'Recomendado %': 18 },
      { 'Segmento': 'Shopping', 'Min %': 15, 'Max %': 20, 'Recomendado %': 18 },
      { 'Segmento': 'Varejo/Renda Urbana', 'Min %': 10, 'Max %': 15, 'Recomendado %': 12 },
      { 'Segmento': 'Papel', 'Min %': 30, 'Max %': 40, 'Recomendado %': 35 },
      { 'Segmento': 'Alternativos', 'Min %': 0, 'Max %': 10, 'Recomendado %': 5 },
    ];
    const allocationSheet = XLSX.utils.json_to_sheet(allocationData);
    XLSX.utils.book_append_sheet(workbook, allocationSheet, 'Alocação Percentual');

    // Sheet 7: Tijolo vs Papel
    const tijoloPapelData = [
      { 'Tipo': 'Tijolo', 'Segmentos': 'Lajes, Logística, Shopping, Varejo/Renda Urbana', 'Min %': 50, 'Max %': 70, 'Recomendado %': 60 },
      { 'Tipo': 'Papel', 'Segmentos': 'Papel', 'Min %': 30, 'Max %': 40, 'Recomendado %': 35 },
    ];
    const tijoloPapelSheet = XLSX.utils.json_to_sheet(tijoloPapelData);
    XLSX.utils.book_append_sheet(workbook, tijoloPapelSheet, 'Tijolo vs Papel');

    // Sheet 8: Alternativos
    const alternativosData = [
      { 'Categoria': 'Todos', 'Max % Total': 15, 'Ideal Max %': 10 },
    ];
    const alternativosSheet = XLSX.utils.json_to_sheet(alternativosData);
    XLSX.utils.book_append_sheet(workbook, alternativosSheet, 'Alternativos');

    // Sheet 9: Configurações Gerais
    const configData = [
      { 'Configuração': 'Aplicar Regras Estritamente', 'Valor': 'NÃO' },
      { 'Configuração': 'Permitir Exceções', 'Valor': 'SIM' },
      { 'Configuração': 'Confiança Mínima IA', 'Valor': '0.7' },
      { 'Configuração': 'Desvio Máximo Intra-Segmento', 'Valor': '10%' },
    ];
    const configSheet = XLSX.utils.json_to_sheet(configData);
    XLSX.utils.book_append_sheet(workbook, configSheet, 'Configurações Gerais');

    // Convert to buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * Format rules for AI prompt
   */
  formatRulesForAIPrompt(rules: any): string {
    return `
REGRAS DE RECOMENDAÇÃO DE PORTFÓLIO FII

1. DETERMINAÇÃO DO NÚMERO DE FUNDOS POR CAPITAL
${this.formatFundCountRules(rules.fundCountByCapital)}

2. SEGMENTOS OBRIGATÓRIOS
${this.formatMandatorySegments(rules.mandatorySegments)}

3. QUANTIDADE DE FUNDOS POR SEGMENTO
${this.formatFundsPerSegment(rules.fundsPerSegment)}

4. PERCENTUAL DE ALOCAÇÃO POR SEGMENTO
${this.formatAllocationPercentage(rules.allocationPercentage)}

5. BALANCEAMENTO TIJOLO VS PAPEL
${this.formatTijoloPapelBalance(rules.tijoloPapelBalance)}

6. FUNDOS ALTERNATIVOS
${this.formatAlternativeFunds(rules.alternativeFunds)}

7. BALANCEAMENTO INTRA-SEGMENTO
${this.formatIntraSegmentBalance(rules.intraSegmentBalance)}

8. CONFIGURAÇÕES GERAIS
${this.formatGeneralConfig(rules.general)}

IMPORTANTE: ${rules.general.enforceStrictCompliance
  ? 'As regras devem ser seguidas ESTRITAMENTE. Não recomende portfólios fora dos parâmetros.'
  : 'As regras são diretrizes. Justifique exceções quando necessário.'}
`;
  }

  // Helper formatting methods
  private formatFundCountRules(rules: any): string {
    return rules.ranges
      .map((range: any) => {
        const maxCapital = range.maxCapital ? `R$ ${range.maxCapital.toLocaleString()}` : 'sem limite';
        return `- Capital entre R$ ${range.minCapital.toLocaleString()} e ${maxCapital}: ${range.minFunds}-${range.maxFunds} fundos (recomendado: ${range.recommended})`;
      })
      .join('\n');
  }

  private formatMandatorySegments(rules: any): string {
    return `Segmentos obrigatórios:\n${rules.segments.map((s: string) => `- ${s}`).join('\n')}`;
  }

  private formatFundsPerSegment(rules: any): string {
    return rules.byCapitalRange
      .map((range: any) => {
        const maxCapital = range.maxCapital ? `R$ ${range.maxCapital.toLocaleString()}` : 'sem limite';
        const header = `\nCapital entre R$ ${range.minCapital.toLocaleString()} e ${maxCapital}:`;
        const segments = Object.entries(range.segmentRules)
          .map(([segment, rule]: [string, any]) => {
            return `  - ${segment}: ${rule.min}-${rule.max} fundos (recomendado: ${rule.recommended})`;
          })
          .join('\n');
        return header + '\n' + segments;
      })
      .join('\n');
  }

  private formatAllocationPercentage(rules: any): string {
    return Object.entries(rules.segments)
      .map(([segment, rule]: [string, any]) => {
        return `- ${segment}: ${rule.min}%-${rule.max}% (recomendado: ${rule.recommended}%)`;
      })
      .join('\n');
  }

  private formatTijoloPapelBalance(rules: any): string {
    return `
- Tijolo (${rules.tijolo.segments.join(', ')}): ${rules.tijolo.minPercentage}%-${rules.tijolo.maxPercentage}% (recomendado: ${rules.tijolo.recommendedPercentage}%)
- Papel (${rules.papel.segments.join(', ')}): ${rules.papel.minPercentage}%-${rules.papel.maxPercentage}% (recomendado: ${rules.papel.recommendedPercentage}%)`;
  }

  private formatAlternativeFunds(rules: any): string {
    return `
- Categorias: ${rules.categories.join(', ')}
- Máximo: ${rules.maxPercentage}% (ideal: ${rules.idealMaxPercentage}%)`;
  }

  private formatIntraSegmentBalance(rules: any): string {
    if (!rules.enabled) return 'Balanceamento intra-segmento desabilitado';
    return `Desvio máximo de ${rules.maxDeviationPercentage}% da divisão igual dentro de cada segmento`;
  }

  private formatGeneralConfig(rules: any): string {
    return `
- Confiança mínima da IA: ${(rules.confidenceThreshold * 100).toFixed(0)}%
- Permitir exceções: ${rules.allowOverrides ? 'Sim' : 'Não'}`;
  }
}