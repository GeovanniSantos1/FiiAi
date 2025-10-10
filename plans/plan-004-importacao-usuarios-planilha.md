# Plan-004: Importação em Massa de Usuários via Planilha

**Data:** 2025-10-10
**Agente Responsável:** Frontend Agent (coordenação com Backend e Security)
**Módulo:** Admin - Gestão de Usuários
**Prioridade:** P1 (Média-Alta)
**Estimativa:** 5-7 dias

---

## 📋 Sumário Executivo

Implementar funcionalidade de importação em massa de usuários através de upload de planilha Excel/CSV na interface administrativa. Atualmente, a criação de usuários é feita individualmente via formulário. A solução proposta adiciona uma interface de upload com drag-and-drop, validação de dados, preview e processamento em lotes, criando convites via Clerk API de forma automatizada.

---

## 🎯 Objetivos e Valor de Negócio

### **Objetivos:**
1. Permitir criação de múltiplos usuários simultaneamente via planilha
2. Criar interface intuitiva com drag-and-drop para upload de arquivos
3. Validar dados antes do processamento (emails, duplicatas, formato)
4. Processar criação em lotes respeitando limites da API do Clerk
5. Fornecer relatório detalhado de sucessos/falhas

### **Valor de Negócio:**
- **Eficiência:** Redução de 95% no tempo para adicionar múltiplos usuários
- **Escalabilidade:** Onboarding de turmas/empresas completas de uma vez
- **Redução de Erros:** Validação automática antes do processamento
- **Rastreabilidade:** Log completo de todas as importações
- **Experiência Admin:** Interface moderna alinhada ao design do sistema

### **Métricas de Sucesso:**
- Redução de tempo: De 2min/usuário para < 10s para 50 usuários
- Taxa de erro < 1% após validações
- Satisfação admin: NPS > 9 na feature de importação
- 100% dos convites enviados com sucesso após validação

---

## 🔍 Análise do Problema Atual

### **Situação Atual:**
- Criação manual um por um em http://localhost:3000/admin/users
- Formulário com campos: Nome e Email
- API: `POST /api/admin/users/invite`
- Hook: `useInviteUser` com TanStack Query
- Integração com Clerk para criação de convites

### **Dores Identificadas:**
- ⏱️ **Tempo:** Adicionar 50 usuários leva ~100 minutos
- 🔄 **Repetição:** Processo manual repetitivo e sujeito a erros
- 📊 **Onboarding em Massa:** Impossível adicionar turmas inteiras eficientemente
- ❌ **Erros:** Digitação incorreta de emails sem validação prévia

### **Casos de Uso Prioritários:**
1. **Onboarding de Empresa:** Adicionar 50-200 funcionários de uma vez
2. **Turma de Curso:** Cadastrar alunos de um curso sobre FIIs
3. **Migração de Sistema:** Importar base de usuários de sistema antigo
4. **Evento/Webinar:** Adicionar participantes pré-cadastrados

---

## 🏗️ Arquitetura da Solução

### **Componentes Principais:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Users Page                          │
│  http://localhost:3000/admin/users                          │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─► [Adicionar Usuário] (individual - existente)
                │
                └─► [Importar Planilha] (novo)
                        │
                        ▼
            ┌───────────────────────────┐
            │  BulkUserImportDialog     │
            │  (Modal Component)         │
            └───────────┬───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  FileUpload      DataPreview    ValidationResults
  (Drag&Drop)     (Table)        (Errors/Warnings)
                        │
                        ▼
              ProcessingProgress
              (Progress Bar)
                        │
                        ▼
               ResultsSummary
            (Success/Failure Log)
```

### **Fluxo de Dados:**

```
1. Upload Arquivo (.xlsx/.csv)
   ↓
2. Parse Arquivo (xlsx/papaparse)
   ↓
3. Validação de Estrutura
   - Verificar colunas: "nome", "email"
   - Verificar formato de dados
   ↓
4. Validação de Dados
   - Email válido (regex + DNS check opcional)
   - Nome não vazio
   - Duplicatas na planilha
   - Usuários já existentes no Clerk
   ↓
5. Preview + Confirmação
   - Mostrar tabela editável
   - Permitir correções inline
   - Remover linhas inválidas
   ↓
