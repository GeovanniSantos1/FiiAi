# Plan-001: Sistema de Regras Configuráveis para Recomendação de FII

**Data:** 2025-09-29
**Agente Responsável:** Product Agent (coordenação com Backend e Frontend)
**Módulo:** Admin + Avaliação de Carteira
**Prioridade:** P0 (Alta)
**Estimativa:** 8-10 dias

---

## 📋 Sumário Executivo

Implementar um sistema de regras configuráveis no módulo admin que permita ao administrador definir e ajustar os parâmetros utilizados pela IA para gerar recomendações de portfólio de FIIs. Atualmente, as regras estão hardcoded no prompt da IA. A solução proposta cria uma interface admin para gerenciar regras através de formulários ou upload de arquivos Excel, armazenando-as no banco de dados e injetando-as dinamicamente nos prompts de análise.

---

## 🎯 Objetivos e Valor de Negócio

### **Objetivos:**
1. Permitir configuração dinâmica de regras de recomendação sem deploy de código
2. Criar interface admin intuitiva para gestão de regras
3. Versionar regras para auditoria e rollback
4. Flexibilizar critérios de análise conforme evolução do mercado FII
5. Suportar múltiplas fontes de configuração (formulário web e Excel)

### **Valor de Negócio:**
- **Agilidade:** Ajustes em tempo real sem necessidade de desenvolvimento
- **Qualidade:** Refinamento contínuo das recomendações baseado em feedback
- **Compliance:** Auditoria completa de mudanças nas regras
- **Escalabilidade:** Base para personalização por perfil de investidor
- **Diferenciação:** Capacidade de adaptar análises rapidamente ao mercado

### **Métricas de Sucesso:**
- Redução de 90% no tempo para ajustar regras (de 2 dias para 2 horas)
- 100% das análises usando regras configuráveis em 2 semanas
- Zero regressões em análises existentes
- Satisfação admin: NPS > 8 na interface de configuração

---

## 🔍 Análise do Problema Atual

### **Situação Atual:**
- Regras de recomendação hardcoded no código dos prompts de IA
- 6 categorias principais de regras:
  1. Determinação de número de fundos por capital
  2. Distribuição por segmentos principais
  3. Percentual de alocação por segmento
  4. Balanceamento tijolo vs papel
  5. Limites de fundos alternativos
  6. Compatibilidade segmento/quantidade

### **Problemas Identificados:**
- ❌ Mudanças exigem alteração de código e deploy
- ❌ Sem histórico de versões das regras
- ❌ Impossibilidade de A/B testing de regras diferentes
- ❌ Dificuldade para testar novos critérios
- ❌ Falta de flexibilidade para mercado dinâmico

### **User Stories Afetadas:**
```typescript
// Administrador
"Como administrador, quero configurar regras de recomendação
sem precisar de desenvolvedor, para adaptar rapidamente às
mudanças do mercado FII"

// Analista de Produto
"Como analista, quero testar diferentes configurações de regras
para identificar quais geram melhores recomendações"

// Usuário Final (indireto)
"Como investidor, quero receber recomendações baseadas em
critérios atualizados e alinhados com o mercado atual"
```

---

## 🏗️ Solução Proposta

### **Arquitetura da Solução**

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN INTERFACE                      │
├─────────────────────────────────────────────────────────┤
│  1. Configuração Manual (Formulário Web)                │
│     ├─ Editor visual de regras                          │
│     ├─ Validação em tempo real                          │
│     └─ Preview de impacto                               │
│                                                          │
│  2. Upload de Arquivo Excel                             │
│     ├─ Template padronizado para download               │
│     ├─ Validação de estrutura                           │
│     └─ Preview antes de salvar                          │
│                                                          │
│  3. Gestão de Versões                                   │
│     ├─ Histórico de mudanças                            │
│     ├─ Rollback para versão anterior                    │
│     ├─ Comparação entre versões                         │
│     └─ Auditoria de quem/quando alterou                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    BACKEND API                          │
├─────────────────────────────────────────────────────────┤
│  POST   /api/admin/recommendation-rules                 │
│  GET    /api/admin/recommendation-rules                 │
│  PUT    /api/admin/recommendation-rules/:id             │
│  DELETE /api/admin/recommendation-rules/:id             │
│  POST   /api/admin/recommendation-rules/upload-excel    │
│  GET    /api/admin/recommendation-rules/download-template│
│  GET    /api/admin/recommendation-rules/:id/versions    │
│  POST   /api/admin/recommendation-rules/:id/rollback    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                │
├─────────────────────────────────────────────────────────┤
│  RecommendationRuleSet (tabela principal)               │
│  ├─ id: string (UUID)                                   │
│  ├─ name: string                                        │
│  ├─ version: int                                        │
│  ├─ isActive: boolean                                   │
│  ├─ rules: json (estrutura de regras)                   │
│  ├─ createdBy: string (userId)                          │
│  ├─ createdAt: datetime                                 │
│  ├─ updatedAt: datetime                                 │
│  └─ metadata: json (source, notes, etc)                 │
│                                                          │
│  RecommendationRuleVersion (histórico)                  │
│  ├─ id: string (UUID)                                   │
│  ├─ ruleSetId: string (FK)                              │
│  ├─ version: int                                        │
│  ├─ rules: json                                         │
│  ├─ changesSummary: string                              │
│  ├─ createdBy: string                                   │
│  └─ createdAt: datetime                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              AI ANALYSIS SERVICE (Integração)           │
├─────────────────────────────────────────────────────────┤
│  1. Carregar regras ativas do banco                     │
│  2. Injetar regras no prompt de análise                 │
│  3. Executar análise com Claude/GPT                     │
│  4. Validar saída contra regras configuradas            │
│  5. Retornar recomendações ao usuário                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Estrutura de Dados das Regras

### **Schema JSON das Regras**

