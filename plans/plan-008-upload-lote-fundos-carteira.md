# Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas

**Data:** 2025-10-13
**Agente Responsável:** Frontend Agent (coordenação com Backend e Database)
**Módulo:** Admin - Gestão de Carteiras Recomendadas
**Prioridade:** P1 (Alta)
**Estimativa:** 4-6 dias

---

## 📋 Sumário Executivo

Implementar funcionalidade de importação em massa de fundos (FIIs) através de upload de planilha Excel/CSV na interface de gestão de carteiras recomendadas. Atualmente, a criação de fundos é feita individualmente através de formulário manual. A solução proposta adiciona uma interface de upload com drag-and-drop, validação de dados (ticker, segmento, preços, alocação), preview e processamento em lote para adicionar múltiplos fundos de uma só vez.

**Contexto:** Admin está gerenciando a carteira "Carteira Recomendada 2025" (ID: cmg4gkp4m0000ednka3a8sknw) e precisa adicionar/atualizar 20-30 fundos de forma eficiente.

---

## 🎯 Objetivos e Valor de Negócio

### **Objetivos:**
1. Permitir criação/atualização de múltiplos fundos simultaneamente via planilha
2. Criar interface intuitiva com drag-and-drop para upload de Excel/CSV
3. Validar dados antes do processamento (ticker, segmento, preços, alocação total)
4. Suportar modo INSERT (adicionar novos) e UPDATE (atualizar existentes)
5. Processar operações em transação com rollback em caso de erro
6. Fornecer relatório detalhado de sucessos/falhas

### **Valor de Negócio:**
- **Eficiência:** Redução de 98% no tempo para montar carteira completa
- **Escalabilidade:** Criação de múltiplas carteiras rapidamente
- **Redução de Erros:** Validação automática de alocação (soma = 100%)
- **Flexibilidade:** Atualização em massa de preços/recomendações
- **Experiência Admin:** Interface moderna alinhada ao design do sistema

### **Métricas de Sucesso:**
- Redução de tempo: De 3min/fundo para < 30s para 20 fundos
- Taxa de erro < 1% após validações
- 100% validação de alocação antes de salvar
- Satisfação admin: NPS > 9 na feature

---

## 🔍 Análise do Problema Atual

### **Situação Atual:**
- Adição manual um por um em `/admin/carteiras/[id]/fundos/novo`
- Formulário com campos: Ticker, Nome, Segmento, Preço Atual, Preço Médio, Preço Teto, Alocação (%), Recomendação
- API: `POST /api/admin/carteiras/[id]/fundos`
- Hook: `useCreateFund` com TanStack Query
- Validação: Alocação total não pode exceder 100%

### **Dores Identificadas:**
- ⏱️ **Tempo:** Adicionar 20 fundos leva ~60 minutos
- 🔄 **Repetição:** Processo manual repetitivo e sujeito a erros de digitação
- 📊 **Setup Inicial:** Impossível criar carteira completa rapidamente
- ❌ **Erros de Alocação:** Difícil garantir que soma = 100% manualmente
- 🔢 **Atualização em Massa:** Atualizar preços de todos os fundos é trabalhoso

### **Casos de Uso Prioritários:**
1. **Setup de Nova Carteira:** Criar carteira com 18 fundos de uma vez
2. **Atualização de Preços:** Atualizar preços de todos os fundos mensalmente
3. **Rebalanceamento:** Ajustar alocações de múltiplos fundos
4. **Migração:** Importar carteiras de planilhas de analistas
5. **Clone/Template:** Duplicar carteira existente com ajustes

---

## 🏗️ Arquitetura da Solução

### **Componentes Principais:**

```
┌─────────────────────────────────────────────────────────────┐
│          Admin Portfolio Detail Page                         │
│  /admin/carteiras/[id]                                       │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─► [Adicionar Fundo] (individual - existente)
                │
                └─► [Upload Planilha] (novo)
                        │
                        ▼
            ┌───────────────────────────┐
            │  BulkFundImportDialog     │
            │  (Modal Component)         │
            └───────────┬───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  FileUpload      DataPreview    ValidationResults
  (Drag&Drop)     (Table)        (Erros/Avisos)
                        │
                        ▼
              ProcessingProgress
              (Progress Bar)
                        │
                        ▼
               ResultsSummary
            (Sucesso/Falha Log)
```

### **Fluxo de Dados:**

```
1. Upload Arquivo (.xlsx/.csv)
   ↓
2. Parse Arquivo (xlsx/papaparse)
   ↓
3. Validação de Estrutura
   - Verificar colunas: ticker, nome, segmento, preços, alocação, recomendação
   - Verificar formato de dados
   ↓
4. Validação de Dados
   - Ticker válido (formato)
   - Segmento existe no enum
   - Preços válidos (números positivos)
   - Alocação soma = 100%
   - Recomendação válida (BUY/SELL/HOLD)
   ↓
5. Validação de Negócio
   - Detectar fundos já existentes na carteira (UPDATE vs INSERT)
   - Validar unicidade de tickers
   - Verificar limite de alocação total
   ↓
6. Preview + Confirmação
   - Mostrar tabela com ações (CRIAR/ATUALIZAR/ERRO)
   - Permitir correções inline
   - Remover linhas inválidas
   - Exibir totalizadores (alocação total, qtd fundos)
   ↓
7. Processamento em Transação
   - Criar novos fundos
   - Atualizar existentes
   - Rollback em caso de erro
   ↓
8. Relatório Final
   - Sucessos: N fundos criados/atualizados
   - Falhas: Log detalhado por linha
   - Alocação final da carteira
```

---

## 📂 Estrutura de Arquivos

### **Novos Arquivos a Criar:**

