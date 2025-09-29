# 🎯 Plano: Módulo Admin - Carteiras Recomendadas de FIIs

## 📋 Visão Geral da Tarefa

Implementar um módulo no painel administrativo para gestão de carteiras recomendadas de Fundos de Investimento Imobiliário (FIIs), permitindo que administradores cadastrem e gerenciem recomendações de fundos diretamente no sistema, sem necessidade de upload de arquivos.

## 🤖 Agente Responsável

**Backend Agent** - Escolhido pela especialização em:
- Node.js + Next.js API Routes
- Sistema de autenticação Clerk (proteção admin)
- Modelagem de dados específicos do domínio FII
- APIs RESTful com validação Zod

## 📊 Estrutura de Dados

### Modelo: RecommendedPortfolio
```typescript
{
  id: string
  name: string // Nome da carteira recomendada
  description?: string
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: string // ID do admin que criou
  funds: RecommendedFund[]
}
```

### Modelo: RecommendedFund
```typescript
{
  id: string
  portfolioId: string // FK para RecommendedPortfolio
  ticker: string // Código do fundo (ex: HGLG11)
  name: string // Nome do fundo
  segment: string // Segmento (Shopping, Logística, Corporativo, etc.)
  currentPrice: Decimal // Preço atual
  averagePrice: Decimal // Preço médio
  ceilingPrice: Decimal // Preço teto
  allocation: Decimal // Percentual de alocação (0-100)
  recommendation: Enum // BUY, SELL, HOLD
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🗂️ Estrutura de Arquivos

```
src/
├── app/
│   └── admin/
│       └── carteiras/
│           ├── page.tsx           # Lista de carteiras
│           ├── nova/
│           │   └── page.tsx       # Criar nova carteira
│           └── [id]/
│               ├── page.tsx       # Detalhes/edição da carteira
│               └── fundos/
│                   ├── page.tsx   # Lista de fundos da carteira
│                   ├── novo/
│                   │   └── page.tsx # Adicionar fundo
│                   └── [fundoId]/
│                       └── page.tsx # Editar fundo
├── api/
│   └── admin/
│       └── carteiras/
│           ├── route.ts           # GET, POST carteiras
│           ├── [id]/
│           │   ├── route.ts       # GET, PUT, DELETE carteira específica
│           │   └── fundos/
│           │       ├── route.ts   # GET, POST fundos da carteira
│           │       └── [fundoId]/
│           │           └── route.ts # PUT, DELETE fundo específico
├── components/
│   └── admin/
│       └── carteiras/
│           ├── CarteirasTable.tsx     # Tabela de carteiras
│           ├── CarteiraForm.tsx       # Formulário de carteira
│           ├── FundosTable.tsx        # Tabela de fundos
│           ├── FundoForm.tsx          # Formulário de fundo
│           └── RecommendationBadge.tsx # Badge para recomendação
├── hooks/
│   └── admin/
│       └── use-admin-carteiras.ts    # Hooks TanStack Query
└── lib/
    └── validations/
        └── carteiras.ts              # Schemas Zod
```

## 📝 Plano de Implementação Detalhado

### **Fase 1: Modelagem e Schema do Banco (Database Agent)**

#### 1.1 Atualizar Schema Prisma
```prisma
model RecommendedPortfolio {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String   // Clerk user ID

  funds RecommendedFund[]

  @@map("recommended_portfolios")
}

model RecommendedFund {
  id              String                @id @default(cuid())
  portfolioId     String
  ticker          String
  name            String
  segment         String
  currentPrice    Decimal               @db.Decimal(10,2)
  averagePrice    Decimal               @db.Decimal(10,2)
  ceilingPrice    Decimal               @db.Decimal(10,2)
  allocation      Decimal               @db.Decimal(5,2) // 0-100%
  recommendation  FundRecommendation
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  portfolio RecommendedPortfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@map("recommended_funds")
}

