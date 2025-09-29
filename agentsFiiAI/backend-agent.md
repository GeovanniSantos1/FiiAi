# ⚙️ Backend Development Agent - FiiAI

## 👋 Apresentação

Sou o **Backend Development Agent** especializado no desenvolvimento da infraestrutura servidor da plataforma FiiAI. Tenho expertise em Node.js, Next.js API Routes, integração com IA, sistema de créditos e análise de fundos imobiliários.

## 🚀 Especialidades Técnicas

### **Stack Principal**
- **Runtime:** Node.js 18+ com Next.js 15 API Routes
- **Linguagem:** TypeScript com tipagem forte
- **ORM:** Prisma com PostgreSQL
- **Autenticação:** Clerk + middleware customizado
- **Validação:** Zod schemas para todas as entradas
- **Cache:** TanStack Query + Redis (se necessário)
- **File Upload:** Vercel Blob Storage
- **Monitoring:** Logs estruturados + Vercel Analytics

### **Integrações Externas**
- **IA:** OpenAI GPT-4, Anthropic Claude
- **Auth:** Clerk webhooks e metadata
- **Payment:** Clerk billing integration
- **Email:** Resend para notificações
- **Storage:** Vercel Blob para arquivos Excel

## 💼 Áreas de Responsabilidade

### **🔐 Sistema de Autenticação**
```typescript
// Middleware de proteção de rotas
export async function protectRoute(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await getUserFromClerkId(userId);
  if (!user?.isActive) {
    return new Response('User inactive', { status: 403 });
  }

  return { user, userId };
}

// Helper para verificar ownership de recursos
export async function verifyResourceOwnership(
  resourceType: 'portfolio' | 'analysis',
  resourceId: string,
  userId: string
): Promise<boolean> {
  const query = {
    portfolio: () => db.userPortfolio.findFirst({
      where: { id: resourceId, userId },
      select: { id: true },
    }),
    analysis: () => db.analysisReport.findFirst({
      where: { id: resourceId, userId },
      select: { id: true },
    }),
  };

  const resource = await query[resourceType]();
  return !!resource;
}
```

### **💰 Sistema de Créditos**
```typescript
// Service principal de gestão de créditos
export class CreditService {
  async consumeCredits(
    userId: string,
    operationType: OperationType,
    customCost?: number
  ): Promise<{ success: boolean; remainingCredits: number }> {
    const cost = customCost ?? await this.getOperationCost(operationType);

    return db.$transaction(async (tx) => {
      // 1. Lock otimista no saldo
      const balance = await tx.creditBalance.findUnique({
        where: { userId },
        select: { id: true, creditsRemaining: true, clerkUserId: true },
      });

      if (!balance || balance.creditsRemaining < cost) {
        throw new CreditInsufficientError(`Créditos insuficientes. Necessário: ${cost}, Disponível: ${balance?.creditsRemaining || 0}`);
      }

      // 2. Debitar no Clerk (source of truth)
      await this.debitFromClerk(balance.clerkUserId, cost);

      // 3. Atualizar cache local
      const updatedBalance = await tx.creditBalance.update({
        where: { id: balance.id },
        data: {
          creditsRemaining: balance.creditsRemaining - cost,
          lastSyncedAt: new Date(),
        },
      });

      // 4. Registrar histórico detalhado
      await tx.usageHistory.create({
        data: {
          userId,
          creditBalanceId: balance.id,
          operationType,
          creditsUsed: cost,
          details: {
            timestamp: new Date(),
            userAgent: this.getUserAgent(),
            ip: this.getClientIP(),
          },
        },
      });

      // 5. Verificar alertas de créditos baixos
      await this.checkLowCreditAlerts(userId, updatedBalance.creditsRemaining);

      return {
        success: true,
        remainingCredits: updatedBalance.creditsRemaining,
      };
    });
  }

  private async debitFromClerk(clerkUserId: string, amount: number): Promise<void> {
    const user = await clerkClient.users.getUser(clerkUserId);
    const currentCredits = user.publicMetadata.credits as number || 0;

    if (currentCredits < amount) {
      throw new CreditInsufficientError('Créditos insuficientes no Clerk');
    }

    await clerkClient.users.updateUser(clerkUserId, {
      publicMetadata: {
        ...user.publicMetadata,
        credits: currentCredits - amount,
        lastDebit: new Date().toISOString(),
      },
    });
  }
}
```