```
src/
├── components/
│   └── admin/
│       └── carteiras/
│           ├── BulkFundImportDialog.tsx       # Modal principal
│           ├── FundFileUploadZone.tsx         # Drag & drop area
│           ├── FundImportPreview.tsx          # Tabela de preview
│           ├── FundValidationResults.tsx      # Lista de erros/avisos
│           ├── FundImportProgress.tsx         # Barra de progresso
│           └── FundImportSummary.tsx          # Resumo final
│
├── hooks/
│   └── admin/
│       ├── use-bulk-import-funds.ts          # Hook principal de importação
│       └── use-parse-fund-file.ts            # Hook para parse de arquivo
│
├── lib/
│   ├── parsers/
│   │   └── fund-file-parser.ts               # Parse .xlsx/.csv para fundos
│   └── validators/
│       └── fund-import-validator.ts          # Validações de dados de fundos
│
├── app/
│   └── api/
│       └── admin/
│           └── carteiras/
│               └── [id]/
│                   └── fundos/
│                       ├── bulk-import/
│                       │   └── route.ts      # POST - Processar importação
│                       └── validate-bulk/
│                           └── route.ts      # POST - Validar antes de processar
│
└── types/
    └── fund-import.ts                        # Interfaces TypeScript
```

### **Arquivos a Modificar:**

```
src/
├── app/
│   └── admin/
│       └── carteiras/
│           └── [id]/
│               └── page.tsx                  # Adicionar botão "Upload Planilha"
│
├── components/
│   └── admin/
│       └── carteiras/
│           └── FundosTable.tsx               # (opcional) Adicionar ação de export
│
└── package.json                              # Dependências já instaladas (xlsx, papaparse)
```

---

## 🛠️ Implementação Técnica Detalhada

### **FASE 1: Setup e Types** (Dia 1)

#### **1.1 Criar Types**

**Arquivo:** `src/types/fund-import.ts`

```typescript
import { FundRecommendation } from '@prisma/client';

export interface FundImportRow {
  ticker: string;
  nome: string;
  segmento: string;
  precoAtual: number;
  precoMedio: number;
  precoTeto: number;
  alocacao: number;
  recomendacao: FundRecommendation;
  rowNumber: number; // Linha original na planilha
}

export interface FundValidationError {
  rowNumber: number;
  field: keyof Omit<FundImportRow, 'rowNumber'>;
  error: string;
  value: any;
}

export interface FundValidationWarning {
  rowNumber: number;
  message: string;
}

export interface FundImportValidationResult {
  valid: FundImportRow[];
  errors: FundValidationError[];
  warnings: FundValidationWarning[];
  existingFunds: Array<{
    ticker: string;
    rowNumber: number;
    action: 'UPDATE';
  }>;
  newFunds: Array<{
    ticker: string;
    rowNumber: number;
    action: 'INSERT';
  }>;
  totalAllocation: number;
  allocationValid: boolean;
}

export interface FundImportProgress {
  total: number;
  processed: number;
  created: number;
  updated: number;
  failed: number;
}

export interface FundImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    ticker: string;
    error: string;
  }>;
  finalAllocation: number;
  duration: number; // ms
  timestamp: Date;
}

export interface ParsedFundFile {
  data: FundImportRow[];
  fileName: string;
  fileSize: number;
  rowCount: number;
}
```

---

### **FASE 2: Backend - APIs** (Dias 2-3)

#### **2.1 Endpoint de Validação**

**Arquivo:** `src/app/api/admin/carteiras/[id]/fundos/validate-bulk/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { FundRecommendation } from '@prisma/client';
import { getSectorOptions } from '@/types/fii-sectors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const FundRowSchema = z.object({
  ticker: z.string().min(1).max(10),
  nome: z.string().min(1),
  segmento: z.string().min(1),
  precoAtual: z.number().positive(),
  precoMedio: z.number().positive(),
  precoTeto: z.number().positive(),
  alocacao: z.number().min(0).max(100),
  recomendacao: z.nativeEnum(FundRecommendation),
  rowNumber: z.number(),
});

const BulkValidateSchema = z.object({
  funds: z.array(FundRowSchema),
});

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Autenticação admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { id: portfolioId } = await params;

    // 2. Verificar se carteira existe
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        funds: {
          select: { ticker: true, id: true, allocation: true }
        }
      }
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Carteira não encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar payload
    const body = await request.json();
    const validation = BulkValidateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { funds } = validation.data;

    // 4. Validar segmentos
    const validSegments = getSectorOptions().map(s => s.value);
    const errors: FundValidationError[] = [];
    const warnings: FundValidationWarning[] = [];

    funds.forEach(fund => {
      if (!validSegments.includes(fund.segmento)) {
        errors.push({
          rowNumber: fund.rowNumber,
          field: 'segmento',
          error: `Segmento inválido. Use um dos valores válidos: ${validSegments.slice(0, 5).join(', ')}...`,
          value: fund.segmento
        });
      }

      // Avisar se preço atual > preço teto
      if (fund.precoAtual > fund.precoTeto) {
        warnings.push({
          rowNumber: fund.rowNumber,
          message: `Preço atual (${fund.precoAtual}) maior que preço teto (${fund.precoTeto})`
        });
      }

      // Avisar se alocação muito baixa
      if (fund.alocacao < 1) {
        warnings.push({
          rowNumber: fund.rowNumber,
          message: `Alocação muito baixa (${fund.alocacao}%). Considere pelo menos 1%.`
        });
      }
    });

    // 5. Verificar fundos existentes vs novos
    const existingTickers = new Set(portfolio.funds.map(f => f.ticker.toUpperCase()));
    const existingFunds: Array<{ ticker: string; rowNumber: number; action: 'UPDATE' }> = [];
    const newFunds: Array<{ ticker: string; rowNumber: number; action: 'INSERT' }> = [];

    funds.forEach(fund => {
      if (existingTickers.has(fund.ticker.toUpperCase())) {
        existingFunds.push({
          ticker: fund.ticker,
          rowNumber: fund.rowNumber,
          action: 'UPDATE'
        });
      } else {
        newFunds.push({
          ticker: fund.ticker,
          rowNumber: fund.rowNumber,
          action: 'INSERT'
        });
      }
    });

    // 6. Verificar duplicatas na planilha
    const tickerMap = new Map<string, number[]>();
    funds.forEach(fund => {
      const rows = tickerMap.get(fund.ticker.toUpperCase()) || [];
      rows.push(fund.rowNumber);
      tickerMap.set(fund.ticker.toUpperCase(), rows);
    });

    const duplicatesInFile = Array.from(tickerMap.entries())
      .filter(([_, rows]) => rows.length > 1)
      .flatMap(([ticker, rows]) =>
        rows.map(rowNumber => ({ ticker, rowNumber }))
      );

    if (duplicatesInFile.length > 0) {
      duplicatesInFile.forEach(dup => {
        errors.push({
          rowNumber: dup.rowNumber,
          field: 'ticker',
          error: `Ticker duplicado na planilha: ${dup.ticker}`,
          value: dup.ticker
        });
      });
    }

    // 7. Validar alocação total
    const totalAllocation = funds.reduce((sum, fund) => sum + fund.alocacao, 0);
    const allocationValid = Math.abs(totalAllocation - 100) < 0.1; // tolerância de 0.1%

    if (!allocationValid) {
      warnings.push({
        rowNumber: 0,
        message: `Alocação total = ${totalAllocation.toFixed(1)}%. Deve somar 100%.`
      });
    }

    // 8. Retornar resultado
    return NextResponse.json({
      valid: funds.filter(f =>
        !errors.some(e => e.rowNumber === f.rowNumber)
      ),
      errors,
      warnings,
      existingFunds,
      newFunds,
      totalAllocation,
      allocationValid,
      summary: {
        total: funds.length,
        valid: funds.length - errors.length,
        toCreate: newFunds.length,
        toUpdate: existingFunds.length,
        errors: errors.length,
        warnings: warnings.length
      }
    });
  } catch (error: any) {
    console.error('Erro na validação em massa de fundos:', error);
    return NextResponse.json(
      { error: 'Erro ao validar fundos', details: error.message },
      { status: 500 }
    );
  }
}
```