6. Processamento em Lotes
   - Chunks de 10 usuários
   - Chamadas sequenciais ao Clerk
   - Retry logic para falhas temporárias
   ↓
7. Relatório Final
   - Sucessos: N usuários criados
   - Falhas: Log detalhado por linha
   - Download: CSV com resultados
```

---

## 📂 Estrutura de Arquivos

### **Novos Arquivos a Criar:**

```
src/
├── components/
│   └── admin/
│       └── users/
│           ├── BulkUserImportDialog.tsx       # Modal principal
│           ├── FileUploadZone.tsx             # Drag & drop area
│           ├── ImportDataPreview.tsx          # Tabela de preview
│           ├── ImportValidationResults.tsx    # Lista de erros/avisos
│           ├── ImportProgress.tsx             # Barra de progresso
│           └── ImportResultsSummary.tsx       # Resumo final
│
├── hooks/
│   └── admin/
│       ├── use-bulk-import-users.ts          # Hook principal de importação
│       └── use-parse-user-file.ts            # Hook para parse de arquivo
│
├── lib/
│   ├── parsers/
│   │   ├── excel-parser.ts                   # Parse .xlsx
│   │   └── csv-parser.ts                     # Parse .csv
│   └── validators/
│       └── user-import-validator.ts          # Validações de dados
│
├── app/
│   └── api/
│       └── admin/
│           └── users/
│               ├── bulk-import/
│               │   └── route.ts              # POST - Processar importação
│               └── validate-bulk/
│                   └── route.ts              # POST - Validar antes de processar
│
└── types/
    └── bulk-import.ts                        # Interfaces TypeScript
```

### **Arquivos a Modificar:**

```
src/
├── app/
│   └── admin/
│       └── users/
│           └── page.tsx                      # Adicionar botão "Importar Planilha"
│
└── package.json                              # Adicionar dependências (xlsx, papaparse, react-dropzone)
```

---

## 🛠️ Implementação Técnica Detalhada

### **FASE 1: Setup e Dependências** (Dia 1)

#### **1.1 Instalar Bibliotecas**

```bash
npm install xlsx papaparse react-dropzone
npm install --save-dev @types/papaparse
```

**Justificativa:**
- **xlsx**: Suporte completo para Excel (.xlsx, .xls)
- **papaparse**: Parser CSV robusto e rápido
- **react-dropzone**: Interface drag-and-drop acessível

#### **1.2 Criar Types**

**Arquivo:** `src/types/bulk-import.ts`

```typescript
export interface UserImportRow {
  nome: string;
  email: string;
  rowNumber: number; // Linha original na planilha
}

export interface ValidationError {
  rowNumber: number;
  field: 'nome' | 'email';
  error: string;
  value: string;
}

export interface ValidationWarning {
  rowNumber: number;
  message: string;
}

export interface ImportValidationResult {
  valid: UserImportRow[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicatesInFile: UserImportRow[];
  existingUsers: UserImportRow[];
}

export interface BulkImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentBatch: number;
}

export interface BulkImportResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    email: string;
    error: string;
  }>;
  duration: number; // ms
  timestamp: Date;
}

export interface ParsedFileData {
  data: UserImportRow[];
  fileName: string;
  fileSize: number;
  rowCount: number;
}
```

---

### **FASE 2: Backend - APIs** (Dias 2-3)

#### **2.1 Endpoint de Validação**

**Arquivo:** `src/app/api/admin/users/validate-bulk/route.ts`

```typescript
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UserRowSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  rowNumber: z.number(),
});

