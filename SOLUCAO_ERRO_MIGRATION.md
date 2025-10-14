# 🔧 Solução para Erro de Migration - Índices Duplicados

## ❌ Erro Encontrado

```
Error: P3006
Migration `20250928222922_add_fii_models` failed to apply cleanly to the shadow database.
Error: ERROR: relation "User_email_idx" already exists
```

## ✅ Solução Implementada

Criamos uma migration segura com `IF NOT EXISTS` que não quebra se os índices já existirem.

### Quando o Banco Estiver Disponível

**Opção 1: Aplicar Índices Via Prisma DB Execute**

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/99999999999999_add_performance_indexes_safe/migration.sql
```

**Opção 2: Aplicar Via psql (Se tiver psql instalado)**

```bash
# Windows PowerShell
$env:DATABASE_URL = "sua-connection-string-aqui"
psql $env:DATABASE_URL -f prisma/migrations/99999999999999_add_performance_indexes_safe/migration.sql
```

**Opção 3: Copiar e Colar no SQL Editor**

1. Abra o Neon Console (https://console.neon.tech/)
2. Acesse seu projeto
3. Vá em "SQL Editor"
4. Copie todo o conteúdo de `prisma/migrations/99999999999999_add_performance_indexes_safe/migration.sql`
5. Cole e execute

### Verificar se os Índices Foram Criados

```sql
-- Listar todos os índices criados
SELECT 
  schemaname, 
  tablename, 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
```

### Após Aplicar os Índices

1. **Resolver o conflito do Prisma:**

```bash
# Marcar a migration problemática como aplicada
npx prisma migrate resolve --applied "20250928222922_add_fii_models"
```

2. **Atualizar o Prisma Client:**

```bash
npx prisma generate
```

3. **Testar a aplicação:**

```bash
npm run dev
```

## 📊 Índices Adicionados (18 total)

### User (2)
- `User_isActive_createdAt_idx` - Usuários ativos por data
- `User_email_isActive_idx` - Login rápido

### CreditBalance (1)
- `CreditBalance_creditsRemaining_lastSyncedAt_idx` - Saldos baixos

### UsageHistory (3)
- `UsageHistory_userId_operationType_timestamp_idx` - Histórico por tipo
- `UsageHistory_operationType_timestamp_idx` - Stats por operação
- `UsageHistory_timestamp_desc_idx` - Uso recente

### StorageObject (2)
- `StorageObject_userId_deletedAt_createdAt_idx` - Arquivos ativos
- `StorageObject_contentType_size_idx` - Arquivos grandes

### RecommendedFund (2)
- `RecommendedFund_recommendation_allocation_idx` - Por recomendação
- `RecommendedFund_ticker_currentPrice_idx` - Preços

### UserPortfolio (2)
- `UserPortfolio_userId_uploadedAt_idx` - Portfolios recentes
- `UserPortfolio_userId_lastAnalyzedAt_idx` - Análises pendentes

### AnalysisReport (3)
- `AnalysisReport_userId_generatedAt_idx` - Análises recentes
- `AnalysisReport_userId_analysisType_generatedAt_idx` - Por tipo
- `AnalysisReport_userPortfolioId_generatedAt_idx` - Histórico

### InvestmentRecommendation (3)
- `InvestmentRecommendation_fiiCode_recommendation_idx` - Por FII
- `InvestmentRecommendation_recommendation_confidence_idx` - Por confiança
- `InvestmentRecommendation_analysisReportId_priority_idx` - Prioritização

## 🎯 Melhorias de Performance Esperadas

Após aplicar os índices:

- ⚡ **Dashboard 40-70% mais rápido**
- 📊 **Queries de listagem < 500ms**
- 🚀 **APIs respondem em < 300ms**
- 💾 **Menos carga no banco de dados**

## ⚠️ Notas Importantes

1. **AporteRecomendacao**: Índices desta tabela foram removidos pois a tabela ainda não existe no banco
2. **IF NOT EXISTS**: Todos os índices usam esta cláusula para evitar erros se já existirem
3. **Shadow Database**: Evitamos o uso do shadow database aplicando o SQL diretamente

## 🔄 Próximos Passos

1. ✅ Aguardar banco ficar disponível
2. ⬜ Aplicar migration de índices
3. ⬜ Resolver migration antiga com `migrate resolve`
4. ⬜ Testar performance com `npx tsx scripts/benchmark-queries.ts`
5. ⬜ Commit das mudanças

## 📝 Para o Futuro

Se adicionar a tabela `AporteRecomendacao`, adicionar estes índices:

```sql
CREATE INDEX IF NOT EXISTS "AporteRecomendacao_userId_dataRecomendacao_idx" 
ON "AporteRecomendacao"("userId", "dataRecomendacao" DESC);

CREATE INDEX IF NOT EXISTS "AporteRecomendacao_portfolioId_dataRecomendacao_idx" 
ON "AporteRecomendacao"("portfolioId", "dataRecomendacao" DESC);
```

---

**Criado em:** 2025-10-14  
**Branch:** feature/melhorias-desempenho  
**Relacionado:** PLAN-006 Otimização de Performance
