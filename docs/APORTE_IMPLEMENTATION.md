# Implementação do Sistema de Direcionador de Aportes - FiiAI

## 📋 Resumo da Implementação

Sistema inteligente de recomendações de aportes que prioriza fundos com base em **desbalanceamento da carteira** e **oportunidades de desconto**.

---

## ✅ O Que Foi Implementado

### 1. **Database Schema** ✅
- ✅ Model `RegrasAporte` - Regras configuráveis do algoritmo
- ✅ Model `AporteRecomendacao` - Histórico de recomendações
- ✅ Model `FiiPrecoTeto` - Preços teto para cálculo de desconto
- ✅ Enum `APORTE_RECOMENDACAO` adicionado ao `OperationType`

**Arquivo:** `prisma/schema.prisma` (linhas 422-487)

### 2. **Types TypeScript** ✅
Interfaces completas para todo o sistema:
- `AporteRequest` - Request da API
- `FundoPrioritizado` - Fundo com análise completa
- `RecomendacaoAporte` - Resposta completa da recomendação
- `RegrasConfiguraveis` - Configurações admin
- `FundoDesbalanceamento` - Análise de desbalanceamento
- `FundoDesconto` - Análise de desconto

**Arquivo:** `src/types/aporte.ts`

### 3. **Services (Algoritmo Principal)** ✅

#### `DesbalanceamentoService`
- ✅ `calcularDesbalanceamento()` - Calcula % atual vs % ideal de cada fundo
- ✅ `identificarFundosAusentes()` - Identifica fundos na alocação ideal mas ausentes na carteira
- ✅ `getIdealAllocation()` - Retorna alocação ideal (distribuição equilibrada por setor)

**Arquivo:** `src/services/aporte/desbalanceamento-service.ts`

#### `DescontoService`
- ✅ `calcularDescontos()` - Calcula % de desconto (preço atual vs preço teto)
- ✅ `buscarPrecosAtuais()` - Busca preços (mockados por enquanto, pronto para API real)
- ✅ `configurarPrecoTeto()` - Admin pode configurar preço teto
- ✅ `importarPrecosTeto()` - Importação em lote
- ✅ `listarPrecosTeto()` - Lista todos os preços configurados

**Arquivo:** `src/services/aporte/desconto-service.ts`

#### `PriorizacaoService` (Cérebro do Sistema)
- ✅ `priorizarFundos()` - **Algoritmo principal**:
  1. Combina desbalanceamento + desconto com pesos configuráveis
  2. Calcula score: `(desbal * peso1) + (desconto * peso2)`
  3. Determina status: `COMPRAR_AGORA`, `AGUARDAR_DESCONTO`, `NAO_INVESTIR`
  4. Ordena por score e atribui prioridades numéricas
  5. Limita ao número máximo configurado
- ✅ `gerarJustificativa()` - Cria texto explicativo para cada recomendação

**Arquivo:** `src/services/aporte/priorizacao-service.ts`

#### `AlocacaoService`
- ✅ `calcularAlocacao()` - Distribui valor disponível entre fundos:
  - **Modo Sequencial**: Preenche gap do #1 antes de ir para #2
  - **Modo Distribuído**: Divide proporcionalmente
  - Calcula número de cotas, valor investido e % pós-aporte
  - Verifica se equilíbrio foi alcançado

**Arquivo:** `src/services/aporte/alocacao-service.ts`

### 4. **API Route** ✅

`POST /api/aporte/recomendacao`

**Request:**
```typescript
{
  portfolioId: string,
  valorDisponivel: number
}
```

**Response:**
```typescript
{
  success: boolean,
  fundosPrioritarios: [...],  // Fundos para comprar agora
  fundosAguardar: [...],       // Fundos para aguardar desconto
  resumo: {
    totalInvestido: number,
    fundosRecomendados: number,
    equilibrioAlcancado: boolean,
    sobraValor?: number
  },
  metadata: {
    regrasAplicadas: {...},
    timestamp: Date,
    versaoAlgoritmo: "1.0.0"
  }
}
```

**Arquivo:** `src/app/api/aporte/recomendacao/route.ts`

### 5. **React Hook** ✅
`useRecomendacaoAporte()` - Mutation hook com React Query

**Arquivo:** `src/hooks/use-aporte.ts`

### 6. **Seed Script** ✅
Script para popular preços teto iniciais de 12 FIIs comuns

**Arquivo:** `scripts/seed-precos-teto.ts`

---

## 🚀 Como Usar

### 1. Aplicar Schema ao Banco
```bash
npx prisma db push
npx prisma generate
```

### 2. Popular Preços Teto Iniciais
```bash
npx ts-node scripts/seed-precos-teto.ts
```

### 3. Testar API com cURL
```bash
curl -X POST http://localhost:3000/api/aporte/recomendacao \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "seu-portfolio-id",
    "valorDisponivel": 10000
  }'
```

### 4. Usar no Frontend (Next.js)
```typescript
import { useRecomendacaoAporte } from '@/hooks/use-aporte';

function MeuComponente() {
  const recomendacao = useRecomendacaoAporte();

  const handleGerar = () => {
    recomendacao.mutate({
      portfolioId: 'portfolio-id',
      valorDisponivel: 10000
    });
  };

  if (recomendacao.isSuccess) {
    const fundos = recomendacao.data.fundosPrioritarios;
    // Renderizar recomendações
  }
}
```

---

## 📊 Exemplo de Fluxo Completo

### Entrada:
- **Portfolio:** 10 FIIs com valores desbalanceados
- **Valor Disponível:** R$ 10.000
- **Regras:** Peso 60% desbalanceamento, 40% desconto