enum FundRecommendation {
  BUY
  SELL
  HOLD
}
```

#### 1.2 Criar e Executar Migration
```bash
npm run db:push
```

### **Fase 2: Validações e Tipos (Backend Agent)**

#### 2.1 Criar Schemas Zod - `lib/validations/carteiras.ts`
```typescript
import { z } from 'zod';

export const FundRecommendationEnum = z.enum(['BUY', 'SELL', 'HOLD']);

export const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updatePortfolioSchema = createPortfolioSchema.partial();

export const createFundSchema = z.object({
  ticker: z.string().min(1, 'Ticker é obrigatório').max(10).toUpperCase(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  segment: z.string().min(1, 'Segmento é obrigatório'),
  currentPrice: z.number().positive('Preço atual deve ser positivo'),
  averagePrice: z.number().positive('Preço médio deve ser positivo'),
  ceilingPrice: z.number().positive('Preço teto deve ser positivo'),
  allocation: z.number().min(0).max(100, 'Alocação deve estar entre 0-100%'),
  recommendation: FundRecommendationEnum,
});

export const updateFundSchema = createFundSchema.partial();

export type CreatePortfolioData = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioData = z.infer<typeof updatePortfolioSchema>;
export type CreateFundData = z.infer<typeof createFundSchema>;
export type UpdateFundData = z.infer<typeof updateFundSchema>;
```

### **Fase 3: APIs Backend (Backend Agent)**

#### 3.1 API de Carteiras - `app/api/admin/carteiras/route.ts`
```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { createPortfolioSchema } from '@/lib/validations/carteiras';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const portfolios = await db.recommendedPortfolio.findMany({
      include: {
        funds: true,
        _count: {
          select: { funds: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(portfolios);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createPortfolioSchema.parse(body);

    const portfolio = await db.recommendedPortfolio.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
      include: {
        funds: true,
      }
    });

    return NextResponse.json(portfolio, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 3.2 API de Carteira Específica - `app/api/admin/carteiras/[id]/route.ts`
```typescript
// GET, PUT, DELETE para carteira específica
// Implementação similar com validações de admin e ownership
```

#### 3.3 API de Fundos - `app/api/admin/carteiras/[id]/fundos/route.ts`
```typescript
// GET, POST para fundos de uma carteira
// Validações de alocação total (não pode passar de 100%)
```

#### 3.4 API de Fundo Específico - `app/api/admin/carteiras/[id]/fundos/[fundoId]/route.ts`
```typescript
// PUT, DELETE para fundo específico
```

### **Fase 4: Hooks TanStack Query (Backend Agent)**

#### 4.1 Hooks de Carteiras - `hooks/admin/use-admin-carteiras.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CreatePortfolioData, UpdatePortfolioData } from '@/lib/validations/carteiras';

export function useAdminPortfolios() {
  return useQuery({
    queryKey: ['admin', 'portfolios'],
    queryFn: () => api.get('/api/admin/carteiras'),
    staleTime: 5 * 60_000,
  });
}

export function useAdminPortfolio(id: string) {
  return useQuery({
    queryKey: ['admin', 'portfolios', id],
    queryFn: () => api.get(`/api/admin/carteiras/${id}`),
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortfolioData) =>
      api.post('/api/admin/carteiras', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
    },
  });
}

export function useUpdatePortfolio(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePortfolioData) =>
      api.put(`/api/admin/carteiras/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', id] });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/carteiras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
    },
  });
}

// Hooks similares para fundos...
```

### **Fase 5: Componentes UI (Frontend Agent)**

#### 5.1 Componente de Tabela de Carteiras - `components/admin/carteiras/CarteirasTable.tsx`
```typescript
"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminPortfolios, useDeletePortfolio } from '@/hooks/admin/use-admin-carteiras';

export function CarteirasTable() {
  const { data: portfolios, isLoading } = useAdminPortfolios();
  const deletePortfolio = useDeletePortfolio();

  // Implementação da tabela com ações
}
```

#### 5.2 Formulário de Carteira - `components/admin/carteiras/CarteiraForm.tsx`
```typescript
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPortfolioSchema } from '@/lib/validations/carteiras';

export function CarteiraForm({ portfolio, onSuccess }: CarteiraFormProps) {
  const form = useForm({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: portfolio || { name: '', description: '', isActive: true }
  });

  // Implementação do formulário
}
```

#### 5.3 Componente de Badge de Recomendação - `components/admin/carteiras/RecommendationBadge.tsx`
```typescript
import { Badge } from '@/components/ui/badge';

const recommendationConfig = {
  BUY: { label: 'Comprar', variant: 'success' as const },
  SELL: { label: 'Vender', variant: 'destructive' as const },
  HOLD: { label: 'Aguardar', variant: 'secondary' as const },
};

export function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const config = recommendationConfig[recommendation as keyof typeof recommendationConfig];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
```

### **Fase 6: Páginas da Interface (Frontend Agent)**

#### 6.1 Lista de Carteiras - `app/admin/carteiras/page.tsx`
```typescript
import { CarteirasTable } from '@/components/admin/carteiras/CarteirasTable';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CarteirasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Carteiras Recomendadas</h1>
          <p className="text-muted-foreground">
            Gerencie as carteiras de FIIs recomendadas para os usuários
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/carteiras/nova">
            Criar Carteira
          </Link>
        </Button>
      </div>

      <CarteirasTable />
    </div>
  );
}
```

#### 6.2 Criação de Nova Carteira - `app/admin/carteiras/nova/page.tsx`
```typescript
import { CarteiraForm } from '@/components/admin/carteiras/CarteiraForm';

export default function NovaCarteiraPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova Carteira Recomendada</h1>
        <p className="text-muted-foreground">
          Crie uma nova carteira de FIIs recomendados
        </p>
      </div>

      <CarteiraForm />
    </div>
  );
}
```

#### 6.3 Detalhes da Carteira - `app/admin/carteiras/[id]/page.tsx`
```typescript
// Página com informações da carteira e lista de fundos
// Permite editar carteira e gerenciar fundos
```

### **Fase 7: Navegação e Integração (Frontend Agent)**

#### 7.1 Adicionar ao Menu Admin
Atualizar componente de sidebar para incluir link para carteiras:

```typescript
// Em components/app/admin-sidebar.tsx
{
  title: "Carteiras",
  href: "/admin/carteiras",
  icon: Portfolio,
}
```

#### 7.2 Adicionar Card na Overview Admin
```typescript
// Em app/admin/page.tsx
<Card>
  <CardHeader>
    <CardTitle>Carteiras Recomendadas</CardTitle>
    <CardDescription>
      Gerencie carteiras de FIIs para recomendação
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button asChild>
      <Link href="/admin/carteiras">Gerenciar Carteiras</Link>
    </Button>
  </CardContent>
</Card>
```

### **Fase 8: Validações de Negócio (Backend Agent)**

#### 8.1 Validação de Alocação Total
```typescript
// Middleware para validar que soma das alocações não passe de 100%
async function validateTotalAllocation(portfolioId: string, excludeFundId?: string) {
  const funds = await db.recommendedFund.findMany({
    where: {
      portfolioId,
      id: excludeFundId ? { not: excludeFundId } : undefined
    }
  });

  const totalAllocation = funds.reduce((sum, fund) => sum + Number(fund.allocation), 0);
  return totalAllocation;
}
```

#### 8.2 Validação de Ticker Único por Carteira
```typescript
// Impedir duplicação de fundos na mesma carteira
async function validateUniqueTicker(portfolioId: string, ticker: string, excludeFundId?: string) {
  const existingFund = await db.recommendedFund.findFirst({
    where: {
      portfolioId,
      ticker,
      id: excludeFundId ? { not: excludeFundId } : undefined
    }
  });

  return !existingFund;
}
```

### **Fase 9: Testes (QA Agent)**

#### 9.1 Testes de API
```typescript
// tests/api/admin/carteiras.test.ts
describe('/api/admin/carteiras', () => {
  test('should create portfolio with valid data', async () => {
    // Test implementation
  });

  test('should reject non-admin users', async () => {
    // Test implementation
  });

  test('should validate allocation limits', async () => {
    // Test implementation
  });
});
```

#### 9.2 Testes de Componentes
```typescript
// tests/components/CarteirasTable.test.tsx
describe('CarteirasTable', () => {
  test('should render portfolios list', () => {
    // Test implementation
  });

  test('should handle delete action', () => {
    // Test implementation
  });
});
```

### **Fase 10: Documentação (Documentation Agent)**

#### 10.1 Atualizar Documentação de APIs
Documentar novos endpoints em `docsFiiAI/apis.md`

#### 10.2 Atualizar Guia de Desenvolvimento
Adicionar seção sobre carteiras recomendadas em `docsFiiAI/guidelines-desenvolvimento.md`

## 🔧 Comandos para Implementação

```bash
# 1. Aplicar mudanças no schema
npm run db:push

# 2. Verificar tipos durante desenvolvimento
npm run typecheck

# 3. Executar linting
npm run lint

# 4. Rodar testes
npm run test

# 5. Visualizar banco de dados
npm run db:studio
```

## 📋 Checklist de Implementação

### Backend (Database + Backend Agent)
- [ ] Criar modelos RecommendedPortfolio e RecommendedFund no Prisma
- [ ] Executar migration do banco de dados
- [ ] Criar schemas Zod para validação
- [ ] Implementar API `/api/admin/carteiras` (CRUD completo)
- [ ] Implementar API `/api/admin/carteiras/[id]/fundos` (CRUD completo)
- [ ] Adicionar validações de negócio (alocação, ticker único)
- [ ] Criar hooks TanStack Query para todas as operações

### Frontend (Frontend Agent)
- [ ] Criar componente CarteirasTable com ações
- [ ] Criar formulário CarteiraForm com validação
- [ ] Criar componente FundosTable para fundos da carteira
- [ ] Criar formulário FundoForm com validação
- [ ] Criar componente RecommendationBadge
- [ ] Implementar páginas `/admin/carteiras/*`
- [ ] Adicionar navegação no menu admin
- [ ] Adicionar card na overview admin

### Testes e Qualidade (QA Agent)
- [ ] Testes unitários para APIs
- [ ] Testes de integração para fluxo completo
- [ ] Testes de componentes React
- [ ] Validação de acessibilidade
- [ ] Testes de responsividade

### Segurança (Security Agent)
- [ ] Verificar proteção admin em todas as rotas
- [ ] Validar sanitização de inputs
- [ ] Testar injection attacks
- [ ] Verificar logs de auditoria
- [ ] Validar rate limiting se necessário

### Deploy (DevOps Agent)
- [ ] Testar build para produção
- [ ] Verificar variáveis de ambiente
- [ ] Executar migration em staging
- [ ] Deploy em produção
- [ ] Monitorar logs pós-deploy

## 🎯 Resultado Esperado

Ao final da implementação, os administradores poderão:

1. **Criar carteiras recomendadas** com nome e descrição
2. **Adicionar fundos às carteiras** com todos os campos necessários
3. **Editar informações** de carteiras e fundos existentes
4. **Definir recomendações** (Comprar/Vender/Aguardar) para cada fundo
5. **Controlar alocações** com validação de limite de 100%
6. **Ativar/desativar carteiras** conforme necessário
7. **Visualizar dados organizados** em tabelas responsivas
8. **Gerenciar múltiplas carteiras** com facilidade

O sistema será totalmente integrado ao painel admin existente, seguindo todos os padrões de segurança, validação e UX já estabelecidos no projeto.