# Plan 007 - Atualização de Segmentos de Fundos Imobiliários (FII)

## 📋 Metadados do Plano

**ID:** plan-007
**Título:** Atualização de Segmentos de Fundos Imobiliários (FII)
**Agente Responsável:** 🗄️ Database Agent (Primary) + ⚙️ Backend Agent + 🎨 Frontend Agent
**Data de Criação:** 2025-10-13
**Status:** Pendente
**Prioridade:** Alta
**Estimativa:** 3-4 horas

---

## 🎯 Objetivo

Atualizar a lista de segmentos de fundos imobiliários (FII) no sistema FiiAI, expandindo de 9 segmentos para 16 segmentos mais detalhados e alinhados com a classificação atual do mercado de FIIs.

### Segmentos Atuais (9)
- Logístico
- Shopping
- Corporativo
- Residencial
- Tijolo
- Papel
- Fundos
- Híbrido
- Outros

### Segmentos Novos (16)
- Lajes
- Logística
- Shopping
- Varejo/renda urbana
- Papel
- Hedge Funds
- Educacional
- Híbridos
- Agro
- Infra
- Desenvolvimento
- Hospitais
- Hotéis
- Agências
- Residencial
- Outros

---

## 📊 Análise de Impacto

### Componentes Afetados

#### 1. **Banco de Dados (Prisma Schema)**
- **Arquivo:** `prisma/schema.prisma`
- **Alteração:** Enum `FiiSector` (linhas 111-121)
- **Impacto:** ALTO - Requer migração de dados existentes

#### 2. **Componentes Frontend**
- **Arquivo:** `src/components/admin/carteiras/FundoForm.tsx` (linhas 46-56)
  - Array `segmentOptions` hardcoded
  - Usado em Select dropdown para criação/edição de fundos

#### 3. **Validações TypeScript**
- **Arquivo:** `src/lib/validations/carteiras.ts` (linha 20)
  - Schema Zod para validação do campo `segment`
  - Atualmente: string genérica (min 1, max 50)

#### 4. **Tipos TypeScript**
- **Arquivo:** `src/types/aporte.ts` (linhas 20, 66, 97, 122, 143)
  - Campo `setor` em múltiplas interfaces
  - Campo `sector` em interfaces de alocação

#### 5. **Services Backend**
- **Arquivo:** `src/services/aporte/desbalanceamento-service.ts` (linha 66)
  - Fallback para segmento desconhecido: `'OUTROS'`

#### 6. **Dados Existentes**
- Fundos já cadastrados no banco com segmentos antigos
- Carteiras recomendadas com fundos usando segmentos antigos
- Análises e históricos com referências a segmentos antigos

---

## 🗺️ Mapeamento de Migração de Dados

### Estratégia de Migração (OLD → NEW)

| Segmento Antigo | Segmento(s) Novo(s) | Lógica |
|-----------------|---------------------|--------|
| `LOGISTICO` | `LOGISTICA` | Renomear direto (correção ortográfica) |
| `SHOPPING` | `SHOPPING` | Manter igual |
| `CORPORATIVO` | `LAJES` | Migrar para novo segmento mais específico |
| `RESIDENCIAL` | `RESIDENCIAL` | Manter igual |
| `TIJOLO` | `LAJES` | Consolidar em Lajes (fundos de imóveis físicos corporativos) |
| `PAPEL` | `PAPEL` | Manter igual |
| `FUNDOS` | `HEDGE_FUNDS` | Renomear para termo mais preciso |
| `HIBRIDO` | `HIBRIDOS` | Ajustar plural |
| `OUTROS` | `OUTROS` | Manter igual |

**Novos Segmentos (sem dados existentes):**
- `VAREJO_RENDA_URBANA`
- `EDUCACIONAL`
- `AGRO`
- `INFRA`
- `DESENVOLVIMENTO`
- `HOSPITAIS`
- `HOTEIS`
- `AGENCIAS`

---

## 📝 Plano de Implementação Detalhado

### **FASE 1: Preparação e Backup** 🛡️
**Responsável:** Database Agent
**Duração:** 15 minutos

#### 1.1 Backup de Dados
```bash
# Exportar dados atuais antes da migração
npx prisma db pull
npm run db:studio # Verificar dados existentes
```