#### **2.2 Endpoint de Importação**

**Arquivo:** `src/app/api/admin/carteiras/[id]/fundos/bulk-import/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { FundRecommendation } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const FundRowSchema = z.object({
  ticker: z.string().min(1).max(10),
  nome: z.string().min(1),
  segmento: z.string().min(1),
  precoAtual: z.number().positive(),
  precoMedio: z.number().positive(),
  precoTeto: z.number().positive(),
  alocacao: z.number().min(0).max(100),
  recomendacao: z.nativeEnum(FundRecommendation),
  rowNumber: z.number(),
});

const BulkImportSchema = z.object({
  funds: z.array(FundRowSchema),
  mode: z.enum(['replace', 'merge']).default('merge'), // replace = deleta tudo antes
});

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const startTime = Date.now();

  try {
    // 1. Autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { id: portfolioId } = await params;

    // 2. Verificar carteira
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        funds: {
          select: { id: true, ticker: true }
        }
      }
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Carteira não encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar payload
    const body = await request.json();
    const validation = BulkImportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { funds, mode } = validation.data;

    // 4. Validar alocação total
    const totalAllocation = funds.reduce((sum, f) => sum + f.alocacao, 0);
    if (Math.abs(totalAllocation - 100) > 0.1) {
      return NextResponse.json(
        { error: `Alocação total inválida: ${totalAllocation.toFixed(1)}%. Deve somar 100%.` },
        { status: 400 }
      );
    }

    // 5. Processar em transação
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ rowNumber: number; ticker: string; error: string }> = [];

    const existingTickerMap = new Map(
      portfolio.funds.map(f => [f.ticker.toUpperCase(), f.id])
    );

    try {
      await db.$transaction(async (tx) => {
        // Se mode = 'replace', deletar todos os fundos existentes
        if (mode === 'replace') {
          await tx.recommendedFund.deleteMany({
            where: { portfolioId }
          });
        }

        // Processar cada fundo
        for (const fund of funds) {
          try {
            const existingId = existingTickerMap.get(fund.ticker.toUpperCase());

            if (existingId && mode === 'merge') {
              // Atualizar existente
              await tx.recommendedFund.update({
                where: { id: existingId },
                data: {
                  name: fund.nome,
                  segment: fund.segmento,
                  currentPrice: fund.precoAtual,
                  averagePrice: fund.precoMedio,
                  ceilingPrice: fund.precoTeto,
                  allocation: fund.alocacao,
                  recommendation: fund.recomendacao
                }
              });
              updated++;
            } else {
              // Criar novo
              await tx.recommendedFund.create({
                data: {
                  portfolioId,
                  ticker: fund.ticker.toUpperCase(),
                  name: fund.nome,
                  segment: fund.segmento,
                  currentPrice: fund.precoAtual,
                  averagePrice: fund.precoMedio,
                  ceilingPrice: fund.precoTeto,
                  allocation: fund.alocacao,
                  recommendation: fund.recomendacao
                }
              });
              created++;
            }
          } catch (error: any) {
            failed++;
            errors.push({
              rowNumber: fund.rowNumber,
              ticker: fund.ticker,
              error: error.message || 'Erro ao processar fundo'
            });
          }
        }
      });

      // 6. Calcular alocação final
      const finalFunds = await db.recommendedFund.findMany({
        where: { portfolioId },
        select: { allocation: true }
      });

      const finalAllocation = finalFunds.reduce(
        (sum, f) => sum + Number(f.allocation),
        0
      );

      const duration = Date.now() - startTime;

      // 7. Retornar resultado
      return NextResponse.json({
        total: funds.length,
        created,
        updated,
        failed,
        errors,
        finalAllocation,
        duration,
        timestamp: new Date()
      });
    } catch (error: any) {
      console.error('Erro na transação de importação:', error);
      return NextResponse.json(
        { error: 'Erro ao processar importação', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro na importação em massa de fundos:', error);
    return NextResponse.json(
      { error: 'Erro ao importar fundos', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### **FASE 3: Parsers e Validadores** (Dia 3)

#### **3.1 Fund File Parser**

**Arquivo:** `src/lib/parsers/fund-file-parser.ts`

```typescript
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ParsedFundFile, FundImportRow } from '@/types/fund-import';
import { FundRecommendation } from '@prisma/client';

