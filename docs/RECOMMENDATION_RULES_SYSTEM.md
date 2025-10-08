# Sistema de Regras Configuráveis para Recomendação de FII

## 📋 Visão Geral

Sistema completo de gerenciamento de regras configuráveis para análise e recomendação de portfólios de Fundos de Investimento Imobiliário (FIIs). Permite que administradores definam e ajustem dinamicamente os parâmetros utilizados pela IA sem necessidade de alteração de código.

## ✨ Funcionalidades Implementadas

### Backend
- ✅ Modelos Prisma para regras e versionamento
- ✅ Service completo com validação Zod
- ✅ API REST para CRUD de regras
- ✅ Upload e processamento de Excel
- ✅ Geração de template Excel
- ✅ Sistema de versionamento automático
- ✅ Rollback para versões anteriores
- ✅ Ativação/desativação de regras

### Frontend
- ✅ Página admin de gerenciamento
- ✅ Tabela com todas as regras
- ✅ Dialog de criação manual (JSON)
- ✅ Dialog de upload Excel
- ✅ Indicador de regra ativa
- ✅ Download de template
- ✅ Custom hooks com TanStack Query

### Integração
- ✅ Service de análise de portfólio
- ✅ Injeção de regras em prompts de IA
- ✅ Rastreamento de qual regra foi usada

## 🗄️ Estrutura de Banco de Dados

### RecommendationRuleSet
```prisma
model RecommendationRuleSet {
  id          String   @id @default(cuid())
  name        String
  version     Int      @default(1)
  isActive    Boolean  @default(false)
  rules       Json     // Estrutura completa das regras
  metadata    Json     // Source, description, notes, tags
  createdBy   String
  creator     User     @relation("RuleSetCreator")
  versions    RecommendationRuleVersion[]
  analyses    AnalysisReport[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### RecommendationRuleVersion
```prisma
model RecommendationRuleVersion {
  id              String   @id @default(cuid())
  ruleSetId       String
  ruleSet         RecommendationRuleSet
  version         Int
  rules           Json
  changesSummary  String   @db.Text
  createdBy       String
  creator         User
  createdAt       DateTime @default(now())

  @@unique([ruleSetId, version])
}
```

## 📊 Estrutura de Regras

### Categorias de Regras

1. **fundCountByCapital**: Número de fundos baseado no capital
2. **mandatorySegments**: Segmentos obrigatórios
3. **fundsPerSegment**: Quantidade de fundos por segmento
4. **allocationPercentage**: Percentual de alocação por segmento
5. **tijoloPapelBalance**: Balanceamento tijolo vs papel
6. **alternativeFunds**: Limites para fundos alternativos
7. **intraSegmentBalance**: Balanceamento dentro do segmento
8. **general**: Configurações gerais

### Exemplo de Estrutura JSON

```json
{
  "fundCountByCapital": {
    "ranges": [
      {
        "minCapital": 0,
        "maxCapital": 30000,
        "minFunds": 1,
        "maxFunds": 10,
        "recommended": 8
      }
    ]
  },
  "mandatorySegments": {
    "segments": ["LAJES", "LOGISTICA", "SHOPPING", "VAREJO_RENDA_URBANA", "PAPEL"],
    "alertOnMissing": true
  },
  "general": {
    "enforceStrictCompliance": false,
    "allowOverrides": true,
    "confidenceThreshold": 0.7
  }
}
```

## 🔌 API Endpoints

### Listar Todas as Regras
```
GET /api/admin/recommendation-rules
```

### Obter Regra Ativa
```
GET /api/admin/recommendation-rules/active
```

### Obter Regra Específica
```
GET /api/admin/recommendation-rules/:id
```

### Criar Nova Regra
```
POST /api/admin/recommendation-rules
Body: { name, rules, metadata }
```

### Atualizar Regra
```
PUT /api/admin/recommendation-rules/:id
Body: { name?, rules?, metadata?, changesSummary }
```

### Ativar Regra
```
POST /api/admin/recommendation-rules/:id/activate
```

### Excluir Regra
```
DELETE /api/admin/recommendation-rules/:id
```

### Upload Excel
```
POST /api/admin/recommendation-rules/upload-excel
Body: FormData { file, name }
```

### Download Template
```
GET /api/admin/recommendation-rules/download-template
```

### Histórico de Versões
```
GET /api/admin/recommendation-rules/:id/versions
```

### Rollback
```
POST /api/admin/recommendation-rules/:id/rollback
Body: { version }
```

## 🎨 Interface Admin

### Acesso
```
/admin/regras-recomendacao
```

### Funcionalidades da Interface

1. **Card de Regra Ativa**: Destaque da regra atualmente ativa
2. **Tabela de Regras**: Lista todas as regras com status, versão, origem
3. **Botões de Ação**:
   - Nova Regra Manual
   - Upload Excel
   - Download Template
4. **Menu Contextual por Regra**:
   - Visualizar
   - Ativar (se inativa)
   - Editar
   - Histórico
   - Excluir (se inativa)

## 💻 Como Usar

### 1. Criar Regras via JSON (Manual)

```typescript
// Clique em "Nova Regra Manual"
// Edite o JSON no dialog
// Clique em "Criar"
```

### 2. Criar Regras via Excel

```typescript
// 1. Clique em "Download Template"
// 2. Preencha o Excel com as regras
// 3. Clique em "Upload Excel"
// 4. Selecione o arquivo e dê um nome
// 5. Clique em "Upload e Criar"
```

### 3. Ativar Regra

```typescript
// Na tabela, clique nos três pontos (...) da regra
// Selecione "Ativar"
// A regra anterior será desativada automaticamente
```

### 4. Fazer Rollback

```typescript
// Clique em "Histórico" no menu da regra
// Selecione a versão desejada
// Clique em "Rollback"
// Uma nova versão será criada com as regras antigas
```

## 🔧 Integração com Análise de Portfólio

### Service de Análise

```typescript
import { PortfolioAnalysisService } from '@/lib/services/portfolio-analysis.service';