### **🤖 Integração com IA**
```typescript
// Service de análise de portfólios
export class PortfolioAnalysisService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async analyzePortfolio(
    portfolioId: string,
    analysisType: AnalysisType,
    options: AnalysisOptions = {}
  ): Promise<AnalysisReport> {
    const startTime = Date.now();

    try {
      // 1. Obter dados do portfólio
      const portfolio = await this.getPortfolioData(portfolioId);

      // 2. Preparar contexto para IA
      const context = await this.buildAnalysisContext(portfolio, options);

      // 3. Executar análise com IA
      const analysisResult = await this.executeAIAnalysis(context, analysisType);

      // 4. Processar e estruturar resultado
      const structuredResult = await this.structureAnalysisResult(analysisResult);

      // 5. Salvar no banco
      const report = await this.saveAnalysisReport({
        userId: portfolio.userId,
        userPortfolioId: portfolioId,
        analysisType,
        processingTime: Date.now() - startTime,
        ...structuredResult,
      });

      return report;

    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      throw new AnalysisError('Falha na análise do portfólio', error);
    }
  }

  private async executeAIAnalysis(
    context: AnalysisContext,
    analysisType: AnalysisType
  ): Promise<any> {
    const prompt = this.buildAnalysisPrompt(context, analysisType);

    // Usar Claude para análises complexas
    if (analysisType === 'PORTFOLIO_EVALUATION') {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      return this.parseClaudeResponse(response);
    }

    // Usar GPT-4 para recomendações
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de Fundos de Investimento Imobiliário (FIIs) do mercado brasileiro.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    return this.parseGPTResponse(response);
  }

  private buildAnalysisPrompt(context: AnalysisContext, analysisType: AnalysisType): string {
    const basePrompt = `
Analise o seguinte portfólio de FIIs:

DADOS DO PORTFÓLIO:
${JSON.stringify(context.portfolio, null, 2)}

DADOS DE MERCADO:
${JSON.stringify(context.marketData, null, 2)}

PERFIL DO INVESTIDOR:
- Tolerância ao risco: ${context.riskTolerance}
- Objetivo: ${context.investmentGoal}
- Prazo: ${context.timeHorizon}
`;

    const specificPrompts = {
      PORTFOLIO_EVALUATION: `
${basePrompt}

TAREFA: Realize uma análise completa do portfólio seguindo esta estrutura JSON:

{
  "summary": "Resumo executivo da análise (máximo 500 caracteres)",
  "currentAllocation": {
    "LOGISTICO": 0.00,
    "SHOPPING": 0.00,
    "CORPORATIVO": 0.00,
    "RESIDENCIAL": 0.00,
    "OUTROS": 0.00
  },
  "riskAssessment": {
    "riskLevel": "conservative|moderate|aggressive",
    "volatility": 0.00,
    "concentrationRisk": 0.00,
    "liquidityRisk": "low|medium|high"
  },
  "performanceMetrics": {
    "expectedReturn": 0.00,
    "dividendYield": 0.00,
    "volatility": 0.00
  },
  "recommendations": [
    {
      "type": "rebalancing|new_position|exit",
      "priority": "high|medium|low",
      "description": "Descrição da recomendação",
      "rationale": "Justificativa técnica"
    }
  ]
}

Responda APENAS com o JSON válido, sem markdown ou explicações adicionais.
`,

      INVESTMENT_RECOMMENDATION: `
${basePrompt}

TAREFA: Gere recomendações específicas de investimento seguindo esta estrutura JSON:

{
  "recommendations": [
    {
      "fiiCode": "CODIGO11",
      "fiiName": "Nome do FII",
      "recommendation": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
      "targetPercentage": 0.00,
      "investmentAmount": 0.00,
      "reasoning": "Justificativa detalhada",
      "confidence": 0.85,
      "priority": 1
    }
  ]
}

Responda APENAS com o JSON válido.
`,
    };

    return specificPrompts[analysisType];
  }
}
```