const BulkValidateSchema = z.object({
  users: z.array(UserRowSchema),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Sem permissão de admin' }, { status: 403 });
    }

    // 2. Validar payload
    const body = await request.json();
    const validation = BulkValidateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { users } = validation.data;

    // 3. Validar duplicatas na própria lista
    const emailMap = new Map<string, number[]>();
    users.forEach((user) => {
      const rows = emailMap.get(user.email.toLowerCase()) || [];
      rows.push(user.rowNumber);
      emailMap.set(user.email.toLowerCase(), rows);
    });

    const duplicatesInFile = Array.from(emailMap.entries())
      .filter(([_, rows]) => rows.length > 1)
      .flatMap(([email, rows]) =>
        rows.map((rowNumber) => ({ email, rowNumber }))
      );

    // 4. Verificar emails já existentes no Clerk
    const existingUsers: Array<{ email: string; rowNumber: number }> = [];

    for (const user of users) {
      try {
        const clerkUsers = await client.users.getUserList({
          emailAddress: [user.email],
        });

        if (clerkUsers.data.length > 0) {
          existingUsers.push({
            email: user.email,
            rowNumber: user.rowNumber,
          });
        }
      } catch (error) {
        console.error(`Erro ao verificar email ${user.email}:`, error);
      }
    }

    // 5. Validações adicionais
    const warnings: ValidationWarning[] = [];

    // Avisar sobre emails de domínios gratuitos (opcional)
    const freeDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
    users.forEach((user) => {
      const domain = user.email.split('@')[1]?.toLowerCase();
      if (domain && freeDomains.includes(domain)) {
        warnings.push({
          rowNumber: user.rowNumber,
          message: `Email de domínio gratuito (${domain}). Verificar se é corporativo.`,
        });
      }
    });

    // 6. Retornar resultado
    return NextResponse.json({
      valid: users.filter(
        (u) =>
          !duplicatesInFile.some((d) => d.rowNumber === u.rowNumber) &&
          !existingUsers.some((e) => e.rowNumber === u.rowNumber)
      ),
      duplicatesInFile,
      existingUsers,
      warnings,
      summary: {
        total: users.length,
        valid: users.length - duplicatesInFile.length - existingUsers.length,
        duplicates: duplicatesInFile.length,
        existing: existingUsers.length,
      },
    });
  } catch (error: any) {
    console.error('Erro na validação em massa:', error);
    return NextResponse.json(
      { error: 'Erro ao validar usuários', details: error.message },
      { status: 500 }
    );
  }
}
```

#### **2.2 Endpoint de Importação**

**Arquivo:** `src/app/api/admin/users/bulk-import/route.ts`

```typescript
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BATCH_SIZE = 10; // Processar 10 por vez
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo

const UserRowSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  rowNumber: z.number(),
});