```typescript
interface RecommendationRuleSet {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  rules: {
    // Regra 1: Número de fundos por capital
    fundCountByCapital: {
      ranges: [
        {
          minCapital: 0,
          maxCapital: 30000,
          minFunds: 1,
          maxFunds: 10,
          recommended: 8,
        },
        {
          minCapital: 30000,
          maxCapital: 100000,
          minFunds: 10,
          maxFunds: 15,
          recommended: 12,
        },
        {
          minCapital: 100000,
          maxCapital: null, // sem limite superior
          minFunds: 15,
          maxFunds: 20,
          recommended: 18,
        },
      ];
    };

    // Regra 2: Segmentos principais obrigatórios
    mandatorySegments: {
      segments: [
        'LAJES',
        'LOGISTICA',
        'SHOPPING',
        'VAREJO_RENDA_URBANA',
        'PAPEL',
      ];
      alertOnMissing: true;
    };

    // Regra 3: Quantidade de fundos por segmento
    fundsPerSegment: {
      byCapitalRange: [
        {
          minCapital: 0,
          maxCapital: 30000,
          segmentRules: {
            LAJES: { min: 1, max: 1, recommended: 1 },
            LOGISTICA: { min: 2, max: 2, recommended: 2 },
            SHOPPING: { min: 2, max: 2, recommended: 2 },
            VAREJO_RENDA_URBANA: { min: 1, max: 2, recommended: 1 },
            PAPEL: { min: 3, max: 3, recommended: 3 },
            ALTERNATIVOS: { min: 0, max: 2, recommended: 1 },
          },
        },
        {
          minCapital: 30000,
          maxCapital: 100000,
          segmentRules: {
            LAJES: { min: 2, max: 2, recommended: 2 },
            LOGISTICA: { min: 2, max: 3, recommended: 2 },
            SHOPPING: { min: 2, max: 3, recommended: 3 },
            VAREJO_RENDA_URBANA: { min: 2, max: 2, recommended: 2 },
            PAPEL: { min: 3, max: 5, recommended: 4 },
            ALTERNATIVOS: { min: 0, max: 3, recommended: 2 },
          },
        },
        {
          minCapital: 100000,
          maxCapital: null,
          segmentRules: {
            LAJES: { min: 2, max: 2, recommended: 2 },
            LOGISTICA: { min: 2, max: 3, recommended: 3 },
            SHOPPING: { min: 2, max: 3, recommended: 3 },
            VAREJO_RENDA_URBANA: { min: 2, max: 2, recommended: 2 },
            PAPEL: { min: 5, max: 6, recommended: 5 },
            ALTERNATIVOS: { min: 0, max: 4, recommended: 3 },
          },
        },
      ];
    };

    // Regra 4: Percentual de alocação por segmento
    allocationPercentage: {
      segments: {
        LAJES: { min: 5, max: 10, recommended: 7 },
        LOGISTICA: { min: 15, max: 20, recommended: 18 },
        SHOPPING: { min: 15, max: 20, recommended: 18 },
        VAREJO_RENDA_URBANA: { min: 10, max: 15, recommended: 12 },
        PAPEL: { min: 30, max: 40, recommended: 35 },
        ALTERNATIVOS: { min: 0, max: 10, recommended: 5 },
      };
      alertOnOutOfRange: true;
    };

    // Regra 5: Balanceamento Tijolo vs Papel
    tijoloPapelBalance: {
      tijolo: {
        segments: ['LAJES', 'LOGISTICA', 'SHOPPING', 'VAREJO_RENDA_URBANA'],
        minPercentage: 50,
        maxPercentage: 70,
        recommendedPercentage: 60,
      };
      papel: {
        segments: ['PAPEL'],
        minPercentage: 30,
        maxPercentage: 40,
        recommendedPercentage: 35,
      };
      alertOnImbalance: true;
    };

    // Regra 6: Fundos Alternativos
    alternativeFunds: {
      categories: [
        'AGRO',
        'INFRA',
        'HIBRIDOS',
        'FOFS',
        'EDUCACIONAL',
        'DESENVOLVIMENTO',
      ];
      maxPercentage: 15;
      idealMaxPercentage: 10;
      alertThreshold: 12;
    };

    // Regra 7: Balanceamento dentro do segmento
    intraSegmentBalance: {
      enabled: true;
      maxDeviationPercentage: 10; // Desvio máximo de 10% da divisão igual
      alertOnImbalance: true;
    };

    // Regra 8: Configurações gerais
    general: {
      enforceStrictCompliance: false; // Se true, bloqueia análise fora das regras
      allowOverrides: true; // Se true, permite justificativas para exceções
      confidenceThreshold: 0.7; // Confiança mínima da IA (0-1)
    };
  };
  metadata: {
    source: 'manual' | 'excel_upload' | 'api_import';
    description?: string;
    notes?: string;
    tags?: string[];
  };
  createdBy: string; // userId
  createdAt: Date;
  updatedAt: Date;
}
```

### **Schema do Arquivo Excel (Template)**

