# Instruções para Resolver o Erro das Tabelas FII

## Problema
O erro `The table 'public.recommended_portfolios' does not exist` indica que as tabelas do sistema FII não foram criadas no banco de dados.

## Solução

### Opção 1: Migração Manual (Recomendada)
1. **Conecte-se ao seu banco PostgreSQL** usando sua ferramenta preferida (pgAdmin, DBeaver, psql, etc.)

2. **Execute o script SQL** que criei no arquivo `manual_migration.sql`. Este script:
   - Cria todos os ENUMs necessários
   - Cria todas as tabelas FII que estão faltando
   - Adiciona todos os índices para performance
   - Configura as foreign keys corretamente
   - Usa `IF NOT EXISTS` para evitar erros se algo já existir

### Opção 2: Usando Prisma (se tiver DATABASE_URL configurado)
1. **Configure a variável de ambiente DATABASE_URL** no arquivo `.env.local`:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco?schema=public"
   ```

2. **Execute a migração**:
   ```bash
   npx prisma db push
   ```

### Opção 3: Reset Completo (Cuidado - apaga dados!)
Se você quiser recriar tudo do zero:
1. **Configure DATABASE_URL**
2. **Execute**:
   ```bash
   npx prisma migrate reset
   npx prisma db push
   ```

## Tabelas que Serão Criadas
- `recommended_portfolios` - Carteiras recomendadas pelos admins
- `recommended_funds` - Fundos dentro das carteiras recomendadas
- `UserPortfolio` - Carteiras dos usuários (upload Excel)
- `AnalysisReport` - Relatórios de análise da IA
- `InvestmentRecommendation` - Recomendações de investimento
- `Notification` - Sistema de notificações

## Verificação
Após executar a migração, você pode testar se funcionou:
1. Acesse a API: `GET /api/admin/carteiras`
2. Tente criar uma carteira: `POST /api/admin/carteiras`

## Arquivos Criados
- `manual_migration.sql` - Script SQL para execução manual
- `prisma/migrations/20250928222922_add_fii_models/migration.sql` - Migração oficial do Prisma

Execute qualquer uma dessas opções e o erro será resolvido!