const BulkImportSchema = z.object({
  users: z.array(UserRowSchema),
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createUserWithRetry(
  client: ReturnType<typeof clerkClient>,
  email: string,
  nome: string,
  attempts = RETRY_ATTEMPTS
): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < attempts; i++) {
    try {
      await client.users.createUser({
        emailAddress: [email],
        firstName: nome.split(' ')[0],
        lastName: nome.split(' ').slice(1).join(' ') || nome.split(' ')[0],
      });

      return { success: true };
    } catch (error: any) {
      console.error(`Tentativa ${i + 1} falhou para ${email}:`, error);

      // Se for erro de rate limit, aguardar mais tempo
      if (error.status === 429 && i < attempts - 1) {
        await sleep(RETRY_DELAY * (i + 1) * 2); // Backoff exponencial
        continue;
      }

      // Se for último retry ou erro diferente, retornar erro
      if (i === attempts - 1) {
        return {
          success: false,
          error: error.message || 'Erro ao criar usuário no Clerk',
        };
      }
    }
  }

  return { success: false, error: 'Falha após múltiplas tentativas' };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Sem permissão de admin' }, { status: 403 });
    }

    // 2. Validar payload
    const body = await request.json();
    const validation = BulkImportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { users } = validation.data;

    // 3. Processar em lotes
    const results: BulkImportResult['errors'] = [];
    let succeeded = 0;
    let failed = 0;

    // Dividir em chunks
    const chunks: UserImportRow[][] = [];
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      chunks.push(users.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processando ${users.length} usuários em ${chunks.length} lotes...`);

    for (let batchIndex = 0; batchIndex < chunks.length; batchIndex++) {
      const chunk = chunks[batchIndex];
      console.log(`Processando lote ${batchIndex + 1}/${chunks.length}...`);

      // Processar chunk em paralelo
      const batchResults = await Promise.all(
        chunk.map(async (user) => {
          const result = await createUserWithRetry(client, user.email, user.nome);

          if (result.success) {
            succeeded++;
          } else {
            failed++;
            results.push({
              rowNumber: user.rowNumber,
              email: user.email,
              error: result.error || 'Erro desconhecido',
            });
          }

          return result;
        })
      );

      // Aguardar entre lotes para não sobrecarregar API
      if (batchIndex < chunks.length - 1) {
        await sleep(500);
      }
    }

    const duration = Date.now() - startTime;

    // 4. Retornar resultado
    return NextResponse.json({
      total: users.length,
      succeeded,
      failed,
      errors: results,
      duration,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Erro na importação em massa:', error);
    return NextResponse.json(
      { error: 'Erro ao importar usuários', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### **FASE 3: Parsers e Validadores** (Dia 3)

#### **3.1 Excel Parser**

**Arquivo:** `src/lib/parsers/excel-parser.ts`

```typescript
import * as XLSX from 'xlsx';
import type { ParsedFileData, UserImportRow } from '@/types/bulk-import';

export function parseExcelFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Pegar primeira aba
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Converter para JSON
        const rawData = XLSX.utils.sheet_to_json<{ nome?: string; email?: string }>(
          firstSheet,
          { defval: '' }
        );

        // Mapear para formato esperado
        const users: UserImportRow[] = rawData
          .map((row, index) => ({
            nome: String(row.nome || row['Nome'] || '').trim(),
            email: String(row.email || row['Email'] || row['E-mail'] || '').trim().toLowerCase(),
            rowNumber: index + 2, // +2 porque Excel começa em 1 e tem header
          }))
          .filter((row) => row.nome || row.email); // Remover linhas vazias

        resolve({
          data: users,
          fileName: file.name,
          fileSize: file.size,
          rowCount: users.length,
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
```

#### **3.2 CSV Parser**

**Arquivo:** `src/lib/parsers/csv-parser.ts`

```typescript
import Papa from 'papaparse';
import type { ParsedFileData, UserImportRow } from '@/types/bulk-import';

export function parseCSVFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    Papa.parse<{ nome?: string; email?: string }>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: (results) => {
        try {
          const users: UserImportRow[] = results.data
            .map((row, index) => ({
              nome: String(row.nome || row['name'] || '').trim(),
              email: String(row.email || row['e-mail'] || '').trim().toLowerCase(),
              rowNumber: index + 2, // +2 por causa do header
            }))
            .filter((row) => row.nome || row.email);

          resolve({
            data: users,
            fileName: file.name,
            fileSize: file.size,
            rowCount: users.length,
          });
        } catch (error: any) {
          reject(new Error(`Erro ao processar CSV: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao ler CSV: ${error.message}`));
      },
    });
  });
}
```

#### **3.3 Validador de Dados**

**Arquivo:** `src/lib/validators/user-import-validator.ts`

```typescript
import type {
  UserImportRow,
  ValidationError,
  ImportValidationResult,
} from '@/types/bulk-import';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateImportData(
  users: UserImportRow[]
): Pick<ImportValidationResult, 'valid' | 'errors'> {
  const errors: ValidationError[] = [];
  const valid: UserImportRow[] = [];

  users.forEach((user) => {
    let hasError = false;

    // Validar nome
    if (!user.nome || user.nome.length === 0) {
      errors.push({
        rowNumber: user.rowNumber,
        field: 'nome',
        error: 'Nome é obrigatório',
        value: user.nome,
      });
      hasError = true;
    } else if (user.nome.length < 2) {
      errors.push({
        rowNumber: user.rowNumber,
        field: 'nome',
        error: 'Nome muito curto (mínimo 2 caracteres)',
        value: user.nome,
      });
      hasError = true;
    }

    // Validar email
    if (!user.email || user.email.length === 0) {
      errors.push({
        rowNumber: user.rowNumber,
        field: 'email',
        error: 'Email é obrigatório',
        value: user.email,
      });
      hasError = true;
    } else if (!EMAIL_REGEX.test(user.email)) {
      errors.push({
        rowNumber: user.rowNumber,
        field: 'email',
        error: 'Email inválido',
        value: user.email,
      });
      hasError = true;
    }

    if (!hasError) {
      valid.push(user);
    }
  });

  return { valid, errors };
}
```

---

### **FASE 4: Frontend - Hooks** (Dia 4)

#### **4.1 Hook de Parse**

**Arquivo:** `src/hooks/admin/use-parse-user-file.ts`

```typescript
import { useState } from 'react';
import { parseExcelFile } from '@/lib/parsers/excel-parser';
import { parseCSVFile } from '@/lib/parsers/csv-parser';
import { validateImportData } from '@/lib/validators/user-import-validator';
import type { ParsedFileData, ImportValidationResult } from '@/types/bulk-import';