```
Planilha: "Fundos por Capital"
| Min Capital | Max Capital | Min Fundos | Max Fundos | Recomendado |
|-------------|-------------|------------|------------|-------------|
| 0           | 30000       | 1          | 10         | 8           |
| 30000       | 100000      | 10         | 15         | 12          |
| 100000      |             | 15         | 20         | 18          |

Planilha: "Segmentos Obrigatórios"
| Segmento            | Obrigatório |
|---------------------|-------------|
| Lajes               | SIM         |
| Logística           | SIM         |
| Shopping            | SIM         |
| Varejo/Renda Urbana | SIM         |
| Papel               | SIM         |

Planilha: "Fundos por Segmento - Capital < 30K"
| Segmento            | Min | Max | Recomendado |
|---------------------|-----|-----|-------------|
| Lajes               | 1   | 1   | 1           |
| Logística           | 2   | 2   | 2           |
| Shopping            | 2   | 2   | 2           |
| Varejo/Renda Urbana | 1   | 2   | 1           |
| Papel               | 3   | 3   | 3           |
| Alternativos        | 0   | 2   | 1           |

Planilha: "Fundos por Segmento - Capital 30K-100K"
| Segmento            | Min | Max | Recomendado |
|---------------------|-----|-----|-------------|
| Lajes               | 2   | 2   | 2           |
| Logística           | 2   | 3   | 2           |
| Shopping            | 2   | 3   | 3           |
| Varejo/Renda Urbana | 2   | 2   | 2           |
| Papel               | 3   | 5   | 4           |
| Alternativos        | 0   | 3   | 2           |

Planilha: "Fundos por Segmento - Capital > 100K"
| Segmento            | Min | Max | Recomendado |
|---------------------|-----|-----|-------------|
| Lajes               | 2   | 2   | 2           |
| Logística           | 2   | 3   | 3           |
| Shopping            | 2   | 3   | 3           |
| Varejo/Renda Urbana | 2   | 2   | 2           |
| Papel               | 5   | 6   | 5           |
| Alternativos        | 0   | 4   | 3           |

Planilha: "Alocação Percentual"
| Segmento            | Min % | Max % | Recomendado % |
|---------------------|-------|-------|---------------|
| Lajes               | 5     | 10    | 7             |
| Logística           | 15    | 20    | 18            |
| Shopping            | 15    | 20    | 18            |
| Varejo/Renda Urbana | 10    | 15    | 12            |
| Papel               | 30    | 40    | 35            |
| Alternativos        | 0     | 10    | 5             |

Planilha: "Tijolo vs Papel"
| Tipo   | Segmentos                                        | Min % | Max % | Recomendado % |
|--------|--------------------------------------------------|-------|-------|---------------|
| Tijolo | Lajes, Logística, Shopping, Varejo/Renda Urbana  | 50    | 70    | 60            |
| Papel  | Papel                                            | 30    | 40    | 35            |

Planilha: "Alternativos"
| Categoria       | Max % Total | Ideal Max % |
|-----------------|-------------|-------------|
| Todos           | 15          | 10          |

Planilha: "Configurações Gerais"
| Configuração                 | Valor |
|------------------------------|-------|
| Aplicar Regras Estritamente  | NÃO   |
| Permitir Exceções            | SIM   |
| Confiança Mínima IA          | 0.7   |
| Desvio Máximo Intra-Segmento | 10%   |
```

---

## 🗄️ Modelo de Dados (Prisma Schema)

```prisma
// prisma/schema.prisma

model RecommendationRuleSet {
  id          String   @id @default(cuid())
  name        String
  version     Int      @default(1)
  isActive    Boolean  @default(false)
  rules       Json     // Estrutura JSON completa das regras
  metadata    Json     // Source, description, notes, tags

  // Relacionamentos
  createdBy   String
  creator     User     @relation("RuleSetCreator", fields: [createdBy], references: [id])

  // Histórico de versões
  versions    RecommendationRuleVersion[]

  // Análises que usaram este ruleset
  analyses    AnalysisReport[] @relation("AnalysisRuleSet")

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive])
  @@index([createdBy])
  @@map("recommendation_rule_sets")
}

model RecommendationRuleVersion {
  id              String   @id @default(cuid())

  // FK para o RuleSet principal
  ruleSetId       String
  ruleSet         RecommendationRuleSet @relation(fields: [ruleSetId], references: [id], onDelete: Cascade)

  version         Int
  rules           Json     // Snapshot completo das regras nesta versão
  changesSummary  String   @db.Text // Descrição das mudanças

  // Audit trail
  createdBy       String
  creator         User     @relation("RuleVersionCreator", fields: [createdBy], references: [id])
  createdAt       DateTime @default(now())

  @@unique([ruleSetId, version])
  @@index([ruleSetId])
  @@index([createdAt])
  @@map("recommendation_rule_versions")
}

// Adicionar ao modelo AnalysisReport existente
model AnalysisReport {
  // ... campos existentes ...

  // Novo campo para rastrear qual ruleset foi usado
  ruleSetId       String?
  ruleSet         RecommendationRuleSet? @relation("AnalysisRuleSet", fields: [ruleSetId], references: [id])
  ruleSetVersion  Int? // Versão específica usada

  // ... resto dos campos ...
}

// Adicionar relações ao modelo User existente
model User {
  // ... campos existentes ...

  // Novas relações
  createdRuleSets         RecommendationRuleSet[]        @relation("RuleSetCreator")
  createdRuleVersions     RecommendationRuleVersion[]    @relation("RuleVersionCreator")

  // ... resto dos campos ...
}
```

---

## 🔧 Implementação Técnica

### **Fase 1: Backend Foundation (3-4 dias)**

#### **1.1 Database Migration**
```bash
npx prisma migrate dev --name add_recommendation_rules_system
```

#### **1.2 Service Layer - RecommendationRulesService**