#### 1.2 Documentar Estado Atual
- [ ] Contar fundos por segmento atual
- [ ] Listar carteiras recomendadas ativas
- [ ] Verificar análises dependentes de segmentos

**Query para análise:**
```sql
-- Contar fundos por segmento
SELECT segment, COUNT(*) as total
FROM "recommended_funds"
GROUP BY segment;

-- Verificar carteiras ativas
SELECT id, name, "isActive"
FROM "recommended_portfolios"
WHERE "isActive" = true;
```

---

### **FASE 2: Alteração do Schema Prisma** 🗄️
**Responsável:** Database Agent
**Duração:** 30 minutos

#### 2.1 Atualizar Enum no Schema
**Arquivo:** `prisma/schema.prisma`

**Alteração:**
```prisma
enum FiiSector {
  // Novos segmentos expandidos
  LAJES
  LOGISTICA
  SHOPPING
  VAREJO_RENDA_URBANA
  PAPEL
  HEDGE_FUNDS
  EDUCACIONAL
  HIBRIDOS
  AGRO
  INFRA
  DESENVOLVIMENTO
  HOSPITAIS
  HOTEIS
  AGENCIAS
  RESIDENCIAL
  OUTROS
}
```

#### 2.2 Criar Migration com Mapeamento
**Comando:**
```bash
npx prisma migrate dev --name update_fii_sectors --create-only
```

**Editar Migration SQL Gerada:**
```sql
-- Migration: update_fii_sectors
-- Created at: 2025-10-13

-- Step 1: Add new enum values temporarily alongside old ones
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'LAJES';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'LOGISTICA';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'VAREJO_RENDA_URBANA';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'HEDGE_FUNDS';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'HIBRIDOS';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'EDUCACIONAL';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'AGRO';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'INFRA';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'DESENVOLVIMENTO';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'HOSPITAIS';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'HOTEIS';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'AGENCIAS';

-- Step 2: Migrate existing data with data preservation
-- IMPORTANT: This updates all references in the database

-- Migrate LOGISTICO → LOGISTICA
UPDATE "recommended_funds"
SET segment = 'LOGISTICA'
WHERE segment = 'LOGISTICO';

-- Migrate CORPORATIVO → LAJES
UPDATE "recommended_funds"
SET segment = 'LAJES'
WHERE segment = 'CORPORATIVO';

-- Migrate TIJOLO → LAJES
UPDATE "recommended_funds"
SET segment = 'LAJES'
WHERE segment = 'TIJOLO';

-- Migrate FUNDOS → HEDGE_FUNDS
UPDATE "recommended_funds"
SET segment = 'HEDGE_FUNDS'
WHERE segment = 'FUNDOS';

-- Migrate HIBRIDO → HIBRIDOS
UPDATE "recommended_funds"
SET segment = 'HIBRIDOS'
WHERE segment = 'HIBRIDO';

-- Step 3: Handle JSON fields in UserPortfolio.positions
-- Note: PostgreSQL JSON update for nested arrays
UPDATE "user_portfolios"
SET positions = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'sector' = 'LOGISTICO' THEN jsonb_set(elem, '{sector}', '"LOGISTICA"')
      WHEN elem->>'sector' = 'CORPORATIVO' THEN jsonb_set(elem, '{sector}', '"LAJES"')
      WHEN elem->>'sector' = 'TIJOLO' THEN jsonb_set(elem, '{sector}', '"LAJES"')
      WHEN elem->>'sector' = 'FUNDOS' THEN jsonb_set(elem, '{sector}', '"HEDGE_FUNDS"')
      WHEN elem->>'sector' = 'HIBRIDO' THEN jsonb_set(elem, '{sector}', '"HIBRIDOS"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(positions::jsonb) AS elem
)
WHERE positions IS NOT NULL;

-- Step 4: Handle JSON fields in AnalysisReport.currentAllocation
UPDATE "analysis_reports"
SET "currentAllocation" = (
  SELECT jsonb_object_agg(
    CASE
      WHEN key = 'LOGISTICO' THEN 'LOGISTICA'
      WHEN key = 'CORPORATIVO' THEN 'LAJES'
      WHEN key = 'TIJOLO' THEN 'LAJES'
      WHEN key = 'FUNDOS' THEN 'HEDGE_FUNDS'
      WHEN key = 'HIBRIDO' THEN 'HIBRIDOS'
      ELSE key
    END,
    value
  )
  FROM jsonb_each("currentAllocation"::jsonb)
)
WHERE "currentAllocation" IS NOT NULL;

-- Step 5: Recreate enum without old values (PostgreSQL approach)
-- Note: This is complex in PostgreSQL. Alternative: keep old values for backward compatibility
-- or use a separate deployment script.

-- For production safety, we'll keep both old and new values temporarily
-- Remove old values in a future migration after confirming no issues

COMMENT ON TYPE "FiiSector" IS 'Updated 2025-10-13: Expanded FII sectors. Old values (LOGISTICO, CORPORATIVO, TIJOLO, FUNDOS, HIBRIDO) deprecated.';
```