interface RawFundRow {
  ticker?: string;
  nome?: string;
  name?: string;
  segmento?: string;
  segment?: string;
  'preço atual'?: string | number;
  'preco atual'?: string | number;
  precoatual?: string | number;
  currentprice?: string | number;
  'preço médio'?: string | number;
  'preco medio'?: string | number;
  precomedio?: string | number;
  averageprice?: string | number;
  'preço teto'?: string | number;
  'preco teto'?: string | number;
  precoteto?: string | number;
  ceilingprice?: string | number;
  'alocação'?: string | number;
  'alocacao'?: string | number;
  allocation?: string | number;
  'recomendação'?: string;
  'recomendacao'?: string;
  recommendation?: string;
}

function normalizeRecommendation(value: string): FundRecommendation {
  const normalized = value.toUpperCase().trim();

  const map: Record<string, FundRecommendation> = {
    'COMPRAR': 'BUY',
    'BUY': 'BUY',
    'VENDER': 'SELL',
    'SELL': 'SELL',
    'AGUARDAR': 'HOLD',
    'HOLD': 'HOLD',
    'MANTER': 'HOLD'
  };

  return map[normalized] || 'HOLD';
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove R$, espaços, e substitui vírgula por ponto
    const cleaned = value.replace(/[R$\s]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

function normalizeColumnName(col: string): string {
  return col
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '');
}

function mapRowToFund(row: RawFundRow, index: number): FundImportRow | null {
  // Tentar pegar ticker
  const ticker = String(row.ticker || '').trim().toUpperCase();
  if (!ticker) return null;

  // Tentar pegar nome
  const nome = String(row.nome || row.name || '').trim();
  if (!nome) return null;

  // Tentar pegar segmento
  const segmento = String(row.segmento || row.segment || '').trim();
  if (!segmento) return null;

  // Preços
  const precoAtual = parseNumber(
    row['preço atual'] || row['preco atual'] || row.precoatual || row.currentprice || 0
  );
  const precoMedio = parseNumber(
    row['preço médio'] || row['preco medio'] || row.precomedio || row.averageprice || 0
  );
  const precoTeto = parseNumber(
    row['preço teto'] || row['preco teto'] || row.precoteto || row.ceilingprice || 0
  );

  // Alocação
  const alocacao = parseNumber(
    row['alocação'] || row['alocacao'] || row.allocation || 0
  );

  // Recomendação
  const recomendacaoRaw = String(
    row['recomendação'] || row['recomendacao'] || row.recommendation || 'HOLD'
  );
  const recomendacao = normalizeRecommendation(recomendacaoRaw);

  return {
    ticker,
    nome,
    segmento,
    precoAtual,
    precoMedio,
    precoTeto,
    alocacao,
    recomendacao,
    rowNumber: index + 2 // +2 por causa do header
  };
}

export async function parseExcelFundFile(file: File): Promise<ParsedFundFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Pegar primeira aba
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Converter para JSON
        const rawData = XLSX.utils.sheet_to_json<RawFundRow>(firstSheet, {
          defval: '',
          raw: false // Para pegar valores como string
        });

        // Normalizar nomes de colunas
        const normalizedData = rawData.map(row => {
          const normalized: any = {};
          Object.keys(row).forEach(key => {
            normalized[normalizeColumnName(key)] = (row as any)[key];
          });
          return normalized;
        });

        // Mapear para formato esperado
        const funds: FundImportRow[] = normalizedData
          .map((row: any, index: number) => mapRowToFund(row, index))
          .filter((row): row is FundImportRow => row !== null);

        if (funds.length === 0) {
          reject(new Error('Nenhum fundo válido encontrado na planilha'));
          return;
        }

        resolve({
          data: funds,
          fileName: file.name,
          fileSize: file.size,
          rowCount: funds.length
        });
      } catch (error: any) {
        reject(new Error(`Erro ao processar Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsBinaryString(file);
  });
}

export async function parseCSVFundFile(file: File): Promise<ParsedFundFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawFundRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeColumnName(header),
      complete: (results) => {
        try {
          const funds: FundImportRow[] = results.data
            .map((row, index) => mapRowToFund(row, index))
            .filter((row): row is FundImportRow => row !== null);

          if (funds.length === 0) {
            reject(new Error('Nenhum fundo válido encontrado no CSV'));
            return;
          }

          resolve({
            data: funds,
            fileName: file.name,
            fileSize: file.size,
            rowCount: funds.length
          });
        } catch (error: any) {
          reject(new Error(`Erro ao processar CSV: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao ler CSV: ${error.message}`));
      }
    });
  });
}
```

#### **3.2 Fund Import Validator**

**Arquivo:** `src/lib/validators/fund-import-validator.ts`

```typescript
import type {
  FundImportRow,
  FundValidationError,
  FundImportValidationResult
} from '@/types/fund-import';
import { FundRecommendation } from '@prisma/client';
import { getSectorOptions } from '@/types/fii-sectors';

const TICKER_REGEX = /^[A-Z]{4}\d{1,2}$/; // Ex: HGLG11, BTLG11B

export function validateFundImportData(
  funds: FundImportRow[]
): Pick<FundImportValidationResult, 'valid' | 'errors'> {
  const errors: FundValidationError[] = [];
  const valid: FundImportRow[] = [];
  const validSegments = getSectorOptions().map(s => s.value);
  const validRecommendations = Object.values(FundRecommendation);

  funds.forEach(fund => {
    let hasError = false;

    // Validar ticker
    if (!fund.ticker || fund.ticker.length === 0) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'ticker',
        error: 'Ticker é obrigatório',
        value: fund.ticker
      });
      hasError = true;
    } else if (!TICKER_REGEX.test(fund.ticker.toUpperCase())) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'ticker',
        error: 'Ticker inválido (formato esperado: HGLG11)',
        value: fund.ticker
      });
      hasError = true;
    }

    // Validar nome
    if (!fund.nome || fund.nome.length < 3) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'nome',
        error: 'Nome é obrigatório (mínimo 3 caracteres)',
        value: fund.nome
      });
      hasError = true;
    }

    // Validar segmento
    if (!validSegments.includes(fund.segmento)) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'segmento',
        error: `Segmento inválido. Use: ${validSegments.slice(0, 3).join(', ')}...`,
        value: fund.segmento
      });
      hasError = true;
    }

    // Validar preços
    if (fund.precoAtual <= 0) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'precoAtual',
        error: 'Preço atual deve ser maior que zero',
        value: fund.precoAtual
      });
      hasError = true;
    }

    if (fund.precoMedio <= 0) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'precoMedio',
        error: 'Preço médio deve ser maior que zero',
        value: fund.precoMedio
      });
      hasError = true;
    }

    if (fund.precoTeto <= 0) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'precoTeto',
        error: 'Preço teto deve ser maior que zero',
        value: fund.precoTeto
      });
      hasError = true;
    }

    // Validar alocação
    if (fund.alocacao < 0 || fund.alocacao > 100) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'alocacao',
        error: 'Alocação deve estar entre 0% e 100%',
        value: fund.alocacao
      });
      hasError = true;
    }

    // Validar recomendação
    if (!validRecommendations.includes(fund.recomendacao)) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'recomendacao',
        error: 'Recomendação inválida (use: BUY, SELL ou HOLD)',
        value: fund.recomendacao
      });
      hasError = true;
    }

    if (!hasError) {
      valid.push(fund);
    }
  });

  return { valid, errors };
}
```

---

### **FASE 4: Frontend - Hooks** (Dia 4)

#### **4.1 Hook de Parse**

**Arquivo:** `src/hooks/admin/use-parse-fund-file.ts`

```typescript
import { useState } from 'react';
import { parseExcelFundFile, parseCSVFundFile } from '@/lib/parsers/fund-file-parser';
import { validateFundImportData } from '@/lib/validators/fund-import-validator';
import type { ParsedFundFile } from '@/types/fund-import';

export function useParseFundFile() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = async (file: File): Promise<ParsedFundFile | null> => {
    setIsParsing(true);
    setError(null);

    try {
      // Verificar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 2MB');
      }

      // Verificar extensão
      const extension = file.name.split('.').pop()?.toLowerCase();
      let parsedData: ParsedFundFile;

      if (extension === 'xlsx' || extension === 'xls') {
        parsedData = await parseExcelFundFile(file);
      } else if (extension === 'csv') {
        parsedData = await parseCSVFundFile(file);
      } else {
        throw new Error('Formato não suportado. Use .xlsx, .xls ou .csv');
      }

      // Verificar se tem dados
      if (parsedData.data.length === 0) {
        throw new Error('Arquivo vazio ou sem dados válidos');
      }

      // Verificar limite (max 100 fundos)
      if (parsedData.data.length > 100) {
        throw new Error('Limite de 100 fundos por importação excedido');
      }

      return parsedData;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  return {
    parseFile,
    isParsing,
    error
  };
}
```

#### **4.2 Hook de Importação**

**Arquivo:** `src/hooks/admin/use-bulk-import-funds.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  FundImportResult,
  FundImportRow,
  FundImportValidationResult
} from '@/types/fund-import';

export function useValidateBulkFunds(portfolioId: string) {
  return useMutation({
    mutationFn: async (funds: FundImportRow[]) => {
      return api.post<FundImportValidationResult>(
        `/api/admin/carteiras/${portfolioId}/fundos/validate-bulk`,
        { funds }
      );
    }
  });
}

export function useBulkImportFunds(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      funds,
      mode = 'merge'
    }: {
      funds: FundImportRow[];
      mode?: 'merge' | 'replace';
    }) => {
      return api.post<FundImportResult>(
        `/api/admin/carteiras/${portfolioId}/fundos/bulk-import`,
        { funds, mode }
      );
    },
    onSuccess: () => {
      // Invalidar cache de fundos
      queryClient.invalidateQueries({
        queryKey: ['admin', 'portfolios', portfolioId, 'funds']
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'portfolios', portfolioId]
      });
    }
  });
}
```

---

### **FASE 5: Frontend - Componentes** (Dias 5-6)

#### **5.1 File Upload Zone**

**Arquivo:** `src/components/admin/carteiras/FundFileUploadZone.tsx`

```typescript
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FundFileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  error?: string | null;
}

export function FundFileUploadZone({
  onFileSelect,
  isProcessing,
  error
}: FundFileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleDownloadTemplate = () => {
    // Criar template CSV
    const template = `Ticker,Nome,Segmento,Preço Atual,Preço Médio,Preço Teto,Alocação,Recomendação
HGLG11,Hedge General Logistics,Logística,156.78,140.50,180.00,6.0,Comprar
BTLG11,BTG Pactual Logística,Logística,101.89,101.82,102.80,7.0,Comprar
CVBI11,VBI CRI,Papel,83.20,89.34,96.73,6.0,Aguardar`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_fundos_fii.csv';
    link.click();
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          ${error ? 'border-destructive' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            {isDragActive ? (
              <Upload className="h-8 w-8 text-primary animate-bounce" />
            ) : (
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium">
              {isDragActive ? 'Solte o arquivo aqui' : 'Arraste e solte a planilha'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique para selecionar
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Formatos aceitos: .xlsx, .xls, .csv</p>
            <p>Tamanho máximo: 2MB | Limite: 100 fundos</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Template e exemplo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Botão de download do template */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="font-medium mb-2 text-sm">📥 Template da Planilha</p>
          <p className="text-xs text-muted-foreground mb-3">
            Baixe o template com as colunas corretas
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Template CSV
          </Button>
        </div>

        {/* Formato esperado */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="font-medium mb-2 text-sm">📋 Colunas Obrigatórias</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• <strong>Ticker:</strong> Código do FII (ex: HGLG11)</li>
            <li>• <strong>Nome:</strong> Nome completo</li>
            <li>• <strong>Segmento:</strong> Logística, Papel, Shopping...</li>
            <li>• <strong>Preços:</strong> Atual, Médio, Teto (R$)</li>
            <li>• <strong>Alocação:</strong> Percentual (0-100%)</li>
            <li>• <strong>Recomendação:</strong> Comprar/Vender/Aguardar</li>
          </ul>
        </div>
      </div>

      {/* Avisos importantes */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="font-medium text-amber-900 dark:text-amber-100 text-sm mb-2">
          ⚠️ Pontos importantes:
        </p>
        <ul className="text-xs space-y-1 text-amber-800 dark:text-amber-200">
          <li>• A soma das alocações deve ser exatamente 100%</li>
          <li>• Fundos já existentes serão atualizados</li>
          <li>• Novos fundos serão adicionados</li>
          <li>• Use "Modo Substituir" para apagar todos e importar novos</li>
        </ul>
      </div>
    </div>
  );
}
```

#### **5.2 Fund Import Preview**

**Arquivo:** `src/components/admin/carteiras/FundImportPreview.tsx`

```typescript
'use client';

import { Check, X, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import type { FundImportRow, FundValidationError } from '@/types/fund-import';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FundImportPreviewProps {
  data: FundImportRow[];
  errors: FundValidationError[];
  existingFunds: Array<{ ticker: string; rowNumber: number; action: 'UPDATE' }>;
  newFunds: Array<{ ticker: string; rowNumber: number; action: 'INSERT' }>;
  totalAllocation: number;
  onDataChange: (data: FundImportRow[]) => void;
}

export function FundImportPreview({
  data,
  errors,
  existingFunds,
  newFunds,
  totalAllocation,
  onDataChange
}: FundImportPreviewProps) {
  const getRowError = (rowNumber: number) => {
    return errors.filter(e => e.rowNumber === rowNumber);
  };

  const hasError = (rowNumber: number) => {
    return errors.some(e => e.rowNumber === rowNumber);
  };

  const getRowAction = (rowNumber: number): 'INSERT' | 'UPDATE' | 'ERROR' => {
    if (hasError(rowNumber)) return 'ERROR';
    if (existingFunds.some(f => f.rowNumber === rowNumber)) return 'UPDATE';
    return 'INSERT';
  };

  const handleRemoveRow = (rowNumber: number) => {
    onDataChange(data.filter(row => row.rowNumber !== rowNumber));
  };

  const validCount = data.filter(row => !hasError(row.rowNumber)).length;
  const allocationValid = Math.abs(totalAllocation - 100) < 0.1;

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Preview dos Dados ({data.length} fundos)
        </h3>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Plus className="h-4 w-4 text-blue-500" />
            {newFunds.length} novos
          </span>
          <span className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4 text-amber-500" />
            {existingFunds.length} atualizar
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <X className="h-4 w-4" />
            {errors.length} erros
          </span>
        </div>
      </div>

      {/* Totalizador de alocação */}
      <div className={`p-4 rounded-lg border ${
        allocationValid
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Alocação Total:</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${
              allocationValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {totalAllocation.toFixed(1)}%
            </span>
            {allocationValid ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
          </div>
        </div>
        {!allocationValid && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            A alocação deve somar exatamente 100% (diferença: {(totalAllocation - 100).toFixed(1)}%)
          </p>
        )}
      </div>

      {/* Tabela de fundos */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-12">#</th>
                <th className="px-3 py-2 text-left font-medium">Ticker</th>
                <th className="px-3 py-2 text-left font-medium">Nome</th>
                <th className="px-3 py-2 text-left font-medium">Segmento</th>
                <th className="px-3 py-2 text-right font-medium">Atual</th>
                <th className="px-3 py-2 text-right font-medium">Teto</th>
                <th className="px-3 py-2 text-right font-medium">Aloc%</th>
                <th className="px-3 py-2 text-center font-medium w-24">Ação</th>
                <th className="px-3 py-2 text-center font-medium w-20">Remover</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => {
                const rowErrors = getRowError(row.rowNumber);
                const action = getRowAction(row.rowNumber);

                return (
                  <tr
                    key={row.rowNumber}
                    className={`border-t ${
                      action === 'ERROR' ? 'bg-destructive/5' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2 font-mono font-medium">
                      {row.ticker}
                    </td>
                    <td className="px-3 py-2 text-xs">{row.nome}</td>
                    <td className="px-3 py-2 text-xs">{row.segmento}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      R$ {row.precoAtual.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      R$ {row.precoTeto.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {row.alocacao.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-center">
                      {action === 'INSERT' && (
                        <Badge variant="default" className="text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Novo
                        </Badge>
                      )}
                      {action === 'UPDATE' && (
                        <Badge variant="secondary" className="text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Atualizar
                        </Badge>
                      )}
                      {action === 'ERROR' && (
                        <Badge variant="destructive" className="text-xs">
                          <X className="h-3 w-3 mr-1" />
                          Erro
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRow(row.rowNumber)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de erros */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="font-medium text-destructive mb-2 text-sm">
            ❌ {errors.length} erro(s) encontrado(s):
          </p>
          <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground font-mono">
                  L{error.rowNumber}:
                </span>
                <span>
                  <strong>{error.field}</strong> - {error.error}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

#### **5.3 Modal Principal** (Continua...)

Por questão de espaço, vou criar um segundo arquivo para o restante do plano:

**Arquivo:** `src/components/admin/carteiras/BulkFundImportDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FundFileUploadZone } from './FundFileUploadZone';
import { FundImportPreview } from './FundImportPreview';
import { useParseFundFile } from '@/hooks/admin/use-parse-fund-file';
import { useValidateBulkFunds, useBulkImportFunds } from '@/hooks/admin/use-bulk-import-funds';
import { validateFundImportData } from '@/lib/validators/fund-import-validator';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import type { FundImportRow, ParsedFundFile } from '@/types/fund-import';

interface BulkFundImportDialogProps {
  portfolioId: string;
  portfolioName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'processing' | 'complete';
type ImportMode = 'merge' | 'replace';

export function BulkFundImportDialog({
  portfolioId,
  portfolioName,
  open,
  onOpenChange
}: BulkFundImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [parsedData, setParsedData] = useState<ParsedFundFile | null>(null);
  const [funds, setFunds] = useState<FundImportRow[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);

  const { parseFile, isParsing, error: parseError } = useParseFundFile();
  const validateMutation = useValidateBulkFunds(portfolioId);
  const importMutation = useBulkImportFunds(portfolioId);

  const handleFileSelect = async (file: File) => {
    const data = await parseFile(file);
    if (data) {
      setParsedData(data);
      setFunds(data.data);

      // Validar localmente
      const localValidation = validateFundImportData(data.data);

      setStep('preview');
      toast.success(`${data.rowCount} fundos carregados para validação`);

      // Validar no servidor automaticamente
      handleValidateOnServer(data.data);
    }
  };

  const handleValidateOnServer = async (fundsToValidate?: FundImportRow[]) => {
    const dataToValidate = fundsToValidate || funds;

    try {
      const result = await validateMutation.mutateAsync(dataToValidate);
      setValidationResult(result);

      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erro(s) encontrado(s). Corrija antes de importar.`);
      } else if (!result.allocationValid) {
        toast.warning(`Alocação total = ${result.totalAllocation.toFixed(1)}%. Ajuste para 100%.`);
      } else {
        toast.success('✅ Validação OK! Pronto para importar.');
      }
    } catch (error) {
      toast.error('Erro ao validar fundos no servidor');
    }
  };

  const handleImport = async () => {
    if (!validationResult) {
      toast.error('Execute a validação primeiro');
      return;
    }

    if (validationResult.errors.length > 0) {
      toast.error('Corrija os erros antes de importar');
      return;
    }

    if (!validationResult.allocationValid) {
      toast.error('Alocação total deve somar 100%');
      return;
    }

    setStep('processing');

    try {
      const result = await importMutation.mutateAsync({
        funds: validationResult.valid,
        mode: importMode
      });

      setStep('complete');

      const message = importMode === 'replace'
        ? `Carteira substituída! ${result.created} fundos criados.`
        : `${result.created} fundos criados, ${result.updated} atualizados!`;

      toast.success(message);

      if (result.failed > 0) {
        toast.error(`${result.failed} falharam. Verifique o relatório.`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar fundos');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setImportMode('merge');
    setParsedData(null);
    setFunds([]);
    setValidationResult(null);
    onOpenChange(false);
  };

  const canImport = validationResult &&
    validationResult.errors.length === 0 &&
    validationResult.allocationValid;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Fundos em Lote</DialogTitle>
          <DialogDescription>
            Carteira: <strong>{portfolioName}</strong> - Faça upload de uma planilha
            com os fundos para adicionar/atualizar em massa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <FundFileUploadZone
              onFileSelect={handleFileSelect}
              isProcessing={isParsing}
              error={parseError}
            />
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && parsedData && validationResult && (
            <>
              {/* Seletor de modo */}
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-sm font-medium mb-3 block">
                  Modo de Importação:
                </Label>
                <RadioGroup
                  value={importMode}
                  onValueChange={(value) => setImportMode(value as ImportMode)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 bg-background rounded-lg p-3 border">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Mesclar (Merge)</p>
                        <p className="text-xs text-muted-foreground">
                          Adiciona novos e atualiza existentes
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-background rounded-lg p-3 border border-amber-200">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Substituir (Replace)</p>
                        <p className="text-xs text-muted-foreground">
                          Remove todos e importa novos
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Preview dos dados */}
              <FundImportPreview
                data={funds}
                errors={validationResult.errors}
                existingFunds={validationResult.existingFunds}
                newFunds={validationResult.newFunds}
                totalAllocation={validationResult.totalAllocation}
                onDataChange={(newData) => {
                  setFunds(newData);
                  handleValidateOnServer(newData);
                }}
              />

              {/* Ações */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Voltar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleValidateOnServer()}
                  disabled={validateMutation.isPending}
                >
                  {validateMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Revalidar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!canImport || importMutation.isPending}
                >
                  {importMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Importar {validationResult.valid.length} Fundos
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Processando importação...</p>
              <p className="text-sm text-muted-foreground mt-2">
                {importMode === 'replace'
                  ? 'Substituindo fundos da carteira...'
                  : 'Adicionando e atualizando fundos...'}
              </p>
            </div>
          )}

          {/* STEP 4: Complete */}
          {step === 'complete' && importMutation.data && (
            <div className="text-center py-12">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                Importação Concluída!
              </h3>
              <div className="space-y-2 text-sm">
                <p>✅ {importMutation.data.created} fundos criados</p>
                <p>🔄 {importMutation.data.updated} fundos atualizados</p>
                {importMutation.data.failed > 0 && (
                  <p className="text-destructive">
                    ❌ {importMutation.data.failed} falharam
                  </p>
                )}
                <p className="text-muted-foreground">
                  Alocação final: {importMutation.data.finalAllocation.toFixed(1)}%
                </p>
                <p className="text-muted-foreground">
                  Processado em {(importMutation.data.duration / 1000).toFixed(1)}s
                </p>
              </div>
              <Button onClick={handleClose} className="mt-6">
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📊 Estrutura de Dados da Planilha

### **Exemplo de Planilha Excel/CSV**

```
| Ticker | Nome                      | Segmento   | Preço Atual | Preço Médio | Preço Teto | Alocação | Recomendação |
|--------|---------------------------|------------|-------------|-------------|------------|----------|--------------|
| HGLG11 | Hedge General Logistics   | Logística  | 156.78      | 140.50      | 180.00     | 6.0      | Comprar      |
| BTLG11 | BTG Pactual Logística     | Logística  | 101.89      | 101.82      | 102.80     | 7.0      | Comprar      |
| CVBI11 | VBI CRI                   | Papel      | 83.20       | 89.34       | 96.73      | 6.0      | Aguardar     |
| BTHF11 | BTG Pactual Hedge Fund    | Papel      | 8.69        | 8.38        | 10.20      | 6.0      | Comprar      |
| FGAA11 | FII Agro                  | Agronegócio| 8.82        | 8.21        | 9.86       | 6.0      | Comprar      |
```

---

## 🧪 Testes e Validação

### **Checklist de Testes:**

#### **Frontend:**
- [ ] Upload de .xlsx funciona
- [ ] Upload de .csv funciona
- [ ] Drag-and-drop funciona
- [ ] Validação de tamanho (max 2MB)
- [ ] Preview mostra dados corretamente
- [ ] Totalizador de alocação atualiza em tempo real
- [ ] Remoção de linhas funciona
- [ ] Modo merge vs replace funciona
- [ ] Modal fecha corretamente após sucesso
- [ ] Download de template funciona

#### **Backend:**
- [ ] Validação detecta fundos existentes
- [ ] Validação verifica alocação total
- [ ] Validação de segmentos funciona
- [ ] Importação em modo merge funciona
- [ ] Importação em modo replace funciona
- [ ] Transação com rollback funciona em caso de erro
- [ ] Response tem formato correto

#### **Integração:**
- [ ] Cache do TanStack Query é invalidado
- [ ] Tabela de fundos atualiza automaticamente
- [ ] Admin vê novos fundos imediatamente
- [ ] Alocação total da carteira está correta

---

## 🚀 Cronograma de Implementação

### **Dia 1: Types e Parsers**
- ✅ Criar types em `src/types/fund-import.ts`
- ✅ Implementar `fund-file-parser.ts`
- ✅ Implementar `fund-import-validator.ts`
- ✅ Testes de parse de Excel e CSV

### **Dia 2: Backend - Validação**
- ✅ Implementar `/api/admin/carteiras/[id]/fundos/validate-bulk`
- ✅ Testes de validação de alocação
- ✅ Testes de detecção de fundos existentes

### **Dia 3: Backend - Importação**
- ✅ Implementar `/api/admin/carteiras/[id]/fundos/bulk-import`
- ✅ Lógica de modo merge vs replace
- ✅ Transação com rollback
- ✅ Testes de importação

### **Dia 4: Hooks**
- ✅ Hook `useParseFundFile`
- ✅ Hook `useValidateBulkFunds`
- ✅ Hook `useBulkImportFunds`
- ✅ Testes dos hooks

### **Dia 5: Componentes (Parte 1)**
- ✅ `FundFileUploadZone` com template download
- ✅ `FundImportPreview` com totalizadores
- ✅ Seletor de modo (merge/replace)

### **Dia 6: Componentes (Parte 2) e Integração**
- ✅ `BulkFundImportDialog` (modal completo)
- ✅ Integração na página `/admin/carteiras/[id]`
- ✅ Testes end-to-end
- ✅ Ajustes de UX

---

## 🔒 Segurança

### **Validações Implementadas:**
1. ✅ Autenticação admin obrigatória
2. ✅ Validação de tipo de arquivo (.xlsx, .xls, .csv)
3. ✅ Validação de tamanho (max 2MB)
4. ✅ Validação de tickers (formato)
5. ✅ Validação de segmentos (enum)
6. ✅ Validação de preços (números positivos)
7. ✅ Validação de alocação total (= 100%)
8. ✅ Verificação de duplicatas
9. ✅ Transação com rollback
10. ✅ Limite de fundos por importação (100)

---

## ✅ Checklist Final

### **Funcionalidade:**
- [ ] Upload de .xlsx, .xls e .csv funciona
- [ ] Validação local e servidor funcionam
- [ ] Preview correto com totalizadores
- [ ] Modo merge adiciona/atualiza fundos
- [ ] Modo replace substitui carteira completa
- [ ] Transação garante consistência
- [ ] Cache invalidado corretamente

### **UX/UI:**
- [ ] Interface intuitiva
- [ ] Feedback visual claro
- [ ] Loading states em todas ações
- [ ] Toasts informativos
- [ ] Modal responsivo
- [ ] Download de template funciona

### **Segurança:**
- [ ] Apenas admins podem importar
- [ ] Validação robusta de dados
- [ ] Transação com rollback
- [ ] Logs de auditoria

---

**Última atualização:** 2025-10-13
**Versão:** 1.0.0
**Status:** 📋 Planejamento Completo - Pronto para Implementação
