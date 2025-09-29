# 📚 Base de Conhecimento (RAG) - FiiAI

## 🎯 Visão Geral

A Base de Conhecimento integra Retrieval Augmented Generation (RAG) ao AI Chat do FiiAI, permitindo que a IA forneça respostas contextualizadas baseadas em conhecimento específico do domínio FII (Fundos de Investimento Imobiliário).

## 🏗️ Arquitetura

### Componentes Principais

1. **Upstash Vector** - Banco de dados vetorial para embeddings
2. **Chunking Engine** - Processamento e fragmentação de conteúdo
3. **Admin Interface** - Gestão da base de conhecimento
4. **RAG Integration** - Recuperação contextual no chat

### Fluxo de Dados

```
Admin Input → Chunking → Embeddings → Upstash Vector
                                           ↓
User Query → Embedding → Vector Search → Context → AI Response
```

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Upstash Vector Database
UPSTASH_VECTOR_REST_URL=https://your-vector-db.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your_token_here

# OpenAI para embeddings (obrigatório)
OPENAI_API_KEY=sk-your-openai-key
```

### Configuração do Índice Upstash

1. Acesse [Upstash Console](https://console.upstash.com)
2. Crie um novo Vector Database
3. Configure dimensões: **1536** (text-embedding-3-small)
4. Métrica de similaridade: **cosine**
5. Copie URL e Token para `.env.local`

## 📊 Modelo de Dados

### KnowledgeBaseEntry
```prisma
model KnowledgeBaseEntry {
  id          String   @id @default(cuid())
  userId      String?  // Multi-tenant por usuário
  workspaceId String?  // Multi-tenant por workspace
  title       String
  content     String   @db.Text
  tags        String[]
  status      KnowledgeEntryStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  chunks      KnowledgeChunk[]
}
```

### KnowledgeChunk
```prisma
model KnowledgeChunk {
  id              String              @id @default(cuid())
  entryId         String
  ordinal         Int                 // Ordem no documento
  content         String              @db.Text
  tokens          Int?                // Contagem de tokens
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  entry           KnowledgeBaseEntry  @relation(fields: [entryId], references: [id], onDelete: Cascade)
}
```

## 🛠️ APIs Admin

### Gestão de Entradas

**Listar Entradas**
```typescript
GET /api/admin/knowledge
?page=1&pageSize=50&search=termo&status=ACTIVE&tags=fii,reit
```

**Criar Entrada**
```typescript
POST /api/admin/knowledge
{
  "title": "Guia de FIIs Logísticos",
  "content": "Conteúdo detalhado...",
  "tags": ["fii", "logistico", "investimento"],
  "status": "ACTIVE"
}
```

**Atualizar Entrada**
```typescript
PUT /api/admin/knowledge/:id
{
  "title": "Título atualizado",
  "content": "Novo conteúdo...",
  "status": "DRAFT"
}
```

**Deletar Entrada**
```typescript
DELETE /api/admin/knowledge/:id
```

**Reindexar Entrada**
```typescript
POST /api/admin/knowledge/:id/reindex
```

**Estatísticas**
```typescript
GET /api/admin/knowledge/stats
{
  "database": {
    "totalEntries": 25,
    "activeEntries": 20,
    "totalChunks": 150
  },
  "vector": {
    "connected": true,
    "totalVectors": 150,
    "indexedEntries": 20
  },
  "health": {
    "syncStatus": "synced"
  }
}
```

## 🎨 Interface Admin

### Localização
```
/admin/knowledge
├── /               # Lista de entradas
├── /new            # Criar entrada
├── /[id]/edit      # Editar entrada
└── /stats          # Dashboard de estatísticas
```

### Funcionalidades
- ✅ CRUD completo de entradas
- ✅ Busca textual e filtros
- ✅ Gerenciamento de tags
- ✅ Reindexação manual
- ✅ Monitoramento de status
- ✅ Estatísticas da base

## 🤖 Integração RAG

### Funcionamento

1. **Captura da Query**: Última mensagem do usuário é extraída
2. **Geração de Embedding**: OpenAI text-embedding-3-small
3. **Busca Vetorial**: Top-K chunks mais relevantes
4. **Filtragem Multi-tenant**: Isolamento por userId/workspaceId
5. **Injeção de Contexto**: Sistema prompt com chunks relevantes

### Configuração do Contexto

```typescript
// Parâmetros padrão
{
  topK: 5,              // Máximo 5 chunks
  maxTokens: 1500,      // Limite de tokens no contexto
  threshold: 0.7        // Score mínimo de similaridade
}
```

### Exemplo de Prompt Injetado

```
Use o contexto abaixo somente se for relevante para a pergunta do usuário.
Se o contexto não for pertinente, ignore-o e responda normalmente.