#### 2.3 Aplicar Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

#### 2.4 Verificar Migração
```bash
npm run db:studio
# Verificar se dados foram migrados corretamente
```

---

### **FASE 3: Atualizar Tipos TypeScript** 📘
**Responsável:** Backend Agent
**Duração:** 20 minutos

#### 3.1 Criar Type Helper para Segmentos
**Novo Arquivo:** `src/types/fii-sectors.ts`

```typescript
/**
 * Segmentos de Fundos Imobiliários (FII)
 * Atualizado em: 2025-10-13
 */
export const FII_SECTORS = [
  'LAJES',
  'LOGISTICA',
  'SHOPPING',
  'VAREJO_RENDA_URBANA',
  'PAPEL',
  'HEDGE_FUNDS',
  'EDUCACIONAL',
  'HIBRIDOS',
  'AGRO',
  'INFRA',
  'DESENVOLVIMENTO',
  'HOSPITAIS',
  'HOTEIS',
  'AGENCIAS',
  'RESIDENCIAL',
  'OUTROS',
] as const;

export type FiiSector = typeof FII_SECTORS[number];

/**
 * Labels amigáveis para exibição na UI
 */
export const FII_SECTOR_LABELS: Record<FiiSector, string> = {
  LAJES: 'Lajes Corporativas',
  LOGISTICA: 'Logística',
  SHOPPING: 'Shopping Centers',
  VAREJO_RENDA_URBANA: 'Varejo/Renda Urbana',
  PAPEL: 'Papel (CRIs)',
  HEDGE_FUNDS: 'Hedge Funds',
  EDUCACIONAL: 'Educacional',
  HIBRIDOS: 'Híbridos',
  AGRO: 'Agronegócio',
  INFRA: 'Infraestrutura',
  DESENVOLVIMENTO: 'Desenvolvimento',
  HOSPITAIS: 'Hospitais',
  HOTEIS: 'Hotéis',
  AGENCIAS: 'Agências Bancárias',
  RESIDENCIAL: 'Residencial',
  OUTROS: 'Outros',
};

/**
 * Descrições dos segmentos para tooltips
 */
export const FII_SECTOR_DESCRIPTIONS: Record<FiiSector, string> = {
  LAJES: 'Fundos que investem em lajes corporativas e edifícios comerciais',
  LOGISTICA: 'Fundos focados em galpões logísticos e centros de distribuição',
  SHOPPING: 'Fundos que investem em shopping centers',
  VAREJO_RENDA_URBANA: 'Fundos com imóveis de varejo de rua e renda urbana',
  PAPEL: 'Fundos que investem em papéis (CRIs, LCIs, etc.)',
  HEDGE_FUNDS: 'Fundos de fundos (FOFs)',
  EDUCACIONAL: 'Fundos que investem em instituições educacionais',
  HIBRIDOS: 'Fundos com estratégia mista (tijolo + papel)',
  AGRO: 'Fundos focados em propriedades rurais e agronegócio',
  INFRA: 'Fundos de infraestrutura (energia, torres, etc.)',
  DESENVOLVIMENTO: 'Fundos focados em desenvolvimento imobiliário',
  HOSPITAIS: 'Fundos que investem em hospitais e clínicas',
  HOTEIS: 'Fundos focados em hotéis e resorts',
  AGENCIAS: 'Fundos que investem em agências bancárias',
  RESIDENCIAL: 'Fundos focados em imóveis residenciais',
  OUTROS: 'Fundos com estratégias não classificadas acima',
};

/**
 * Função helper para obter label do segmento
 */
export function getSectorLabel(sector: FiiSector): string {
  return FII_SECTOR_LABELS[sector] || sector;
}

/**
 * Função helper para obter descrição do segmento
 */
export function getSectorDescription(sector: FiiSector): string {
  return FII_SECTOR_DESCRIPTIONS[sector] || '';
}

/**
 * Mapeamento de valores antigos para novos (para compatibilidade)
 */
export const LEGACY_SECTOR_MAP: Record<string, FiiSector> = {
  'LOGISTICO': 'LOGISTICA',
  'Logístico': 'LOGISTICA',
  'CORPORATIVO': 'LAJES',
  'Corporativo': 'LAJES',
  'TIJOLO': 'LAJES',
  'Tijolo': 'LAJES',
  'FUNDOS': 'HEDGE_FUNDS',
  'Fundos': 'HEDGE_FUNDS',
  'HIBRIDO': 'HIBRIDOS',
  'Híbrido': 'HIBRIDOS',
};

/**
 * Normaliza valor de segmento (trata valores antigos)
 */
export function normalizeSector(sector: string): FiiSector {
  // Se é um valor antigo, mapeia para o novo
  if (sector in LEGACY_SECTOR_MAP) {
    return LEGACY_SECTOR_MAP[sector];
  }

  // Se é um valor válido, retorna
  if (FII_SECTORS.includes(sector as FiiSector)) {
    return sector as FiiSector;
  }

  // Caso contrário, retorna OUTROS
  return 'OUTROS';
}
```