```typescript
// src/lib/services/recommendation-rules.service.ts

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validação Zod
const RecommendationRuleSetSchema = z.object({
  name: z.string().min(1).max(255),
  rules: z.object({
    fundCountByCapital: z.object({
      ranges: z.array(z.object({
        minCapital: z.number().min(0),
        maxCapital: z.number().nullable(),
        minFunds: z.number().int().min(1),
        maxFunds: z.number().int().min(1),
        recommended: z.number().int().min(1),
      })),
    }),
    mandatorySegments: z.object({
      segments: z.array(z.string()),
      alertOnMissing: z.boolean(),
    }),
    fundsPerSegment: z.object({
      byCapitalRange: z.array(z.any()), // Validação completa omitida por brevidade
    }),
    allocationPercentage: z.object({
      segments: z.record(z.object({
        min: z.number().min(0).max(100),
        max: z.number().min(0).max(100),
        recommended: z.number().min(0).max(100),
      })),
      alertOnOutOfRange: z.boolean(),
    }),
    tijoloPapelBalance: z.object({
      tijolo: z.any(),
      papel: z.any(),
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

export class RecommendationRulesService {
  /**
   * Obter o ruleset ativo atual
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
   * Criar novo ruleset
   */
  async createRuleSet(
    data: z.infer<typeof RecommendationRuleSetSchema>,
    createdBy: string
  ): Promise<RecommendationRuleSet> {
    // Validar entrada
    const validatedData = RecommendationRuleSetSchema.parse(data);

    return db.$transaction(async (tx) => {
      // Criar o ruleset
      const ruleSet = await tx.recommendationRuleSet.create({
        data: {
          name: validatedData.name,
          version: 1,
          isActive: false, // Não ativar automaticamente
          rules: validatedData.rules as Prisma.JsonObject,
          metadata: validatedData.metadata as Prisma.JsonObject,
          createdBy,
        },
      });

      // Criar primeira versão
      await tx.recommendationRuleVersion.create({
        data: {
          ruleSetId: ruleSet.id,
          version: 1,
          rules: validatedData.rules as Prisma.JsonObject,
          changesSummary: 'Criação inicial do ruleset',
          createdBy,
        },
      });

      return ruleSet;
    });
  }

  /**
   * Atualizar ruleset existente (cria nova versão)
   */
  async updateRuleSet(
    ruleSetId: string,
    updates: Partial<z.infer<typeof RecommendationRuleSetSchema>>,
    changesSummary: string,
    updatedBy: string
  ): Promise<RecommendationRuleSet> {
    return db.$transaction(async (tx) => {
      // Obter ruleset atual
      const current = await tx.recommendationRuleSet.findUniqueOrThrow({
        where: { id: ruleSetId },
      });

      // Incrementar versão
      const newVersion = current.version + 1;

      // Atualizar ruleset
      const updated = await tx.recommendationRuleSet.update({
        where: { id: ruleSetId },
        data: {
          ...updates,
          version: newVersion,
          updatedAt: new Date(),
        },
      });

      // Criar versão histórica
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
   * Ativar um ruleset (desativa outros)
   */
  async activateRuleSet(ruleSetId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      // Desativar todos os rulesets
      await tx.recommendationRuleSet.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Ativar o selecionado
      await tx.recommendationRuleSet.update({
        where: { id: ruleSetId },
        data: { isActive: true },
      });
    });
  }

  /**
   * Rollback para versão anterior
   */
  async rollbackToVersion(
    ruleSetId: string,
    targetVersion: number,
    userId: string
  ): Promise<RecommendationRuleSet> {
    return db.$transaction(async (tx) => {
      // Buscar versão alvo
      const targetVersionData = await tx.recommendationRuleVersion.findUniqueOrThrow({
        where: {
          ruleSetId_version: {
            ruleSetId,
            version: targetVersion,
          },
        },
      });

      // Atualizar para a versão alvo (cria nova versão)
      return this.updateRuleSet(
        ruleSetId,
        { rules: targetVersionData.rules as any },
        `Rollback para versão ${targetVersion}`,
        userId
      );
    });
  }

  /**
   * Obter histórico de versões
   */
  async getVersionHistory(ruleSetId: string) {
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
   * Processar upload de Excel e converter para ruleset
   */
  async createRuleSetFromExcel(
    file: File,
    name: string,
    createdBy: string
  ): Promise<RecommendationRuleSet> {
    const rules = await this.parseExcelToRules(file);

    return this.createRuleSet(
      {
        name,
        rules,
        metadata: {
          source: 'excel_upload',
          description: `Importado do arquivo: ${file.name}`,
        },
      },
      createdBy
    );
  }

  /**
   * Parser de Excel para estrutura de regras
   */
  private async parseExcelToRules(file: File): Promise<any> {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer());

    const rules: any = {
      fundCountByCapital: { ranges: [] },
      mandatorySegments: { segments: [], alertOnMissing: true },
      fundsPerSegment: { byCapitalRange: [] },
      allocationPercentage: { segments: {}, alertOnOutOfRange: true },
      tijoloPapelBalance: { tijolo: {}, papel: {}, alertOnImbalance: true },
      alternativeFunds: { categories: [], maxPercentage: 15, idealMaxPercentage: 10, alertThreshold: 12 },
      intraSegmentBalance: { enabled: true, maxDeviationPercentage: 10, alertOnImbalance: true },
      general: { enforceStrictCompliance: false, allowOverrides: true, confidenceThreshold: 0.7 },
    };

    // Parsear "Fundos por Capital"
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

    // Parsear "Segmentos Obrigatórios"
    const mandatorySegmentsSheet = workbook.Sheets['Segmentos Obrigatórios'];
    if (mandatorySegmentsSheet) {
      const data = XLSX.utils.sheet_to_json(mandatorySegmentsSheet);
      rules.mandatorySegments.segments = data
        .filter((row: any) => row['Obrigatório'] === 'SIM')
        .map((row: any) => this.normalizeSegmentName(row['Segmento']));
    }

    // Parsear sheets de "Fundos por Segmento" para cada faixa de capital
    const capitalRanges = [
      { sheet: 'Fundos por Segmento - Capital < 30K', minCapital: 0, maxCapital: 30000 },
      { sheet: 'Fundos por Segmento - Capital 30K-100K', minCapital: 30000, maxCapital: 100000 },
      { sheet: 'Fundos por Segmento - Capital > 100K', minCapital: 100000, maxCapital: null },
    ];

    for (const range of capitalRanges) {
      const sheet = workbook.Sheets[range.sheet];
      if (sheet) {
        const data = XLSX.utils.sheet_to_json(sheet);
        const segmentRules: any = {};

        for (const row of data) {
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

    // Parsear "Alocação Percentual"
    const allocationSheet = workbook.Sheets['Alocação Percentual'];
    if (allocationSheet) {
      const data = XLSX.utils.sheet_to_json(allocationSheet);
      for (const row of data) {
        const segment = this.normalizeSegmentName(row['Segmento']);
        rules.allocationPercentage.segments[segment] = {
          min: Number(row['Min %']),
          max: Number(row['Max %']),
          recommended: Number(row['Recomendado %']),
        };
      }
    }

    // Parsear "Tijolo vs Papel"
    const tijoloPapelSheet = workbook.Sheets['Tijolo vs Papel'];
    if (tijoloPapelSheet) {
      const data = XLSX.utils.sheet_to_json(tijoloPapelSheet);
      for (const row of data) {
        const type = row['Tipo'].toLowerCase();
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

    // Parsear "Alternativos"
    const alternativosSheet = workbook.Sheets['Alternativos'];
    if (alternativosSheet) {
      const data = XLSX.utils.sheet_to_json(alternativosSheet);
      const firstRow = data[0] as any;
      rules.alternativeFunds.maxPercentage = Number(firstRow['Max % Total']);
      rules.alternativeFunds.idealMaxPercentage = Number(firstRow['Ideal Max %']);
    }

    // Parsear "Configurações Gerais"
    const configSheet = workbook.Sheets['Configurações Gerais'];
    if (configSheet) {
      const data = XLSX.utils.sheet_to_json(configSheet);
      const configMap = data.reduce((acc: any, row: any) => {
        acc[row['Configuração']] = row['Valor'];
        return acc;
      }, {});

      rules.general = {
        enforceStrictCompliance: configMap['Aplicar Regras Estritamente'] === 'SIM',
        allowOverrides: configMap['Permitir Exceções'] === 'SIM',
        confidenceThreshold: Number(configMap['Confiança Mínima IA']),
      };

      if (configMap['Desvio Máximo Intra-Segmento']) {
        rules.intraSegmentBalance.maxDeviationPercentage = parseFloat(
          configMap['Desvio Máximo Intra-Segmento'].replace('%', '')
        );
      }
    }

    return rules;
  }

  /**
   * Normalizar nomes de segmentos
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
   * Gerar template Excel para download
   */
  async generateExcelTemplate(): Promise<Buffer> {
    const XLSX = require('xlsx');
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

    // Sheets 3-5: Fundos por Segmento (3 faixas de capital)
    const segmentTemplate = [
      { 'Segmento': 'Lajes', 'Min': 1, 'Max': 1, 'Recomendado': 1 },
      { 'Segmento': 'Logística', 'Min': 2, 'Max': 2, 'Recomendado': 2 },
      { 'Segmento': 'Shopping', 'Min': 2, 'Max': 2, 'Recomendado': 2 },
      { 'Segmento': 'Varejo/Renda Urbana', 'Min': 1, 'Max': 2, 'Recomendado': 1 },
      { 'Segmento': 'Papel', 'Min': 3, 'Max': 3, 'Recomendado': 3 },
      { 'Segmento': 'Alternativos', 'Min': 0, 'Max': 2, 'Recomendado': 1 },
    ];
    const sheet3 = XLSX.utils.json_to_sheet(segmentTemplate);
    XLSX.utils.book_append_sheet(workbook, sheet3, 'Fundos por Segmento - Capital < 30K');

    // (Repetir para outras faixas com valores ajustados...)

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

    // Converter para buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Formatar regras para prompt da IA
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

  // Helpers de formatação (implementação omitida por brevidade)
  private formatFundCountRules(rules: any): string { /* ... */ return ''; }
  private formatMandatorySegments(rules: any): string { /* ... */ return ''; }
  private formatFundsPerSegment(rules: any): string { /* ... */ return ''; }
  private formatAllocationPercentage(rules: any): string { /* ... */ return ''; }
  private formatTijoloPapelBalance(rules: any): string { /* ... */ return ''; }
  private formatAlternativeFunds(rules: any): string { /* ... */ return ''; }
  private formatIntraSegmentBalance(rules: any): string { /* ... */ return ''; }
  private formatGeneralConfig(rules: any): string { /* ... */ return ''; }
}
```