<context>
**Guia de FIIs Logísticos:**
Os FIIs do setor logístico investem em galpões, centros de distribuição...

**Análise de Dividendos:**
Para avaliar FIIs, considere o dividend yield, mas também...
</context>

[Conversa normal continua...]
```

## 🔄 Chunking Strategy

### Configurações

```typescript
{
  maxTokens: 800,           // Tamanho máximo do chunk
  minTokens: 100,           // Tamanho mínimo do chunk
  overlap: 50,              // Sobreposição entre chunks
  preserveParagraphs: true  // Manter integridade dos parágrafos
}
```

### Algoritmo

1. **Limpeza**: Normalizar quebras de linha e espaços
2. **Segmentação**: Por parágrafos ou sentenças
3. **Agrupamento**: Respeitando limites de tokens
4. **Sobreposição**: Para contexto contínuo
5. **Otimização**: Fusão de chunks muito pequenos

## 🛡️ Segurança e Multi-tenancy

### Isolamento de Dados

```typescript
// Filtro automático por tenant
const filter = {
  userId: user.id,         // Isolamento por usuário
  workspaceId: workspace.id, // Isolamento por workspace
  status: 'ACTIVE'         // Apenas entradas ativas
}
```

### Validações

- ✅ Autenticação obrigatória (Clerk)
- ✅ Autorização admin para gestão
- ✅ Validação de schema (Zod)
- ✅ Sanitização de conteúdo
- ✅ Rate limiting implícito (créditos)

## 📈 Monitoramento

### Métricas Importantes

- **Database Health**: Conexão com PostgreSQL
- **Vector Health**: Conexão com Upstash
- **Sync Status**: Entradas indexadas vs. ativas
- **Performance**: Tempo de resposta das queries
- **Usage**: Frequência de recuperação por usuário

### Logs

```typescript
// Exemplo de log (sem dados sensíveis)
{
  "event": "rag_retrieval",
  "userId": "usr_123",
  "queryTokens": 45,
  "retrievedChunks": 3,
  "contextTokens": 890,
  "duration": 245,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 🚨 Troubleshooting

### Problemas Comuns

**Vector não conecta**
```bash
# Verificar credenciais
UPSTASH_VECTOR_REST_URL=https://...
UPSTASH_VECTOR_REST_TOKEN=***

# Testar conexão
curl -H "Authorization: Bearer $TOKEN" $URL/info
```

**Embeddings falham**
```bash
# Verificar OpenAI API Key
OPENAI_API_KEY=sk-***

# Testar API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

**Sync fora de sincronia**
```typescript
// Reindexar todas as entradas ativas
POST /api/admin/knowledge/bulk-reindex
```

### Status de Health Check

```typescript
GET /api/admin/knowledge/stats
// Verificar:
// - health.databaseConnected: true
// - health.vectorConnected: true
// - health.syncStatus: "synced"
```

## 🔄 Migração e Setup

### Passos Iniciais

1. **Configurar Upstash Vector**
2. **Executar migração Prisma**
3. **Configurar variáveis de ambiente**
4. **Testar conexões**
5. **Importar conteúdo inicial**

### Scripts Úteis

```bash
# Gerar e aplicar migração
npm run db:migrate

# Verificar schema
npm run db:studio

# Build e typecheck
npm run build
npm run typecheck
```

## 📚 Casos de Uso FII

### Conteúdo Sugerido

1. **Setores de FII**: Logístico, Shopping, Corporativo, etc.
2. **Métricas**: P/VP, Dividend Yield, Vacancy Rate
3. **Análise**: Como avaliar FIIs, riscos, oportunidades
4. **Regulamentação**: CVM, ANBIMA, tributação
5. **Mercado**: Tendências, IPOs, fusões e aquisições

### Estrutura de Tags

```typescript
[
  "fii-logistico", "fii-shopping", "fii-corporativo",
  "analise-fundamentalista", "dividend-yield", "p-vp",
  "regulamentacao", "tributacao", "ipf", "mercado",
  "reit", "internacional", "diversificacao"
]
```

---

**Última atualização:** 2025-01-15
**Versão:** 1.0.0