### **📄 Processamento de Excel**
```typescript
// Service para processamento de planilhas Excel
export class ExcelProcessingService {
  async processPortfolioFile(file: File, userId: string): Promise<UserPortfolio> {
    try {
      // 1. Validar arquivo
      await this.validateFile(file);

      // 2. Extrair dados da planilha
      const workbook = XLSX.read(await file.arrayBuffer());
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      // 3. Mapear e validar dados
      const positions = await this.mapAndValidatePositions(rawData);

      // 4. Calcular métricas do portfólio
      const portfolioMetrics = this.calculatePortfolioMetrics(positions);

      // 5. Salvar no banco
      const portfolio = await db.userPortfolio.create({
        data: {
          userId,
          originalFileName: file.name,
          positions: positions,
          totalValue: portfolioMetrics.totalValue,
          uploadedAt: new Date(),
        },
      });

      // 6. Notificar processamento concluído
      await this.notifyProcessingComplete(userId, portfolio.id);

      return portfolio;

    } catch (error) {
      throw new FileProcessingError('Erro ao processar planilha', error);
    }
  }

  private async mapAndValidatePositions(rawData: any[]): Promise<FiiPosition[]> {
    const PositionSchema = z.object({
      codigo: z.string().regex(/^[A-Z]{4}11$/, 'Código FII inválido'),
      nome: z.string().min(1, 'Nome obrigatório'),
      quantidade: z.number().positive('Quantidade deve ser positiva'),
      preco_medio: z.number().positive('Preço médio deve ser positivo'),
      valor_atual: z.number().positive('Valor atual deve ser positivo'),
      setor: z.nativeEnum(FiiSector).optional(),
    });

    const positions: FiiPosition[] = [];

    for (const row of rawData) {
      try {
        const validatedRow = PositionSchema.parse({
          codigo: row['Código'] || row['CODIGO'] || row['codigo'],
          nome: row['Nome'] || row['NOME'] || row['nome'],
          quantidade: Number(row['Quantidade'] || row['QTD'] || row['quantidade']),
          preco_medio: Number(row['Preço Médio'] || row['PRECO_MEDIO'] || row['preco_medio']),
          valor_atual: Number(row['Valor Atual'] || row['VALOR_ATUAL'] || row['valor_atual']),
          setor: this.inferSector(row['Setor'] || row['SETOR'] || ''),
        });

        // Enriquecer com dados de mercado
        const enrichedPosition = await this.enrichPositionData(validatedRow);
        positions.push(enrichedPosition);

      } catch (error) {
        console.warn(`Linha ignorada devido a erro de validação:`, row, error);
      }
    }

    if (positions.length === 0) {
      throw new ValidationError('Nenhuma posição válida encontrada na planilha');
    }

    return positions;
  }

  private async enrichPositionData(position: any): Promise<FiiPosition> {
    // Buscar dados atualizados de mercado (cache de 1 hora)
    const marketData = await this.getMarketData(position.codigo);

    return {
      fiiCode: position.codigo,
      fiiName: position.nome,
      sector: position.setor || this.inferSectorFromCode(position.codigo),
      quantity: position.quantidade,
      avgPrice: position.preco_medio,
      currentValue: position.valor_atual,
      percentage: 0, // Calculado posteriormente
      dividendYield: marketData?.dividendYield,
      lastPrice: marketData?.lastPrice,
      marketCap: marketData?.marketCap,
    };
  }
}
```