#### **1.3 API Routes**

```typescript
// src/app/api/admin/recommendation-rules/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRulesService } from '@/lib/services/recommendation-rules.service';
import { getUserFromClerkId, requireAdmin } from '@/lib/auth-utils';

const rulesService = new RecommendationRulesService();

// GET /api/admin/recommendation-rules - Listar todos os rulesets
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    await requireAdmin(user);

    const rulesets = await db.recommendationRuleSet.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rulesets);
  } catch (error) {
    console.error('Error fetching rulesets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rulesets' },
      { status: 500 }
    );
  }
}

// POST /api/admin/recommendation-rules - Criar novo ruleset
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    await requireAdmin(user);

    const body = await request.json();
    const ruleset = await rulesService.createRuleSet(body, user.id);

    return NextResponse.json(ruleset, { status: 201 });
  } catch (error) {
    console.error('Error creating ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to create ruleset', details: error.message },
      { status: 400 }
    );
  }
}

// Outros endpoints (PUT, DELETE) seguem o mesmo padrão...
```

```typescript
// src/app/api/admin/recommendation-rules/[id]/activate/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    await requireAdmin(user);

    await rulesService.activateRuleSet(params.id);

    return NextResponse.json({ message: 'Ruleset activated successfully' });
  } catch (error) {
    console.error('Error activating ruleset:', error);
    return NextResponse.json(
      { error: 'Failed to activate ruleset' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/admin/recommendation-rules/upload-excel/route.ts

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    await requireAdmin(user);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file || !name) {
      return NextResponse.json(
        { error: 'File and name are required' },
        { status: 400 }
      );
    }

    const ruleset = await rulesService.createRuleSetFromExcel(file, name, user.id);

    return NextResponse.json(ruleset, { status: 201 });
  } catch (error) {
    console.error('Error uploading Excel:', error);
    return NextResponse.json(
      { error: 'Failed to process Excel file', details: error.message },
      { status: 400 }
    );
  }
}
```