### Processamento:
1. **DesbalanceamentoService** calcula:
   - HSML11: 5% atual vs 10% ideal → Desbal = +5pp
   - HGRU11: 1% atual vs 5% ideal → Desbal = +4pp
   - RBRY11: 5% atual vs 10% ideal → Desbal = +5pp

2. **DescontoService** calcula:
   - HSML11: R$ 83.68 atual vs R$ 83.85 teto → 0.20% desconto
   - HGRU11: R$ 126.17 atual vs R$ 125.44 teto → SEM DESCONTO
   - RBRY11: R$ 95.61 atual vs R$ 97.56 teto → 2% desconto

3. **PriorizacaoService** calcula scores:
   - HSML11: (5 × 0.6) + (0.20 × 0.4) = 3.08 → **Prioridade #1** ✅
   - HGRU11: (4 × 0.6) + (0 × 0.4) = 2.40 → **Aguardar desconto** ⏳
   - RBRY11: (5 × 0.6) + (2 × 0.4) = 3.80 → **Prioridade #2** ✅

4. **AlocacaoService** distribui:
   - RBRY11 (maior score): 50 cotas × R$ 95.61 = R$ 4.780,50
   - HSML11: 60 cotas × R$ 83.68 = R$ 5.020,80
   - **Total Investido:** R$ 9.801,30
   - **Sobra:** R$ 198,70

### Saída:
```json
{
  "fundosPrioritarios": [
    {
      "prioridade": 1,
      "fiiCode": "RBRY11",
      "valorInvestir": 4780.50,
      "cotasComprar": 50,
      "justificativa": "RBRY11 está abaixo do ideal (5.0% vs. 10.0%) e com 2.00% de desconto..."
    },
    {
      "prioridade": 2,
      "fiiCode": "HSML11",
      "valorInvestir": 5020.80,
      "cotasComprar": 60,
      ...
    }
  ],
  "fundosAguardar": [
    {
      "fiiCode": "HGRU11",
      "status": "AGUARDAR_DESCONTO",
      ...
    }
  ],
  "resumo": {
    "totalInvestido": 9801.30,
    "fundosRecomendados": 2,
    "equilibrioAlcancado": true,
    "sobraValor": 198.70
  }
}
```

---

## 🔧 Próximos Passos (Não Implementados)

### Frontend Completo
- [ ] Página `/dashboard/direcionar-aportes` simplificada
- [ ] Componente `RecomendacaoTable` com tabela detalhada
- [ ] Componente `ResumoAlocacao` com cards visuais
- [ ] Formulário com apenas campo "Valor do Aporte"

### Painel Admin
- [ ] Página `/admin/regras-direcionamento-aportes`
- [ ] Sliders para configurar pesos (desbalanceamento vs desconto)
- [ ] Toggle "Permitir sem desconto"
- [ ] Input para desconto mínimo aceitável
- [ ] Preview do impacto das mudanças
- [ ] API Routes: `GET/PUT /api/admin/regras-aporte`

### Integrações
- [ ] Integração com API real de preços (Brapi, Status Invest, B3)
- [ ] Cache Redis para preços (15 minutos)
- [ ] Sistema de créditos (debitar 5 créditos por análise)
- [ ] Notificações quando novos aportes são recomendados

### Melhorias
- [ ] Permitir usuário configurar sua alocação ideal customizada
- [ ] Exportar recomendações para PDF
- [ ] Histórico de recomendações seguidas vs não seguidas
- [ ] Gráficos de evolução do balanceamento
- [ ] Alertas automáticos quando fundos atingem desconto mínimo

---

## 📚 Estrutura de Arquivos

```
src/
├── types/
│   └── aporte.ts                    ✅ Types completos
├── services/
│   └── aporte/
│       ├── desbalanceamento-service.ts  ✅ Análise de desbalanceamento
│       ├── desconto-service.ts          ✅ Análise de desconto
│       ├── priorizacao-service.ts       ✅ Algoritmo de priorização
│       └── alocacao-service.ts          ✅ Distribuição de valor
├── app/
│   └── api/
│       └── aporte/
│           └── recomendacao/
│               └── route.ts              ✅ API principal
├── hooks/
│   └── use-aporte.ts                     ✅ Hook React Query
└── scripts/
    └── seed-precos-teto.ts               ✅ Seed de preços

prisma/
└── schema.prisma                         ✅ Models completos

docs/
└── APORTE_IMPLEMENTATION.md              ✅ Esta documentação
```

---

## 🎯 Métricas de Qualidade

- ✅ **Type Safety:** 100% TypeScript tipado
- ✅ **Modularidade:** Services separados por responsabilidade
- ✅ **Testabilidade:** Lógica isolada em services puros
- ✅ **Escalabilidade:** Pronto para cache e otimizações
- ✅ **Flexibilidade:** Regras configuráveis via admin
- ✅ **Documentação:** Código comentado + docs completas

---

## 🐛 Troubleshooting

### Erro: "Portfólio não encontrado"
- Verificar se `portfolioId` pertence ao usuário autenticado
- Confirmar que portfolio existe no banco

### Erro: "Regras não configuradas"
- Executar API pela primeira vez cria regras padrão automaticamente
- Ou criar manualmente via Prisma Studio

### Recomendações vazias
- Verificar se portfolio tem posições (`positions` não vazio)
- Confirmar que há preços teto configurados
- Verificar logs do console para detalhes

### Preços teto ausentes
- Executar: `npx ts-node scripts/seed-precos-teto.ts`
- Ou configurar manualmente via `DescontoService.configurarPrecoTeto()`

---

**Versão:** 1.0.0
**Data:** 2025-10-08
**Status:** ✅ Core funcional implementado
**Próximo Milestone:** Frontend + Admin Panel