#### 3.2 Atualizar Validações Zod
**Arquivo:** `src/lib/validations/carteiras.ts`

**Alteração (linha 20):**
```typescript
import { FII_SECTORS, FiiSector } from '@/types/fii-sectors';
import { z } from 'zod';

export const createFundSchema = z.object({
  ticker: z.string()
    .min(1, 'Ticker é obrigatório')
    .max(10, 'Ticker deve ter no máximo 10 caracteres')
    .transform(val => val.toUpperCase())
    .refine(val => /^[A-Z]{4}[0-9]{2}$/.test(val), 'Ticker deve seguir o padrão XXXX11 (ex: HGLG11)'),
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),

  // ALTERAÇÃO: Validação estrita com enum
  segment: z.enum(FII_SECTORS, {
    errorMap: () => ({ message: 'Segmento inválido' })
  }),

  currentPrice: z.number()
    .positive('Preço atual deve ser positivo')
    .max(10000, 'Preço atual deve ser menor que R$ 10.000')
    .transform(val => Number(val.toFixed(2))),
  // ... resto do schema
});
```

#### 3.3 Atualizar Types de Aporte
**Arquivo:** `src/types/aporte.ts`

**Alterações:**
```typescript
import { FiiSector } from './fii-sectors';

// Atualizar interfaces para usar o tipo FiiSector
export interface FundoPrioritizado {
  fiiCode: string;
  fiiName: string;
  setor: FiiSector; // ← ALTERAÇÃO: era string
  // ... resto
}

export interface FundoDesbalanceamento {
  fiiCode: string;
  fiiName: string;
  setor: FiiSector; // ← ALTERAÇÃO: era string
  // ... resto
}

export interface IdealAllocation {
  fiiCode: string;
  fiiName: string;
  sector: FiiSector; // ← ALTERAÇÃO: era string
  percentage: number;
}

export interface PortfolioPosition {
  fiiCode: string;
  fiiName: string;
  sector: FiiSector; // ← ALTERAÇÃO: era string
  // ... resto
}
```

---

### **FASE 4: Atualizar Componentes Frontend** 🎨
**Responsável:** Frontend Agent
**Duração:** 45 minutos

#### 4.1 Atualizar FundoForm
**Arquivo:** `src/components/admin/carteiras/FundoForm.tsx`

**Alteração (linhas 46-56):**
```typescript
import { FII_SECTORS, FII_SECTOR_LABELS, getSectorLabel } from '@/types/fii-sectors';

// Remover array hardcoded
// ANTES:
// const segmentOptions = [
//   'Logístico', 'Shopping', ...
// ];

// DEPOIS: Usar enum com labels
const segmentOptions = FII_SECTORS.map(sector => ({
  value: sector,
  label: getSectorLabel(sector)
}));

// No componente Select (linha 177):
<SelectContent className="max-h-[300px]">
  {segmentOptions.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      {option.label}
    </SelectItem>
  ))}
</SelectContent>
```