```typescript
// src/app/api/admin/recommendation-rules/download-template/route.ts

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    await requireAdmin(user);

    const buffer = await rulesService.generateExcelTemplate();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-regras-recomendacao.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return new Response('Failed to generate template', { status: 500 });
  }
}
```

---

### **Fase 2: Frontend Admin Interface (3-4 dias)**

#### **2.1 Custom Hooks**

```typescript
// src/hooks/admin/use-recommendation-rules.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export function useRecommendationRules() {
  return useQuery({
    queryKey: ['admin', 'recommendation-rules'],
    queryFn: () => api.get('/api/admin/recommendation-rules'),
    staleTime: 5 * 60_000, // 5 minutos
  });
}

export function useActiveRecommendationRules() {
  return useQuery({
    queryKey: ['admin', 'recommendation-rules', 'active'],
    queryFn: () => api.get('/api/admin/recommendation-rules/active'),
    staleTime: 10 * 60_000, // 10 minutos
  });
}

export function useCreateRecommendationRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      api.post('/api/admin/recommendation-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      toast.success('Regras criadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar regras');
    },
  });
}

export function useUpdateRecommendationRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/api/admin/recommendation-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      toast.success('Regras atualizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar regras');
    },
  });
}

export function useActivateRecommendationRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/recommendation-rules/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      toast.success('Regras ativadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao ativar regras');
    },
  });
}

export function useUploadRecommendationRulesExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);

      return api.post('/api/admin/recommendation-rules/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      toast.success('Excel processado e regras criadas!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao processar Excel');
    },
  });
}

export function useRuleSetVersionHistory(ruleSetId: string) {
  return useQuery({
    queryKey: ['admin', 'recommendation-rules', ruleSetId, 'versions'],
    queryFn: () => api.get(`/api/admin/recommendation-rules/${ruleSetId}/versions`),
    enabled: !!ruleSetId,
    staleTime: 10 * 60_000,
  });
}

export function useRollbackRuleSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleSetId, version }: { ruleSetId: string; version: number }) =>
      api.post(`/api/admin/recommendation-rules/${ruleSetId}/rollback`, { version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      toast.success('Rollback realizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao fazer rollback');
    },
  });
}
```

#### **2.2 Páginas Admin**

```typescript
// src/app/admin/regras-recomendacao/page.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  FileSpreadsheet,
  History,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useSetPageMetadata } from '@/contexts/page-metadata';
import {
  useRecommendationRules,
  useActivateRecommendationRules,
} from '@/hooks/admin/use-recommendation-rules';
import { RecommendationRulesTable } from '@/components/admin/regras/recommendation-rules-table';
import { CreateRulesDialog } from '@/components/admin/regras/create-rules-dialog';
import { UploadExcelDialog } from '@/components/admin/regras/upload-excel-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RegrasRecomendacaoPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: rulesets, isLoading } = useRecommendationRules();
  const activateMutation = useActivateRecommendationRules();

  useSetPageMetadata({
    title: 'Regras de Recomendação',
    description: 'Gerenciar regras de análise e recomendação de portfólios FII',
    breadcrumbs: [
      { label: 'Admin', href: '/admin' },
      { label: 'Regras de Recomendação' },
    ],
  });

  const activeRuleset = rulesets?.find((r: any) => r.isActive);

  const handleDownloadTemplate = async () => {
    const response = await fetch('/api/admin/recommendation-rules/download-template');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-regras-recomendacao.xlsx';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regras de Recomendação FII</h1>
          <p className="text-muted-foreground mt-1">
            Configure e gerencie as regras utilizadas pela IA para análise de portfólios
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template Excel
          </Button>
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Excel
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra Manual
          </Button>
        </div>
      </div>

      {/* Active Ruleset Card */}
      {activeRuleset && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Regra Ativa Atualmente</CardTitle>
              </div>
              <Badge variant="default" className="bg-primary">
                v{activeRuleset.version}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{activeRuleset.name}</span>
                <span className="text-sm text-muted-foreground">
                  Atualizado em {format(new Date(activeRuleset.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeRuleset.metadata.description || 'Sem descrição'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <Settings className="h-4 w-4 mr-2" />
            Todas as Regras
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Histórico de Versões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <RecommendationRulesTable
            data={rulesets || []}
            isLoading={isLoading}
            onActivate={(id) => activateMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Implementar componente de histórico */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Versões</CardTitle>
              <CardDescription>
                Visualize e compare versões anteriores das regras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Selecione uma regra na aba "Todas as Regras" para ver seu histórico
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateRulesDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <UploadExcelDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}
```

#### **2.3 Componentes**

```typescript
// src/components/admin/regras/recommendation-rules-table.tsx

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle2, Circle, Eye, Edit, Trash2, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecommendationRulesTableProps {
  data: any[];
  isLoading: boolean;
  onActivate: (id: string) => void;
}

export function RecommendationRulesTable({
  data,
  isLoading,
  onActivate,
}: RecommendationRulesTableProps) {
  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Versão</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Criado por</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((ruleset) => (
            <TableRow key={ruleset.id}>
              <TableCell>
                {ruleset.isActive ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativa
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Circle className="h-3 w-3 mr-1" />
                    Inativa
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-medium">{ruleset.name}</TableCell>
              <TableCell>v{ruleset.version}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {ruleset.metadata.source === 'manual' && 'Manual'}
                  {ruleset.metadata.source === 'excel_upload' && 'Excel'}
                  {ruleset.metadata.source === 'api_import' && 'API'}
                </Badge>
              </TableCell>
              <TableCell>{ruleset.creator.name}</TableCell>
              <TableCell>
                {format(new Date(ruleset.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    {!ruleset.isActive && (
                      <DropdownMenuItem onClick={() => onActivate(ruleset.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Ativar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <History className="h-4 w-4 mr-2" />
                      Histórico
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

```typescript
// src/components/admin/regras/upload-excel-dialog.tsx

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUploadRecommendationRulesExcel } from '@/hooks/admin/use-recommendation-rules';
import { Upload } from 'lucide-react';