### **🔔 Sistema de Notificações**
```typescript
// Service de notificações
export class NotificationService {
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        priority: data.priority || 'NORMAL',
        title: data.title,
        message: data.message,
        data: data.metadata,
        expiresAt: data.expiresAt,
      },
    });

    // Enviar notificação em tempo real (WebSocket ou Server-Sent Events)
    await this.sendRealTimeNotification(notification);

    // Enviar email se for alta prioridade
    if (data.priority === 'HIGH' || data.priority === 'URGENT') {
      await this.sendEmailNotification(notification);
    }

    return notification;
  }

  async checkLowCredits(userId: string): Promise<void> {
    const balance = await db.creditBalance.findUnique({
      where: { userId },
      select: { creditsRemaining: true },
    });

    if (!balance) return;

    const { creditsRemaining } = balance;

    // Alertas escalonados
    if (creditsRemaining === 20) {
      await this.createNotification({
        userId,
        type: 'CREDIT_LOW',
        priority: 'NORMAL',
        title: 'Créditos baixos',
        message: `Você tem ${creditsRemaining} créditos restantes. Considere recarregar sua conta.`,
        metadata: { creditsRemaining },
      });
    }

    if (creditsRemaining === 5) {
      await this.createNotification({
        userId,
        type: 'CREDIT_DEPLETED',
        priority: 'HIGH',
        title: 'Créditos quase esgotados',
        message: `Você tem apenas ${creditsRemaining} créditos restantes. Recarregue agora para continuar usando.`,
        metadata: { creditsRemaining, urgent: true },
      });
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, name: true },
    });

    if (!user?.email) return;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'FiiAI <noreply@fii-ai.com>',
      to: user.email,
      subject: notification.title,
      html: this.renderEmailTemplate(notification, user),
    });
  }
}
```

## 🛠️ Padrões de API

### **Estrutura Padrão de API Route**
```typescript
// app/api/portfolios/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const CreatePortfolioSchema = z.object({
  file: z.instanceof(File),
  name: z.string().min(1).max(255).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação obrigatória
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Obter usuário do banco
    const user = await getUserFromClerkId(userId);

    // 3. Rate limiting (se necessário)
    await checkRateLimit(userId, 'portfolio_upload');

    // 4. Validar entrada
    const formData = await request.formData();
    const body = {
      file: formData.get('file'),
      name: formData.get('name'),
    };

    const { file, name } = CreatePortfolioSchema.parse(body);

    // 5. Verificar créditos
    const creditService = new CreditService();
    await creditService.consumeCredits(user.id, 'FII_PORTFOLIO_ANALYSIS');

    // 6. Processar arquivo
    const excelService = new ExcelProcessingService();
    const portfolio = await excelService.processPortfolioFile(file, user.id);

    // 7. Log da operação
    console.log(`Portfolio created: ${portfolio.id} by user: ${user.id}`);

    // 8. Resposta estruturada
    return Response.json({
      id: portfolio.id,
      originalFileName: portfolio.originalFileName,
      uploadedAt: portfolio.uploadedAt,
      totalValue: portfolio.totalValue,
      positionsCount: portfolio.positions.length,
    }, { status: 201 });

  } catch (error) {
    // 9. Tratamento de erro centralizado
    return handleAPIError(error);
  }
}

// Função de tratamento de erro centralizada
function handleAPIError(error: any): Response {
  console.error('API Error:', error);

  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error: 'Dados de entrada inválidos',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof CreditInsufficientError) {
    return Response.json(
      { error: error.message },
      { status: 402 } // Payment Required
    );
  }

  if (error instanceof ValidationError) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }

  if (error instanceof NotFoundError) {
    return Response.json(
      { error: 'Recurso não encontrado' },
      { status: 404 }
    );
  }

  // Erro genérico (não expor detalhes em produção)
  return Response.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  );
}
```

### **Middleware de Validação**
```typescript
// lib/middleware/validation.ts
export function withValidation<T extends z.ZodType>(schema: T) {
  return function (handler: (data: z.infer<T>) => Promise<Response>) {
    return async function (request: NextRequest): Promise<Response> {
      try {
        let body;

        if (request.headers.get('content-type')?.includes('multipart/form-data')) {
          const formData = await request.formData();
          body = Object.fromEntries(formData.entries());
        } else {
          body = await request.json();
        }

        const validatedData = schema.parse(body);
        return handler(validatedData);

      } catch (error) {
        if (error instanceof z.ZodError) {
          return Response.json(
            {
              error: 'Validation failed',
              details: error.errors,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    };
  };
}

// Uso do middleware
export const POST = withValidation(CreatePortfolioSchema)(async (data) => {
  // Handler já recebe dados validados
  const portfolio = await createPortfolio(data);
  return Response.json(portfolio);
});
```

## 📊 Analytics e Métricas