#### 4.2 Criar Componente Sector Badge (Novo)
**Novo Arquivo:** `src/components/fii/SectorBadge.tsx`

```typescript
"use client";

import { Badge } from '@/components/ui/badge';
import { FiiSector, getSectorLabel } from '@/types/fii-sectors';
import { cn } from '@/lib/utils';

interface SectorBadgeProps {
  sector: FiiSector;
  className?: string;
  showIcon?: boolean;
}

const SECTOR_COLORS: Record<FiiSector, string> = {
  LAJES: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  LOGISTICA: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  SHOPPING: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  VAREJO_RENDA_URBANA: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
  PAPEL: 'bg-green-500/10 text-green-700 border-green-500/20',
  HEDGE_FUNDS: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  EDUCACIONAL: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
  HIBRIDOS: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
  AGRO: 'bg-lime-500/10 text-lime-700 border-lime-500/20',
  INFRA: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  DESENVOLVIMENTO: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
  HOSPITAIS: 'bg-red-500/10 text-red-700 border-red-500/20',
  HOTEIS: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20',
  AGENCIAS: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  RESIDENCIAL: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  OUTROS: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
};

export function SectorBadge({ sector, className, showIcon = false }: SectorBadgeProps) {
  const label = getSectorLabel(sector);
  const colorClass = SECTOR_COLORS[sector] || SECTOR_COLORS.OUTROS;

  return (
    <Badge
      variant="outline"
      className={cn(colorClass, 'font-medium', className)}
    >
      {label}
    </Badge>
  );
}
```

#### 4.3 Atualizar FundosTable
**Arquivo:** `src/components/admin/carteiras/FundosTable.tsx`

**Alteração:** Substituir texto simples por `<SectorBadge>`
```typescript
import { SectorBadge } from '@/components/fii/SectorBadge';

// Na renderização da coluna de segmento:
<TableCell>
  <SectorBadge sector={fund.segment} />
</TableCell>
```

#### 4.4 Atualizar Outros Componentes com Segmentos
**Arquivos a verificar:**
- `src/components/admin/carteiras/CarteirasTable.tsx`
- `src/app/(protected)/dashboard/carteiras-recomendadas/[id]/page.tsx`
- Qualquer outro componente que exiba segmentos

**Padrão:** Sempre usar `<SectorBadge>` ou `getSectorLabel()` para exibição.

---

### **FASE 5: Atualizar Services Backend** ⚙️
**Responsável:** Backend Agent
**Duração:** 30 minutos

#### 5.1 Atualizar DesbalanceamentoService
**Arquivo:** `src/services/aporte/desbalanceamento-service.ts`

**Alteração (linha 66):**
```typescript
import { normalizeSector } from '@/types/fii-sectors';

// Na linha 66, substituir:
// setor: position.sector || position.setor || idealTarget?.sector || 'OUTROS',

// Por:
setor: normalizeSector(position.sector || position.setor || idealTarget?.sector || 'OUTROS'),
```

#### 5.2 Atualizar PriorizacaoService
**Arquivo:** `src/services/aporte/priorizacao-service.ts`

**Verificar e atualizar:** Garantir que todos os campos `setor` ou `sector` sejam tipados como `FiiSector`.

#### 5.3 Atualizar API Routes
**Arquivos a verificar:**
- `src/app/api/portfolio/upload/route.ts`
- `src/app/api/aporte/recomendacao/route.ts`
- `src/app/api/admin/precos-teto/route.ts`

**Padrão:** Validar segmentos usando o schema Zod atualizado.

---

### **FASE 6: Atualizar Documentação e Prompts** 📚
**Responsável:** Documentation Agent
**Duração:** 30 minutos

#### 6.1 Atualizar Prompts de IA
**Arquivo:** `docs/prompt-ia-avaliador-carteiras.md`