interface UploadExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadExcelDialog({ open, onOpenChange }: UploadExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');

  const uploadMutation = useUploadRecommendationRulesExcel();

  const handleUpload = async () => {
    if (!file || !name) return;

    await uploadMutation.mutateAsync({ file, name });
    onOpenChange(false);
    setFile(null);
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload de Regras via Excel</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel com as regras configuradas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Conjunto de Regras</Label>
            <Input
              id="name"
              placeholder="Ex: Regras Q4 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo Excel</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Clique para selecionar arquivo</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apenas arquivos .xlsx ou .xls
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !name || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Processando...' : 'Upload e Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### **Fase 3: Integração com IA (1-2 dias)**

#### **3.1 Modificar PortfolioAnalysisService**

```typescript
// src/lib/services/portfolio-analysis.service.ts (modificado)

export class PortfolioAnalysisService {
  // ... código existente ...

  async analyzePortfolio(
    portfolioId: string,
    analysisType: AnalysisType,
    options: AnalysisOptions = {}
  ): Promise<AnalysisReport> {
    const startTime = Date.now();

    try {
      // 1. Obter dados do portfólio
      const portfolio = await this.getPortfolioData(portfolioId);

      // 2. Carregar regras ativas (NOVO)
      const rulesService = new RecommendationRulesService();
      const activeRuleSet = await rulesService.getActiveRuleSet();

      if (!activeRuleSet) {
        throw new AnalysisError('Nenhum conjunto de regras ativo encontrado');
      }

      // 3. Preparar contexto para IA com regras
      const context = await this.buildAnalysisContext(portfolio, options, activeRuleSet);

      // 4. Executar análise com IA
      const analysisResult = await this.executeAIAnalysis(
        context,
        analysisType,
        activeRuleSet
      );

      // 5. Processar e estruturar resultado
      const structuredResult = await this.structureAnalysisResult(analysisResult);

      // 6. Salvar no banco com referência ao ruleset usado
      const report = await this.saveAnalysisReport({
        userId: portfolio.userId,
        userPortfolioId: portfolioId,
        analysisType,
        processingTime: Date.now() - startTime,
        ruleSetId: activeRuleSet.id, // NOVO
        ruleSetVersion: activeRuleSet.version, // NOVO
        ...structuredResult,
      });

      return report;

    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      throw new AnalysisError('Falha na análise do portfólio', error);
    }
  }

  private async buildAnalysisContext(
    portfolio: any,
    options: AnalysisOptions,
    ruleSet: RecommendationRuleSet
  ): Promise<AnalysisContext> {
    return {
      portfolio,
      marketData: await this.getMarketData(),
      riskTolerance: options.riskTolerance || 'moderate',
      investmentGoal: options.investmentGoal || 'income',
      timeHorizon: options.timeHorizon || 'long',
      rules: ruleSet.rules, // NOVO: Incluir regras no contexto
    };
  }

  private async executeAIAnalysis(
    context: AnalysisContext,
    analysisType: AnalysisType,
    ruleSet: RecommendationRuleSet
  ): Promise<any> {
    const rulesService = new RecommendationRulesService();
    const rulesPrompt = rulesService.formatRulesForAIPrompt(ruleSet.rules);

    const prompt = this.buildAnalysisPrompt(context, analysisType, rulesPrompt);

    // Usar Claude para análises complexas
    if (analysisType === 'PORTFOLIO_EVALUATION') {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      return this.parseClaudeResponse(response);
    }

    // ... resto do código ...
  }

  private buildAnalysisPrompt(
    context: AnalysisContext,
    analysisType: AnalysisType,
    rulesPrompt: string // NOVO parâmetro
  ): string {
    const basePrompt = `
Analise o seguinte portfólio de FIIs seguindo ESTRITAMENTE as regras fornecidas:

${rulesPrompt}

DADOS DO PORTFÓLIO:
${JSON.stringify(context.portfolio, null, 2)}

DADOS DE MERCADO:
${JSON.stringify(context.marketData, null, 2)}

PERFIL DO INVESTIDOR:
- Tolerância ao risco: ${context.riskTolerance}
- Objetivo: ${context.investmentGoal}
- Prazo: ${context.timeHorizon}
`;

    // ... resto da construção do prompt ...

    return basePrompt;
  }
}
```

---

## 📈 Métricas de Sucesso e Monitoramento

### **KPIs Técnicos:**
- **Performance:** Análise com regras dinâmicas < 3s overhead
- **Disponibilidade:** 99.9% uptime do sistema de regras
- **Acurácia:** Zero erros de parsing de Excel em templates válidos

### **KPIs de Negócio:**
- **Tempo de ajuste:** < 2 horas (vs. 2 dias anteriormente)
- **Utilização:** 100% das análises usando regras configuráveis em 2 semanas
- **Satisfação admin:** NPS > 8
- **Qualidade:** Feedback positivo de 80%+ dos usuários finais

### **Monitoramento:**
```typescript
// Adicionar instrumentação para analytics
- Frequência de mudanças nas regras
- Tempo médio entre atualizações
- Impacto de mudanças na qualidade das recomendações
- Taxa de rollback de versões
- Uso de formulário vs. Excel upload
```

---

## ✅ Checklist de Implementação

### **Backend:**
- [ ] Criar models Prisma (RecommendationRuleSet, RecommendationRuleVersion)
- [ ] Executar migration do banco de dados
- [ ] Implementar RecommendationRulesService completo
- [ ] Criar API routes (/api/admin/recommendation-rules/*)
- [ ] Implementar parser de Excel
- [ ] Implementar gerador de template Excel
- [ ] Adicionar validação Zod de regras
- [ ] Implementar sistema de versionamento
- [ ] Integrar com PortfolioAnalysisService
- [ ] Adicionar testes unitários para service
- [ ] Adicionar testes de integração para APIs

### **Frontend:**
- [ ] Criar custom hooks (use-recommendation-rules.ts)
- [ ] Implementar página /admin/regras-recomendacao
- [ ] Criar componente RecommendationRulesTable
- [ ] Criar dialog CreateRulesDialog (formulário manual)
- [ ] Criar dialog UploadExcelDialog
- [ ] Implementar visualizador de regras JSON
- [ ] Criar componente de histórico de versões
- [ ] Implementar comparação entre versões
- [ ] Adicionar botão de download de template
- [ ] Implementar preview antes de ativar regras
- [ ] Adicionar confirmação de ativação de regras
- [ ] Testes E2E com Playwright

### **Documentação:**
- [ ] Atualizar CLAUDE.md com novas rotas
- [ ] Documentar estrutura JSON das regras
- [ ] Criar guia de uso do template Excel
- [ ] Documentar API endpoints
- [ ] Criar changelog de versões

### **QA:**
- [ ] Testar upload de Excel válido
- [ ] Testar upload de Excel inválido (estrutura errada)
- [ ] Testar criação manual de regras
- [ ] Testar ativação/desativação de rulesets
- [ ] Testar rollback de versões
- [ ] Testar análises com regras diferentes
- [ ] Validar que análises antigas mantêm referência correta
- [ ] Testar permissões (apenas admins)

---

## 🚧 Riscos e Mitigações

### **Risco 1: Regras inválidas causam análises incorretas**
**Mitigação:**
- Validação rigorosa com Zod schemas
- Preview obrigatório antes de ativar
- Sistema de rollback rápido
- Testes automatizados de validação

### **Risco 2: Performance degradada com regras complexas**
**Mitigação:**
- Cache de regras ativas (10 minutos)
- Otimização de formatação de prompts
- Monitoramento de tempo de análise
- Alertas se análise > 5s

### **Risco 3: Excel parsing falha em formatos variados**
**Mitigação:**
- Template padronizado e documentado
- Validação estrita de estrutura
- Mensagens de erro claras
- Suporte a múltiplos encodings

### **Risco 4: Conflitos de versão em produção**
**Mitigação:**
- Ativação manual explícita (não automática)
- Lock pessimista em ativação
- Auditoria completa de mudanças
- Notificação de admins em ativação

---

## 📚 Recursos Adicionais

### **Bibliotecas Necessárias:**
```json
{
  "dependencies": {
    "xlsx": "^0.18.5" // Para parsing e geração de Excel
  }
}
```

### **Variáveis de Ambiente:**
Nenhuma variável adicional necessária (usa infraestrutura existente).

### **Documentação Relacionada:**
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [XLSX.js Documentation](https://docs.sheetjs.com/)
- [Zod Schema Validation](https://zod.dev/)

---

## 🎯 Próximos Passos Após Implementação

### **Curto Prazo (1 mês):**
1. **A/B Testing de Regras:** Implementar sistema de experimentação
2. **Personalização por Perfil:** Regras diferentes para conservador/agressivo
3. **Sugestões Automáticas:** IA propõe ajustes nas regras baseado em resultados

### **Médio Prazo (3 meses):**
1. **Machine Learning:** Aprender regras ótimas a partir de feedback
2. **Regras Regionais:** Adaptação automática por região do Brasil
3. **API Pública:** Expor regras via API para integrações externas

### **Longo Prazo (6 meses):**
1. **Marketplace de Regras:** Usuários compartilham configurações
2. **White Label:** Clientes B2B customizam regras
3. **Multi-Asset:** Expandir para outros tipos de investimentos

---

## 🤝 Agentes Envolvidos e Responsabilidades

### **Product Agent (Coordenador):**
- ✅ Definir requisitos e especificações
- ✅ Criar este documento de planejamento
- ✅ Validar UX/UI dos fluxos
- ✅ Definir KPIs e métricas de sucesso

### **Backend Agent:**
- Implementar RecommendationRulesService
- Criar API routes
- Desenvolver parser de Excel
- Integrar com PortfolioAnalysisService
- Implementar versionamento e rollback

### **Frontend Agent:**
- Criar interface admin de gestão de regras
- Implementar upload de Excel
- Desenvolver visualizador de JSON
- Criar comparador de versões
- Implementar formulário manual de regras

### **Database Agent:**
- Revisar schema Prisma
- Otimizar queries de versionamento
- Criar índices apropriados
- Validar estratégia de migrations

### **QA Agent:**
- Criar plano de testes
- Implementar testes automatizados
- Validar fluxos críticos
- Testar edge cases

### **Security Agent:**
- Validar permissões (admin-only)
- Revisar validação de entrada
- Auditar sistema de versionamento
- Validar proteção contra injeção

---

## 📝 Notas Finais

Este plano foi elaborado pelo **Product Agent** em coordenação com os requisitos do projeto FiiAI. A implementação deve seguir os padrões estabelecidos na documentação do projeto, especialmente:

- **TanStack Query** para todas as chamadas de API
- **Zod** para validação de schemas
- **Prisma** para acesso ao banco de dados
- **Glass morphism UI** para componentes visuais
- **TypeScript** com tipagem forte

A prioridade P0 reflete a importância estratégica desta funcionalidade para a agilidade e qualidade do produto. A estimativa de 8-10 dias considera:
- 3-4 dias de backend
- 3-4 dias de frontend
- 1-2 dias de integração e testes
- Buffer para imprevistos

**Última Atualização:** 2025-09-29
**Versão do Plano:** 1.0
**Status:** Pronto para Implementação ✅