const analysisService = new PortfolioAnalysisService();

// Análise automática usa regras ativas
const report = await analysisService.analyzePortfolio(
  portfolioId,
  userId,
  'PORTFOLIO_EVALUATION',
  { riskTolerance: 'moderate' }
);

// O report conterá:
// - ruleSetId: ID da regra usada
// - ruleSetVersion: Versão da regra usada
```

### Formatação para Prompt de IA

```typescript
const rulesService = new RecommendationRulesService();
const activeRules = await rulesService.getActiveRuleSet();

// Formata regras para prompt
const rulesPrompt = rulesService.formatRulesForAIPrompt(activeRules.rules);

// Use em seu prompt de IA
const prompt = `
Analise o portfólio seguindo estas regras:

${rulesPrompt}

Dados do portfólio: ...
`;
```

## 📝 Estrutura do Template Excel

O template Excel possui as seguintes abas:

1. **Fundos por Capital**: Ranges de capital x número de fundos
2. **Segmentos Obrigatórios**: Lista de segmentos obrigatórios
3. **Fundos por Segmento - Capital < 30K**: Regras para capital baixo
4. **Fundos por Segmento - Capital 30K-100K**: Regras para capital médio
5. **Fundos por Segmento - Capital > 100K**: Regras para capital alto
6. **Alocação Percentual**: Percentuais por segmento
7. **Tijolo vs Papel**: Balanceamento entre tipos
8. **Alternativos**: Limites para fundos alternativos
9. **Configurações Gerais**: Configurações do sistema

## 🔍 Validação

O sistema valida:
- ✅ Estrutura JSON correta
- ✅ Tipos de dados (numbers, strings, booleans)
- ✅ Ranges válidos (0-100 para percentuais)
- ✅ Valores mínimos e máximos
- ✅ Estrutura do Excel (colunas e abas obrigatórias)

## 📈 Métricas de Sucesso

- **Tempo de ajuste**: < 2 horas (vs. 2 dias antes)
- **Rastreabilidade**: 100% das análises rastreadas
- **Versionamento**: Histórico completo de mudanças
- **Rollback**: Reversão em < 1 minuto

## 🚀 Próximas Melhorias

1. **Preview de Impacto**: Simular impacto antes de ativar
2. **Comparação de Versões**: Diff visual entre versões
3. **A/B Testing**: Testar múltiplas regras simultaneamente
4. **Regras por Perfil**: Diferentes regras para perfis de investidor
5. **IA Sugerir Ajustes**: IA propor otimizações baseadas em resultados

## 📚 Referências

- [Plan-001](../plans/plan-001-sistema-regras-recomendacao-fii.md)
- [Prisma Schema](../prisma/schema.prisma)
- [API Routes](../src/app/api/admin/recommendation-rules/)
- [Service](../src/lib/services/recommendation-rules.service.ts)
- [Frontend Page](../src/app/admin/regras-recomendacao/page.tsx)

## 👥 Manutenção

Para manutenção do sistema:

1. **Adicionar novo tipo de regra**: Atualizar schema Zod e interface TypeScript
2. **Modificar validação**: Editar `RecommendationRuleSetSchema` no service
3. **Alterar template Excel**: Modificar `generateExcelTemplate()` no service
4. **Adicionar campo no banco**: Criar migration Prisma

## 🐛 Troubleshooting

### Erro: "No active ruleset found"
**Solução**: Acesse `/admin/regras-recomendacao` e ative uma regra

### Excel não processa
**Solução**: Verifique se todas as abas obrigatórias existem

### Erro de validação
**Solução**: Valide o JSON no editor antes de salvar

### Não consigo excluir regra
**Solução**: Apenas regras inativas podem ser excluídas

## ✅ Status da Implementação

- [x] Backend Service
- [x] API Routes
- [x] Database Models
- [x] Frontend Interface
- [x] Excel Upload/Download
- [x] Versioning System
- [x] Integration with Portfolio Analysis
- [x] Documentation

**Data de Implementação**: 2025-09-29
**Versão**: 1.0
**Status**: ✅ Completo e Funcional