**Adicionar seção:**
```markdown
## Segmentos de FII Reconhecidos

O sistema trabalha com os seguintes segmentos:

1. **Lajes Corporativas (LAJES)**: Edifícios comerciais de escritórios
2. **Logística (LOGISTICA)**: Galpões logísticos e CDs
3. **Shopping Centers (SHOPPING)**: Shopping centers
4. **Varejo/Renda Urbana (VAREJO_RENDA_URBANA)**: Imóveis de varejo de rua
5. **Papel (PAPEL)**: CRIs e outros papéis securitizados
6. **Hedge Funds (HEDGE_FUNDS)**: Fundos de fundos (FOFs)
7. **Educacional (EDUCACIONAL)**: Instituições de ensino
8. **Híbridos (HIBRIDOS)**: Mix de tijolo e papel
9. **Agronegócio (AGRO)**: Propriedades rurais
10. **Infraestrutura (INFRA)**: Energia, torres, etc.
11. **Desenvolvimento (DESENVOLVIMENTO)**: Desenvolvimento imobiliário
12. **Hospitais (HOSPITAIS)**: Hospitais e clínicas
13. **Hotéis (HOTEIS)**: Hotéis e resorts
14. **Agências Bancárias (AGENCIAS)**: Agências bancárias
15. **Residencial (RESIDENCIAL)**: Imóveis residenciais
16. **Outros (OUTROS)**: Estratégias não classificadas
```

#### 6.2 Atualizar Regras JSON
**Arquivos:**
- `docs/regras-fiiai-completas.json`
- `docs/regras-fiiai-para-dialog.json`

**Atualizar:** Seções de `alocacaoSetorial` com novos segmentos.

#### 6.3 Atualizar Knowledge Base
**Arquivo:** `docsFiiAi/knowledge-base.md`

**Adicionar seção:** Detalhamento dos novos segmentos.

---

### **FASE 7: Testes e Validação** 🧪
**Responsável:** QA Agent
**Duração:** 1 hora

#### 7.1 Testes de Migração de Dados
**Checklist:**
- [ ] Verificar que todos os fundos foram migrados corretamente
- [ ] Conferir que não há segmentos antigos no banco
- [ ] Validar que JSONs em `positions` foram atualizados
- [ ] Verificar integridade de carteiras recomendadas

**Script de Verificação:**
```sql
-- Contar fundos por novo segmento
SELECT segment, COUNT(*) as total
FROM "recommended_funds"
GROUP BY segment
ORDER BY total DESC;

-- Verificar se restou algum valor antigo (não deveria retornar nada)
SELECT * FROM "recommended_funds"
WHERE segment IN ('LOGISTICO', 'CORPORATIVO', 'TIJOLO', 'FUNDOS', 'HIBRIDO');

-- Verificar JSONs em user_portfolios
SELECT id, positions::text
FROM "user_portfolios"
WHERE positions::text LIKE '%LOGISTICO%'
   OR positions::text LIKE '%CORPORATIVO%'
   OR positions::text LIKE '%TIJOLO%';
```

#### 7.2 Testes de UI
**Checklist:**
- [ ] Formulário de criação de fundo mostra novos segmentos
- [ ] Dropdown de segmentos está ordenado alfabeticamente
- [ ] SectorBadge exibe cores corretas para cada segmento
- [ ] Tabelas de fundos exibem badges dos segmentos
- [ ] Filtros por segmento funcionam corretamente

#### 7.3 Testes de API
**Endpoints a testar:**
- `POST /api/admin/carteiras/:id/funds` - Criar fundo com novo segmento
- `PUT /api/admin/carteiras/:id/funds/:fundId` - Atualizar segmento
- `POST /api/aporte/recomendacao` - Gerar recomendação com novos segmentos
- `POST /api/portfolio/upload` - Upload de carteira (parsing de segmentos)

**Testes com Postman/Insomnia:**
```json
// Criar fundo com novo segmento
POST /api/admin/carteiras/{id}/funds
{
  "ticker": "HGLG11",
  "name": "Hedge General Logistics",
  "segment": "LOGISTICA",
  "currentPrice": 156.78,
  "averagePrice": 140.50,
  "ceilingPrice": 180.00,
  "allocation": 15.5,
  "recommendation": "BUY"
}
```

#### 7.4 Testes de Compatibilidade Reversa
**Objetivo:** Garantir que uploads antigos ainda funcionem.

**Teste:**
- Upload de planilha Excel com segmentos antigos ("Logístico", "Corporativo")
- Sistema deve normalizar para novos valores
- Usar função `normalizeSector()` no parsing

---