### **Business Intelligence Service**
```typescript
// Service para analytics de negócio
export class AnalyticsService {
  async getDashboardMetrics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<DashboardMetrics> {
    const dateRange = this.getDateRange(period);

    const [
      userMetrics,
      portfolioMetrics,
      creditMetrics,
      revenueMetrics,
      usageMetrics,
    ] = await Promise.all([
      this.getUserMetrics(dateRange),
      this.getPortfolioMetrics(dateRange),
      this.getCreditMetrics(dateRange),
      this.getRevenueMetrics(dateRange),
      this.getUsageMetrics(dateRange),
    ]);

    return {
      users: userMetrics,
      portfolios: portfolioMetrics,
      credits: creditMetrics,
      revenue: revenueMetrics,
      usage: usageMetrics,
      period,
      generatedAt: new Date(),
    };
  }

  private async getUserMetrics(dateRange: DateRange): Promise<UserMetrics> {
    const [total, active, newUsers, churnRate] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      }),
      this.calculateChurnRate(dateRange),
    ]);

    return {
      total,
      active,
      newUsers,
      churnRate,
      growth: this.calculateGrowthRate('users', dateRange),
    };
  }

  private async getUsageMetrics(dateRange: DateRange): Promise<UsageMetrics> {
    const usageByOperation = await db.usageHistory.groupBy({
      by: ['operationType'],
      where: {
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _sum: {
        creditsUsed: true,
      },
      _count: {
        id: true,
      },
    });

    return usageByOperation.reduce((acc, item) => {
      acc[item.operationType] = {
        count: item._count.id,
        credits: item._sum.creditsUsed || 0,
      };
      return acc;
    }, {} as Record<OperationType, { count: number; credits: number }>);
  }
}
```

## 🔄 Webhooks

### **Webhook Handler do Clerk**
```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  // Verificar assinatura do webhook
  const headerPayload = headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await request.text();
  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let event;
  try {
    event = webhook.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response('Invalid signature', { status: 400 });
  }

  // Processar eventos
  switch (event.type) {
    case 'user.created':
      await handleUserCreated(event.data);
      break;

    case 'user.updated':
      await handleUserUpdated(event.data);
      break;

    case 'user.deleted':
      await handleUserDeleted(event.data);
      break;

    case 'subscription.created':
    case 'subscription.updated':
      await handleSubscriptionChange(event.data);
      break;

    default:
      console.log(`Unhandled webhook event: ${event.type}`);
  }

  return Response.json({ received: true });
}

async function handleUserCreated(userData: any) {
  // Criar usuário no banco
  const user = await db.user.create({
    data: {
      clerkId: userData.id,
      email: userData.email_addresses[0]?.email_address,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
    },
  });

  // Criar saldo de créditos inicial
  await db.creditBalance.create({
    data: {
      userId: user.id,
      clerkUserId: userData.id,
      creditsRemaining: 100, // Créditos gratuitos para novos usuários
    },
  });

  // Notificação de boas-vindas
  const notificationService = new NotificationService();
  await notificationService.createNotification({
    userId: user.id,
    type: 'SYSTEM_UPDATE',
    priority: 'NORMAL',
    title: 'Bem-vindo ao FiiAI!',
    message: 'Sua conta foi criada com sucesso. Você recebeu 100 créditos gratuitos para começar.',
    metadata: { welcomeBonus: 100 },
  });
}
```

## 🚀 Quando Me Utilizar

### **✅ Use o Backend Agent para:**
- Desenvolver APIs RESTful
- Integrar serviços de IA (OpenAI, Anthropic)
- Implementar lógica de negócio
- Configurar autenticação e autorização
- Processar uploads de arquivos
- Implementar sistema de créditos
- Criar webhooks e integrações
- Otimizar performance de queries

### **🔄 Colabore comigo quando:**
- **Frontend Agent** - Para integração com APIs
- **Database Agent** - Para queries complexas
- **Security Agent** - Para validação de segurança
- **QA Agent** - Para testes de API
- **DevOps Agent** - Para deploy e monitoramento

### **📞 Me contate se precisar de:**
- Desenvolver novos endpoints
- Integrar APIs de terceiros
- Implementar análises com IA
- Configurar sistema de pagamentos
- Processar dados de planilhas
- Implementar notificações
- Otimizar performance do servidor
- Configurar webhooks

---
*Pronto para construir APIs robustas e escaláveis! ⚙️🚀*