# 🚀 PLAN-006 - Installation Guide

Guia passo a passo para aplicar as otimizações de performance do PLAN-006.

## ⚡ Quick Install (TL;DR)

```bash
# 1. Instalar dependências
npm install

# 2. Aplicar migration (quando DB disponível)
npx prisma migrate dev

# 3. Testar
npm run perf:benchmark

# ✅ Pronto!
```

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- [x] Node.js 18+ instalado
- [x] PostgreSQL database acessível
- [x] Variável `DATABASE_URL` configurada no `.env`
- [x] Permissões para criar extensões no PostgreSQL

---

## 🔧 Instalação Passo a Passo

### Passo 1: Instalar Dependências

A única dependência nova é o `tsx` para executar TypeScript scripts.

```bash
npm install
```

Isso instalará:
- `tsx@^4.19.2` (devDependency)

### Passo 2: Verificar Instalação

```bash
# Verificar que tsx foi instalado
npx tsx --version

# Deve mostrar algo como: tsx 4.19.2
```

### Passo 3: Habilitar pg_stat_statements (Uma Vez)

Esta extensão permite analisar queries lentas. Execute no PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**Como executar:**

**Opção A: Via psql**
```bash
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
```

**Opção B: Via Prisma Studio**
1. Abrir: `npm run db:studio`
2. Ir para "Query"
3. Executar: `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`

**Opção C: Via GUI (pgAdmin, DBeaver, etc.)**
1. Conectar ao banco
2. Executar SQL acima

> **Nota:** Se não conseguir habilitar agora, não tem problema. O script de análise mostrará um aviso mas as outras otimizações funcionarão normalmente.

### Passo 4: Aplicar Migrations (Índices)

Este passo cria os 20+ índices compostos no banco de dados.

**Opção A: Via Prisma (Recomendado)**
```bash
npx prisma migrate dev
```

Se perguntado por nome, usar: `add-performance-indexes-plan-006`

**Opção B: Via SQL Manual (se Opção A falhar)**
```bash
psql $DATABASE_URL -f prisma/migrations/add-performance-indexes-plan-006.sql
```

**Verificar que índices foram criados:**
```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
```

Deve mostrar ~20 novos índices.

### Passo 5: Executar Benchmark

Vamos testar se tudo está funcionando:

```bash
npm run perf:benchmark
```

**Output esperado:**
```
🚀 Iniciando benchmarks de queries...

✅ 1. Buscar usuários ativos (100 registros): 45.23ms
✅ 2. Buscar portfolios recentes: 38.91ms
✅ 3. Dashboard com queries paralelas: 156.78ms
...

📊 RESULTADOS DO BENCHMARK
✅ Sucesso: 10/10
📈 Média: 78.34ms
✅ Todas as queries estão performando bem (< 500ms)
```

Se alguma query estiver > 500ms, verificar próximos passos.

### Passo 6: Analisar Queries (Opcional)

Se quiser ver queries lentas existentes:

```bash
npm run perf:analyze
```

**Output esperado:**
```
🔍 Analisando queries lentas...

📊 Top 10 Queries Mais Lentas:
(nenhuma ou poucas queries devem aparecer)
```

---

## ✅ Verificação da Instalação

### Checklist Final

Execute cada item abaixo para verificar:

- [ ] **Dependências instaladas:**
  ```bash
  npx tsx --version  # Deve mostrar versão
  ```

- [ ] **Migration aplicada:**
  ```bash
  npx prisma migrate status  # Deve mostrar todas applied
  ```

- [ ] **Índices criados:**
  ```sql
  SELECT COUNT(*) FROM pg_indexes
  WHERE schemaname = 'public' AND indexname LIKE '%_idx';
  -- Deve mostrar ~40-50 (existentes + novos)
  ```

- [ ] **Benchmark passa:**
  ```bash
  npm run perf:benchmark  # Média deve ser < 200ms
  ```

- [ ] **Scripts NPM funcionam:**
  ```bash
  npm run perf:test  # Alias para benchmark
  ```

### Testes Funcionais

#### Teste 1: Cache Funciona

Crie um arquivo de teste:

```typescript
// test-cache.ts
import { getCachedOrFetch } from './src/lib/simple-cache';

async function test() {
  console.log('🧪 Teste de cache...\n');

  // Primeira chamada (cache miss)
  console.time('Primeira chamada');
  const data1 = await getCachedOrFetch(
    'test-key',
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay
      return { message: 'Hello from fetcher!' };
    },
    60
  );
  console.timeEnd('Primeira chamada');
  console.log('Data:', data1);

  // Segunda chamada (cache hit)
  console.time('Segunda chamada');
  const data2 = await getCachedOrFetch(
    'test-key',
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { message: 'Hello from fetcher!' };
    },
    60
  );
  console.timeEnd('Segunda chamada');
  console.log('Data:', data2);

  console.log('\n✅ Cache funcionando! Segunda chamada foi instantânea.');
}

test();
```