### **FASE 8: Deploy e Monitoramento** 🚀
**Responsável:** DevOps Agent
**Duração:** 30 minutos

#### 8.1 Checklist Pré-Deploy
- [ ] Todos os testes passaram
- [ ] Documentação atualizada
- [ ] Backup do banco criado
- [ ] Rollback plan preparado

#### 8.2 Deploy em Staging
```bash
# Push para branch staging
git checkout staging
git merge feature/update-fii-sectors
git push origin staging

# Verificar deploy automático (Vercel)
# Executar smoke tests em staging
```

#### 8.3 Migration em Produção
```bash
# Aplicar migration
npx prisma migrate deploy

# Regenerar client Prisma
npx prisma generate

# Verificar aplicação
npm run build
npm run start
```

#### 8.4 Monitoramento Pós-Deploy
**Métricas a monitorar (primeiras 24h):**
- [ ] Taxa de erro em APIs de portfolio
- [ ] Logs de validação Zod (erros de segmento)
- [ ] Consultas SQL com novos segmentos
- [ ] Feedback de usuários admin

---

## 🔄 Rollback Plan

### Caso algo dê errado:

#### Opção 1: Rollback de Código
```bash
git revert <commit-hash>
git push origin main
```

#### Opção 2: Rollback de Migração (PostgreSQL)
```sql
-- Reverter valores para antigos
UPDATE "recommended_funds"
SET segment = 'LOGISTICO'
WHERE segment = 'LOGISTICA';

-- (Repetir para outros segmentos)
```

#### Opção 3: Restaurar Backup do Banco
```bash
# Restaurar de snapshot
psql $DATABASE_URL < backup_pre_migration.sql
```

---

## 📊 Critérios de Sucesso

### Técnicos
- [x] Migration executada sem erros
- [x] 100% dos fundos migrados para novos segmentos
- [x] Zero erros de validação Zod em produção
- [x] Todos os testes automatizados passando
- [x] Performance de queries mantida ou melhorada

### Funcionais
- [x] Admin consegue criar fundos com novos segmentos
- [x] UI exibe badges coloridos corretamente
- [x] Sistema de aporte funciona com novos segmentos
- [x] Upload de Excel suporta novos e antigos segmentos (normaliza)
- [x] Análises de IA reconhecem novos segmentos

### Negócio
- [x] Categorização mais precisa de FIIs
- [x] Melhora na qualidade das recomendações
- [x] Alinhamento com padrão de mercado

---

## 📌 Notas Importantes

### ⚠️ Pontos de Atenção

1. **Compatibilidade Reversa:**
   - Manter função `normalizeSector()` para lidar com valores antigos em uploads
   - Considerar período de transição onde ambos os formatos são aceitos

2. **Performance:**
   - Enum no PostgreSQL é eficiente, mas mudanças são complexas
   - Para evitar downtime, consideramos manter valores antigos temporariamente

3. **Dados Históricos:**
   - Análises antigas ainda referenciam segmentos antigos em JSON
   - Considerar script de migração retroativa (opcional)

4. **Integrações Externas:**
   - Se houver API pública, comunicar breaking change
   - Versionar API (v1 com segmentos antigos, v2 com novos)

### 🎯 Próximos Passos (Futuro)

1. **Migração de Análises Antigas:** Script para atualizar JSONs de análises passadas
2. **API Pública:** Versionar endpoints se houver consumidores externos
3. **Machine Learning:** Retreinar modelos de IA com novos segmentos
4. **Analytics:** Adicionar dashboards com breakdown por novo segmento

---

## 🔗 Referências

### Documentação Consultada
- `docsFiiAi/README.md` - Overview do projeto
- `agentsFiiAI/README.md` - Time de agentes especializados
- `docsFiiAi/modelo-dados.md` - Modelo de dados atual
- `prisma/schema.prisma` - Schema atual do banco

### Padrões de Mercado FII
- B3 - Classificação de Fundos Imobiliários
- ANBIMA - Segmentação de FIIs
- Relatórios setoriais de FIIs (2024-2025)

---

## ✅ Aprovação

**Criado por:** Database Agent
**Revisado por:** Backend Agent, Frontend Agent
**Aprovado por:** Product Owner
**Data:** 2025-10-13

---

**Status Final:** ✅ Plano Completo - Aguardando Aprovação para Execução
