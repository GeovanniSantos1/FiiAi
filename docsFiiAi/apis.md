# 🔌 Documentação de APIs FiiAI

## 📋 Visão Geral

A API do FiiAI segue padrões RESTful com autenticação via Clerk, validação com Zod e responses padronizados. Todas as rotas são protegidas e verificam ownership de recursos.

## 🛡️ Autenticação

### **Headers Obrigatórios**
```http
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

### **Verificação Server-Side**
Todas as rotas verificam autenticação automaticamente através do middleware Clerk.

## 📊 Formato de Resposta Padrão

### **Sucesso**
```json
{
  "data": {}, // ou []
  "message": "Operação realizada com sucesso"
}
```

### **Erro**
```json
{
  "error": "Mensagem de erro",
  "details": {}, // Detalhes específicos (opcional)
  "code": "ERROR_CODE" // Código específico (opcional)
}
```

## 🏠 APIs de Usuário

### **GET /api/users/me**
Retorna dados do usuário autenticado.

**Response:**
```json
{
  "id": "user_123",
  "clerkId": "user_2abc123",
  "email": "user@example.com",
  "name": "João Silva",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "creditBalance": {
    "creditsRemaining": 150,
    "lastSyncedAt": "2024-01-01T00:00:00Z"
  }
}
```

### **PUT /api/users/me**
Atualiza dados do usuário.

**Request Body:**
```json
{
  "name": "João Santos Silva"
}
```

**Response:**
```json
{
  "id": "user_123",
  "name": "João Santos Silva",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 💰 APIs de Créditos

### **GET /api/credits/balance**
Retorna saldo atual de créditos.

**Response:**
```json
{
  "creditsRemaining": 150,
  "lastSyncedAt": "2024-01-01T00:00:00Z"
}
```

### **POST /api/credits/consume**
Consome créditos para uma operação.

**Request Body:**
```json
{
  "operationType": "FII_PORTFOLIO_ANALYSIS",
  "creditsToConsume": 10,
  "details": {
    "portfolioId": "portfolio_123",
    "analysisType": "PORTFOLIO_EVALUATION"
  }
}
```

**Response:**
```json
{
  "success": true,
  "creditsRemaining": 140,
  "usageId": "usage_456"
}
```

### **GET /api/credits/history**
Histórico de uso de créditos.

**Query Parameters:**
- `page` (optional): Número da página (default: 1)
- `limit` (optional): Itens por página (default: 20, max: 100)
- `operationType` (optional): Filtrar por tipo de operação

**Response:**
```json
{
  "data": [
    {
      "id": "usage_123",
      "operationType": "FII_PORTFOLIO_ANALYSIS",
      "creditsUsed": 10,
      "timestamp": "2024-01-01T00:00:00Z",
      "details": {
        "portfolioId": "portfolio_123"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## 📈 APIs de Portfólio

### **GET /api/portfolios**
Lista portfólios do usuário.

**Query Parameters:**
- `page` (optional): Número da página (default: 1)
- `limit` (optional): Itens por página (default: 10)

**Response:**
```json
{
  "data": [
    {
      "id": "portfolio_123",
      "originalFileName": "meu_portfolio.xlsx",
      "uploadedAt": "2024-01-01T00:00:00Z",
      "totalValue": 50000.00,
      "lastAnalyzedAt": "2024-01-01T01:00:00Z",
      "positionsCount": 8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

### **POST /api/portfolios**
Cria um novo portfólio via upload de Excel.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Arquivo Excel (.xlsx)
- `name` (optional): Nome personalizado do portfólio

**Response:**
```json
{
  "id": "portfolio_123",
  "originalFileName": "portfolio.xlsx",
  "uploadedAt": "2024-01-01T00:00:00Z",
  "totalValue": 50000.00,
  "positions": [
    {
      "fiiCode": "HGLG11",
      "fiiName": "HG Logística",
      "quantity": 100,
      "avgPrice": 120.50,
      "currentValue": 12500.00,
      "percentage": 25.0
    }
  ]
}
```

### **GET /api/portfolios/[id]**
Retorna detalhes de um portfólio específico.

**Response:**
```json
{
  "id": "portfolio_123",
  "originalFileName": "meu_portfolio.xlsx",
  "uploadedAt": "2024-01-01T00:00:00Z",
  "totalValue": 50000.00,
  "lastAnalyzedAt": "2024-01-01T01:00:00Z",
  "positions": [
    {
      "fiiCode": "HGLG11",
      "fiiName": "HG Logística",
      "sector": "LOGISTICO",
      "quantity": 100,
      "avgPrice": 120.50,
      "currentValue": 12500.00,
      "percentage": 25.0,
      "dividendYield": 8.5
    }
  ]
}
```

### **DELETE /api/portfolios/[id]**
Remove um portfólio.

**Response:**
```json
{
  "message": "Portfólio removido com sucesso"
}
```

## 📊 APIs de Análise

### **POST /api/analysis**
Inicia análise de portfólio por IA.

**Request Body:**
```json
{
  "portfolioId": "portfolio_123",
  "analysisType": "PORTFOLIO_EVALUATION",
  "options": {
    "includeRecommendations": true,
    "riskTolerance": "moderate",
    "investmentGoal": "income"
  }
}
```

**Response:**
```json
{
  "analysisId": "analysis_456",
  "status": "processing",
  "estimatedTime": 30,
  "creditsUsed": 10
}
```

### **GET /api/analysis/[id]**
Retorna resultado de uma análise.

**Response:**
```json
{
  "id": "analysis_456",
  "status": "completed",
  "analysisType": "PORTFOLIO_EVALUATION",
  "generatedAt": "2024-01-01T01:00:00Z",
  "processingTime": 28,
  "creditsUsed": 10,
  "summary": "Seu portfólio apresenta boa diversificação...",
  "currentAllocation": {
    "LOGISTICO": 45.0,
    "SHOPPING": 25.0,
    "CORPORATIVO": 20.0,
    "RESIDENCIAL": 10.0
  },
  "riskAssessment": {
    "riskLevel": "moderate",
    "volatility": 0.15,
    "maxDrawdown": 0.12,
    "sharpeRatio": 1.2
  },
  "performanceMetrics": {
    "totalReturn": 0.18,
    "annualizedReturn": 0.12,
    "dividendYield": 8.7,
    "benchmarkComparison": 0.03
  },
  "recommendations": [
    {
      "type": "rebalancing",
      "priority": "high",
      "description": "Considere reduzir exposição ao setor logístico",
      "suggestedAction": "Vender 20% da posição em HGLG11"
    }
  ]
}
```

### **GET /api/analysis**
Lista análises do usuário.

**Query Parameters:**
- `page` (optional): Número da página
- `limit` (optional): Itens por página
- `portfolioId` (optional): Filtrar por portfólio

**Response:**
```json
{
  "data": [
    {
      "id": "analysis_456",
      "analysisType": "PORTFOLIO_EVALUATION",
      "status": "completed",
      "generatedAt": "2024-01-01T01:00:00Z",
      "creditsUsed": 10,
      "portfolio": {
        "id": "portfolio_123",
        "originalFileName": "portfolio.xlsx"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

## 🤖 APIs de Recomendações

### **GET /api/recommendations**
Lista recomendações de investimento.

**Query Parameters:**
- `analysisId` (optional): Filtrar por análise específica
- `recommendationType` (optional): Filtrar por tipo (BUY, SELL, HOLD)
- `minConfidence` (optional): Confiança mínima (0-1)

**Response:**
```json
{
  "data": [
    {
      "id": "rec_123",
      "fiiCode": "BTLG11",
      "fiiName": "BTG Logística",
      "recommendation": "BUY",
      "targetPercentage": 15.0,
      "investmentAmount": 7500.00,
      "reasoning": "FII com forte crescimento no setor logístico...",
      "confidence": 0.85,
      "priority": 1,
      "analysisReport": {
        "id": "analysis_456",
        "generatedAt": "2024-01-01T01:00:00Z"
      }
    }
  ]
}
```

## 🔔 APIs de Notificações

### **GET /api/notifications**
Lista notificações do usuário.

**Query Parameters:**
- `read` (optional): Filtrar por lidas/não lidas (true/false)
- `type` (optional): Tipo de notificação
- `priority` (optional): Prioridade (LOW, NORMAL, HIGH, URGENT)

**Response:**
```json
{
  "data": [
    {
      "id": "notif_123",
      "type": "ANALYSIS_COMPLETE",
      "priority": "NORMAL",
      "title": "Análise concluída",
      "message": "Sua análise de portfólio foi concluída com sucesso.",
      "read": false,
      "createdAt": "2024-01-01T01:00:00Z",
      "data": {
        "analysisId": "analysis_456"
      }
    }
  ]
}
```

### **PUT /api/notifications/[id]/read**
Marca notificação como lida.

**Response:**
```json
{
  "message": "Notificação marcada como lida"
}
```

### **PUT /api/notifications/mark-all-read**
Marca todas as notificações como lidas.

**Response:**
```json
{
  "message": "Todas as notificações foram marcadas como lidas",
  "count": 5
}
```

## 👑 APIs Administrativas

### **GET /api/admin/users**
Lista usuários (admin only).

**Query Parameters:**
- `page` (optional): Número da página
- `limit` (optional): Itens por página
- `search` (optional): Buscar por nome ou email
- `isActive` (optional): Filtrar por status

**Response:**
```json
{
  "data": [
    {
      "id": "user_123",
      "clerkId": "user_2abc123",
      "email": "user@example.com",
      "name": "João Silva",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "creditBalance": {
        "creditsRemaining": 150
      },
      "stats": {
        "totalPortfolios": 3,
        "totalAnalyses": 8,
        "creditsUsed": 80
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### **GET /api/admin/analytics**
Analytics gerais da plataforma.

**Response:**
```json
{
  "users": {
    "total": 150,
    "active": 142,
    "newThisMonth": 23
  },
  "portfolios": {
    "total": 450,
    "analyzedThisMonth": 89
  },
  "credits": {
    "consumed": 12500,
    "remaining": 45000
  },
  "revenue": {
    "thisMonth": 2500.00,
    "lastMonth": 2100.00
  }
}
```

### **GET /api/admin/settings**
Configurações administrativas.

**Response:**
```json
{
  "featureCosts": {
    "AI_TEXT_CHAT": 1,
    "AI_IMAGE_GENERATION": 5,
    "FII_PORTFOLIO_ANALYSIS": 10,
    "FII_INVESTMENT_RECOMMENDATION": 15
  },
  "plans": [
    {
      "id": "plan_123",
      "clerkId": "cplan_abc123",
      "name": "Básico",
      "credits": 100,
      "active": true,
      "priceMonthlyCents": 2900
    }
  ]
}
```

### **PUT /api/admin/settings**
Atualiza configurações administrativas.

**Request Body:**
```json
{
  "featureCosts": {
    "FII_PORTFOLIO_ANALYSIS": 12,
    "FII_INVESTMENT_RECOMMENDATION": 18
  }
}
```

## 📝 Webhooks

### **POST /api/webhooks/clerk**
Webhook do Clerk para sincronização de usuários.

**Headers:**
```http
svix-id: <webhook_id>
svix-timestamp: <timestamp>
svix-signature: <signature>
```

**Events Suportados:**
- `user.created`: Novo usuário criado
- `user.updated`: Usuário atualizado
- `user.deleted`: Usuário deletado
- `subscription.created`: Nova assinatura
- `subscription.updated`: Assinatura atualizada

## ⚠️ Códigos de Erro

### **400 - Bad Request**
```json
{
  "error": "Dados de entrada inválidos",
  "details": {
    "field": "email",
    "message": "Email é obrigatório"
  }
}
```

### **401 - Unauthorized**
```json
{
  "error": "Token de autenticação inválido ou expirado"
}
```

### **403 - Forbidden**
```json
{
  "error": "Acesso negado. Permissões insuficientes."
}
```

### **404 - Not Found**
```json
{
  "error": "Recurso não encontrado"
}
```

### **429 - Too Many Requests**
```json
{
  "error": "Limite de requisições excedido",
  "retryAfter": 60
}
```

### **500 - Internal Server Error**
```json
{
  "error": "Erro interno do servidor"
}
```

## 🔧 Rate Limiting

### **Limites por Endpoint**
- APIs públicas: 100 req/min por IP
- APIs autenticadas: 1000 req/min por usuário
- APIs administrativas: 500 req/min por admin
- Upload de arquivos: 10 req/min por usuário

### **Headers de Rate Limit**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 📚 SDKs e Clientes

### **JavaScript/TypeScript**
```typescript
import { FiiAIClient } from '@fii-ai/sdk';

const client = new FiiAIClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.fii-ai.com'
});

// Criar portfólio
const portfolio = await client.portfolios.create({
  file: portfolioFile,
  name: 'Meu Portfólio'
});

// Analisar portfólio
const analysis = await client.analysis.create({
  portfolioId: portfolio.id,
  analysisType: 'PORTFOLIO_EVALUATION'
});
```

---
**Próximos Passos:** Consulte [Sistema de Créditos](./sistema-creditos.md) para entender a cobrança por uso.