export function useParseUserFile() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = async (file: File): Promise<ParsedFileData | null> => {
    setIsParsing(true);
    setError(null);

    try {
      // Verificar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB');
      }

      // Verificar extensão
      const extension = file.name.split('.').pop()?.toLowerCase();
      let parsedData: ParsedFileData;

      if (extension === 'xlsx' || extension === 'xls') {
        parsedData = await parseExcelFile(file);
      } else if (extension === 'csv') {
        parsedData = await parseCSVFile(file);
      } else {
        throw new Error('Formato não suportado. Use .xlsx, .xls ou .csv');
      }

      // Verificar se tem dados
      if (parsedData.data.length === 0) {
        throw new Error('Arquivo vazio ou sem dados válidos');
      }

      // Verificar limite (max 500 usuários)
      if (parsedData.data.length > 500) {
        throw new Error('Limite de 500 usuários por importação excedido');
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
    error,
  };
}
```

#### **4.2 Hook de Importação**

**Arquivo:** `src/hooks/admin/use-bulk-import-users.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { BulkImportResult, UserImportRow, ImportValidationResult } from '@/types/bulk-import';

export function useValidateBulkUsers() {
  return useMutation({
    mutationFn: async (users: UserImportRow[]) => {
      return api.post<ImportValidationResult>('/api/admin/users/validate-bulk', { users });
    },
  });
}

export function useBulkImportUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (users: UserImportRow[]) => {
      return api.post<BulkImportResult>('/api/admin/users/bulk-import', { users });
    },
    onSuccess: () => {
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
```

---

### **FASE 5: Frontend - Componentes** (Dias 5-6)

#### **5.1 File Upload Zone**

**Arquivo:** `src/components/admin/users/FileUploadZone.tsx`

```typescript
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  error?: string | null;
}