Execute:
```bash
npx tsx test-cache.ts
```

**Output esperado:**
```
🧪 Teste de cache...
⏳ Cache miss: test-key
Primeira chamada: 1002ms
Data: { message: 'Hello from fetcher!' }
✅ Cache hit: test-key
Segunda chamada: 1ms
Data: { message: 'Hello from fetcher!' }

✅ Cache funcionando! Segunda chamada foi instantânea.
```

#### Teste 2: Slow Query Detection

Em development, faça uma query lenta propositalmente:

```typescript
// No seu código
const result = await prisma.user.findMany({
  include: {
    userPortfolios: {
      include: {
        analysisReports: {
          include: {
            investmentRecommendations: true,
          },
        },
      },
    },
  },
});
```

Deve aparecer no console:
```
⏱️  Query took 1234ms: User.findMany
```

---

## 🐛 Troubleshooting

### Problema: "Can't reach database server"

**Causa:** Database URL incorreta ou database offline.

**Solução:**
1. Verificar `.env`:
   ```bash
   cat .env | grep DATABASE_URL
   ```
2. Testar conexão:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```
3. Se offline, aguardar database voltar online
4. Tentar migration novamente

### Problema: "tsx: command not found"

**Causa:** tsx não foi instalado.

**Solução:**
```bash
npm install -D tsx
# ou
npm install
```

### Problema: "pg_stat_statements not found"

**Causa:** Extensão não habilitada (não é crítico).

**Solução:**
1. Tentar habilitar como admin:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
   ```
2. Se não conseguir, apenas ignore. O script de análise mostrará aviso mas outras features funcionam.

### Problema: Migration falha com "index already exists"

**Causa:** Alguns índices já existem.

**Solução:**
1. Verificar quais índices existem:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE schemaname = 'public'
   ORDER BY indexname;
   ```
2. Editar migration SQL para usar `IF NOT EXISTS`
3. Ou marcar migration como aplicada:
   ```bash
   npx prisma migrate resolve --applied add-performance-indexes-plan-006
   ```

### Problema: Benchmark mostra queries > 500ms

**Causa:** Índices não foram aplicados ou banco muito lento.

**Solução:**
1. Verificar índices:
   ```sql
   SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
   ```
2. Executar `ANALYZE` nas tabelas:
   ```sql
   ANALYZE "User";
   ANALYZE "UserPortfolio";
   ANALYZE "AnalysisReport";
   -- etc
   ```
3. Executar benchmark novamente
4. Se persistir, ver [Performance Guide - Troubleshooting](docs/PERFORMANCE_OPTIMIZATION.md#troubleshooting)

---

## 📊 Validação Final

Execute todos os testes abaixo para validar instalação completa:

```bash
# 1. Verificar dependências
npm list tsx

# 2. Verificar migration
npx prisma migrate status

# 3. Benchmark (deve passar com média < 200ms)
npm run perf:benchmark

# 4. Análise de queries (opcional)
npm run perf:analyze

# 5. Verificar cache (teste manual acima)
```

Se tudo passou, você está pronto! 🎉

---

## 🎓 Próximos Passos

Agora que está tudo instalado:

1. **Leia:** [Quick Start Guide](docs/QUICK_START_PERFORMANCE.md)
2. **Explore:** [Practical Examples](docs/PERFORMANCE_EXAMPLES.md)
3. **Use:** Cache, queries paralelas, DB helpers
4. **Monitore:** Logs de slow queries

---

## 📚 Recursos

- [Quick Start Guide](docs/QUICK_START_PERFORMANCE.md)
- [Performance Optimization Guide](docs/PERFORMANCE_OPTIMIZATION.md)
- [Practical Examples](docs/PERFORMANCE_EXAMPLES.md)
- [Implementation Details](IMPLEMENTACAO_PLAN_006.md)
- [Executive Summary](PLAN_006_SUMMARY.md)

---

## ❓ Dúvidas?

- **Instalação:** Revisar este guia
- **Uso:** Ver [Quick Start](docs/QUICK_START_PERFORMANCE.md)
- **Problemas:** Ver [Troubleshooting](docs/PERFORMANCE_OPTIMIZATION.md#troubleshooting)
- **Dúvidas técnicas:** Consultar Tech Lead

---

**Status:** ✅ Guia de Instalação Completo
**Última atualização:** 2025-10-14
**Versão:** 1.0