export function FileUploadZone({ onFileSelect, isProcessing, error }: FileUploadZoneProps) {
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
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

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
            <p>Tamanho máximo: 5MB | Limite: 500 usuários</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Template de exemplo */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <p className="font-medium mb-2">📄 Formato esperado da planilha:</p>
        <div className="bg-background rounded border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Nome</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2">João Silva</td>
                <td className="px-3 py-2">joao@email.com</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2">Maria Santos</td>
                <td className="px-3 py-2">maria@email.com</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

#### **5.2 Data Preview**

**Arquivo:** `src/components/admin/users/ImportDataPreview.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import type { UserImportRow, ValidationError } from '@/types/bulk-import';

interface ImportDataPreviewProps {
  data: UserImportRow[];
  errors: ValidationError[];
  onDataChange: (data: UserImportRow[]) => void;
}

export function ImportDataPreview({ data, errors, onDataChange }: ImportDataPreviewProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const getRowError = (rowNumber: number) => {
    return errors.filter((e) => e.rowNumber === rowNumber);
  };

  const hasError = (rowNumber: number) => {
    return errors.some((e) => e.rowNumber === rowNumber);
  };

  const handleRemoveRow = (rowNumber: number) => {
    onDataChange(data.filter((row) => row.rowNumber !== rowNumber));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Preview dos Dados ({data.length} usuários)</h3>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-success-500">
            <Check className="h-4 w-4" />
            {data.filter((row) => !hasError(row.rowNumber)).length} válidos
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <X className="h-4 w-4" />
            {errors.length} erros
          </span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-12">#</th>
              <th className="px-3 py-2 text-left font-medium">Nome</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium w-12">Status</th>
              <th className="px-3 py-2 text-center font-medium w-20">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const rowErrors = getRowError(row.rowNumber);
              const isInvalid = rowErrors.length > 0;

              return (
                <tr
                  key={row.rowNumber}
                  className={`border-t ${isInvalid ? 'bg-destructive/5' : ''}`}
                >
                  <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                  <td className="px-3 py-2">{row.nome}</td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">
                    {isInvalid ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Check className="h-4 w-4 text-success-500" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleRemoveRow(row.rowNumber)}
                      className="text-destructive hover:underline text-xs"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="font-medium text-destructive mb-2">Erros encontrados:</p>
          <ul className="text-sm space-y-1">
            {errors.slice(0, 10).map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground">Linha {error.rowNumber}:</span>
                <span>
                  <strong>{error.field}</strong> - {error.error}
                </span>
              </li>
            ))}
            {errors.length > 10 && (
              <li className="text-muted-foreground italic">
                + {errors.length - 10} erros adicionais
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
```

#### **5.3 Modal Principal**

**Arquivo:** `src/components/admin/users/BulkUserImportDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from './FileUploadZone';
import { ImportDataPreview } from './ImportDataPreview';
import { useParseUserFile } from '@/hooks/admin/use-parse-user-file';
import { useValidateBulkUsers, useBulkImportUsers } from '@/hooks/admin/use-bulk-import-users';
import { validateImportData } from '@/lib/validators/user-import-validator';
import { toast } from 'sonner';
import type { UserImportRow, ParsedFileData } from '@/types/bulk-import';

interface BulkUserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'processing' | 'complete';

export function BulkUserImportDialog({ open, onOpenChange }: BulkUserImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [users, setUsers] = useState<UserImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  const { parseFile, isParsing, error: parseError } = useParseUserFile();
  const validateMutation = useValidateBulkUsers();
  const importMutation = useBulkImportUsers();

  const handleFileSelect = async (file: File) => {
    const data = await parseFile(file);
    if (data) {
      setParsedData(data);
      setUsers(data.data);

      // Validar localmente
      const validation = validateImportData(data.data);
      setValidationErrors(validation.errors);

      setStep('preview');
      toast.success(`${data.rowCount} usuários carregados`);
    }
  };

  const handleValidateOnServer = async () => {
    try {
      const result = await validateMutation.mutateAsync(users);

      if (result.existingUsers.length > 0) {
        toast.warning(`${result.existingUsers.length} emails já existem no sistema`);
      }

      if (result.duplicatesInFile.length > 0) {
        toast.error(`${result.duplicatesInFile.length} emails duplicados na planilha`);
        return;
      }

      toast.success('Validação concluída! Pronto para importar.');
    } catch (error) {
      toast.error('Erro ao validar usuários no servidor');
    }
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error('Corrija os erros antes de importar');
      return;
    }

    setStep('processing');

    try {
      const result = await importMutation.mutateAsync(users);

      setStep('complete');
      toast.success(`${result.succeeded} usuários criados com sucesso!`);

      if (result.failed > 0) {
        toast.error(`${result.failed} falharam. Verifique o relatório.`);
      }
    } catch (error) {
      toast.error('Erro ao importar usuários');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setParsedData(null);
    setUsers([]);
    setValidationErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Usuários em Massa</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha com nome e email dos usuários para criar convites em lote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'upload' && (
            <FileUploadZone
              onFileSelect={handleFileSelect}
              isProcessing={isParsing}
              error={parseError}
            />
          )}

          {step === 'preview' && parsedData && (
            <>
              <ImportDataPreview
                data={users}
                errors={validationErrors}
                onDataChange={setUsers}
              />

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Voltar
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleValidateOnServer}
                  disabled={validateMutation.isPending}
                >
                  Validar no Servidor
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validationErrors.length > 0 || importMutation.isPending}
                >
                  Importar {users.length} Usuários
                </Button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Processando importação...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Isso pode levar alguns minutos
              </p>
            </div>
          )}

          {step === 'complete' && importMutation.data && (
            <div className="text-center py-12">
              <div className="rounded-full bg-success-500/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check className="h-8 w-8 text-success-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Importação Concluída!</h3>
              <div className="space-y-2 text-sm">
                <p>✅ {importMutation.data.succeeded} usuários criados</p>
                {importMutation.data.failed > 0 && (
                  <p className="text-destructive">❌ {importMutation.data.failed} falharam</p>
                )}
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

#### **5.4 Integração na Página**

**Arquivo:** `src/app/admin/users/page.tsx` (modificar)

```typescript
// Adicionar no topo:
import { BulkUserImportDialog } from '@/components/admin/users/BulkUserImportDialog';
import { Upload } from 'lucide-react';

// Adicionar estado:
const [showBulkImport, setShowBulkImport] = useState(false);

// Modificar o botão de adicionar:
<div className="flex gap-3">
  <Button onClick={() => setShowInviteDialog(true)}>
    <UserPlus className="h-4 w-4 mr-2" />
    Adicionar Usuário
  </Button>
  <Button variant="secondary" onClick={() => setShowBulkImport(true)}>
    <Upload className="h-4 w-4 mr-2" />
    Importar Planilha
  </Button>
</div>

// Adicionar modal:
<BulkUserImportDialog
  open={showBulkImport}
  onOpenChange={setShowBulkImport}
/>
```

---

## 📊 Estrutura de Dados

### **Exemplo de Planilha**

```
| Nome           | Email                  |
|----------------|------------------------|
| João Silva     | joao@empresa.com      |
| Maria Santos   | maria@empresa.com     |
| Pedro Oliveira | pedro@empresa.com     |
| Ana Costa      | ana@empresa.com       |
```

### **Formato Aceito (CSV)**

```csv
Nome,Email
João Silva,joao@empresa.com
Maria Santos,maria@empresa.com
Pedro Oliveira,pedro@empresa.com
```

---

## 🧪 Testes e Validação

### **Checklist de Testes:**

#### **Frontend:**
- [ ] Upload de arquivo .xlsx funciona
- [ ] Upload de arquivo .xls funciona
- [ ] Upload de arquivo .csv funciona
- [ ] Drag-and-drop funciona
- [ ] Validação de tamanho (max 5MB)
- [ ] Validação de tipo de arquivo
- [ ] Preview mostra dados corretamente
- [ ] Edição inline de dados funciona
- [ ] Remoção de linhas funciona
- [ ] Progress bar atualiza corretamente
- [ ] Modal fecha corretamente após sucesso
- [ ] Toasts aparecem nos momentos certos

#### **Backend:**
- [ ] Endpoint de validação retorna duplicatas
- [ ] Endpoint de validação verifica emails existentes
- [ ] Importação processa em lotes
- [ ] Retry logic funciona para falhas temporárias
- [ ] Rate limiting é respeitado
- [ ] Logs são gerados corretamente
- [ ] Erros são tratados adequadamente
- [ ] Response tem formato correto

#### **Integração:**
- [ ] Clerk API é chamada corretamente
- [ ] Convites são enviados com sucesso
- [ ] Cache do TanStack Query é invalidado
- [ ] Lista de usuários atualiza automaticamente
- [ ] Admin pode ver novos usuários imediatamente

---

## 🚀 Cronograma de Implementação

### **Dia 1: Setup**
- ✅ Instalar dependências (xlsx, papaparse, react-dropzone)
- ✅ Criar types em `src/types/bulk-import.ts`
- ✅ Configurar estrutura de pastas

### **Dia 2: Backend - Validação**
- ✅ Implementar `/api/admin/users/validate-bulk`
- ✅ Testes de validação de duplicatas
- ✅ Testes de verificação de emails existentes

### **Dia 3: Backend - Importação**
- ✅ Implementar `/api/admin/users/bulk-import`
- ✅ Lógica de processamento em lotes
- ✅ Retry logic e tratamento de erros
- ✅ Implementar parsers (Excel e CSV)
- ✅ Implementar validadores

### **Dia 4: Hooks**
- ✅ Hook `useParseUserFile`
- ✅ Hook `useValidateBulkUsers`
- ✅ Hook `useBulkImportUsers`
- ✅ Testes dos hooks

### **Dia 5: Componentes (Parte 1)**
- ✅ `FileUploadZone` com drag-and-drop
- ✅ `ImportDataPreview` com tabela editável
- ✅ `ImportValidationResults`

### **Dia 6: Componentes (Parte 2)**
- ✅ `ImportProgress` com progress bar
- ✅ `ImportResultsSummary`
- ✅ `BulkUserImportDialog` (modal principal)
- ✅ Integração na página `/admin/users`

### **Dia 7: Testes e Ajustes**
- ✅ Testes end-to-end
- ✅ Testes de performance (500 usuários)
- ✅ Ajustes de UX
- ✅ Documentação final

---

## 🔒 Segurança

### **Validações Implementadas:**
1. ✅ Autenticação admin obrigatória
2. ✅ Validação de tipo de arquivo (apenas .xlsx, .xls, .csv)
3. ✅ Validação de tamanho (max 5MB)
4. ✅ Validação de formato de email
5. ✅ Verificação de duplicatas (planilha + sistema)
6. ✅ Rate limiting respeitado (Clerk API)
7. ✅ Sanitização de dados de entrada
8. ✅ Limite de usuários por importação (500)

### **Logs e Auditoria:**
- Log de todas as importações (timestamp, admin, resultado)
- Relatório detalhado de erros por linha
- Histórico de ações no Clerk

---

## 📈 Métricas de Sucesso

### **Performance:**
- Upload e parse: < 2s para 100 usuários
- Validação: < 5s para 100 usuários
- Importação: ~10s por lote de 10 usuários
- Total para 100 usuários: < 2 minutos

### **Qualidade:**
- Taxa de erro < 1% após validações
- 100% dos emails válidos criados com sucesso
- Zero regressões em funcionalidade existente

### **Adoção:**
- 80% dos admins usam import ao invés de criar manualmente
- NPS > 9 para a feature
- Redução de 95% no tempo de onboarding em massa

---

## 🎨 Referências de Design

### **Glass Morphism:**
- Modal com backdrop blur
- Cards translúcidos com bordas suaves
- Animações suaves de transição

### **Cores:**
- Sucesso: Verde (#10b981)
- Erro: Vermelho (#ef4444)
- Aviso: Amarelo (#f59e0b)
- Primary: Azul do sistema

### **Acessibilidade:**
- ARIA labels em todos os elementos interativos
- Keyboard navigation completa
- Screen reader friendly
- Contraste adequado (WCAG AA)

---

## 📚 Recursos Adicionais

### **Bibliotecas:**
- [xlsx](https://www.npmjs.com/package/xlsx) - Parse Excel
- [papaparse](https://www.papaparse.com/) - Parse CSV
- [react-dropzone](https://react-dropzone.js.org/) - Drag & Drop

### **APIs:**
- [Clerk Users API](https://clerk.com/docs/reference/backend-api/tag/Users)
- Clerk Rate Limits: 100 req/10s (tier free)

### **Referências:**
- Design system: Shadcn/ui
- Pattern: TanStack Query + API routes
- Auth: Clerk middleware

---

## ✅ Checklist Final

Antes de considerar a feature completa:

### **Funcionalidade:**
- [ ] Upload de .xlsx, .xls e .csv funciona
- [ ] Validação local e servidor funcionam
- [ ] Preview de dados está correto
- [ ] Importação em lotes funciona
- [ ] Retry logic implementado
- [ ] Relatório de erros detalhado
- [ ] Cache invalidado corretamente

### **UX/UI:**
- [ ] Interface intuitiva e auto-explicativa
- [ ] Feedback visual claro em cada etapa
- [ ] Loading states em todas as ações
- [ ] Toasts informativos
- [ ] Modal responsivo
- [ ] Acessível via teclado

### **Segurança:**
- [ ] Apenas admins podem importar
- [ ] Validação de arquivos robusta
- [ ] Sanitização de dados
- [ ] Rate limiting respeitado
- [ ] Logs de auditoria

### **Testes:**
- [ ] Todos os cenários testados
- [ ] Performance validada (500 usuários)
- [ ] Compatibilidade browser testada
- [ ] Mobile testado

### **Documentação:**
- [ ] README atualizado
- [ ] Comentários no código
- [ ] API documentada
- [ ] Exemplos de planilhas fornecidos

---

**Última atualização:** 2025-10-10
**Versão:** 1.0.0
**Status:** 📋 Planejamento Completo
