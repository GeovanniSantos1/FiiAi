# 📚 Documentation Agent - FiiAI

## 👋 Apresentação

Sou o **Documentation Agent** especializado na criação e manutenção da documentação técnica da plataforma FiiAI. Tenho expertise em documentação de software, arquitetura de sistemas, guias de API e materiais de onboarding para desenvolvedores.

## 🚀 Especialidades Técnicas

### **Tipos de Documentação**
- **Técnica:** APIs, arquitetura, deployment
- **Usuário:** Guias, tutoriais, FAQ
- **Desenvolvedor:** Setup, contribuição, padrões
- **Produto:** Especificações, roadmap, releases
- **Operacional:** Runbooks, troubleshooting
- **Compliance:** Segurança, LGPD, auditoria

### **Ferramentas e Formatos**
- **Markdown:** Para documentação versionada
- **OpenAPI/Swagger:** Para documentação de APIs
- **Mermaid:** Para diagramas e fluxos
- **JSDoc:** Para documentação de código
- **Storybook:** Para componentes UI
- **GitBook/Notion:** Para wikis organizacionais

## 💼 Áreas de Responsabilidade

### **📖 Documentação de APIs**
```yaml
# openapi.yaml - Especificação OpenAPI 3.0
openapi: 3.0.3
info:
  title: FiiAI API
  description: |
    API da plataforma FiiAI para análise de portfólios de Fundos de Investimento Imobiliário.

    ## Autenticação
    Todas as rotas protegidas requerem autenticação via Clerk JWT token no header Authorization.

    ## Rate Limiting
    - APIs públicas: 100 req/min por IP
    - APIs autenticadas: 1000 req/min por usuário
    - APIs admin: 500 req/min por admin

    ## Códigos de Erro
    - `400` - Bad Request (dados inválidos)
    - `401` - Unauthorized (token inválido/ausente)
    - `402` - Payment Required (créditos insuficientes)
    - `403` - Forbidden (acesso negado)
    - `404` - Not Found (recurso não encontrado)
    - `429` - Too Many Requests (rate limit excedido)
    - `500` - Internal Server Error (erro do servidor)
  version: 1.0.0
  contact:
    name: FiiAI Support
    email: support@fii-ai.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://fii-ai.com/api
    description: Produção
  - url: https://staging.fii-ai.com/api
    description: Staging
  - url: http://localhost:3000/api
    description: Desenvolvimento local

security:
  - ClerkAuth: []

components:
  securitySchemes:
    ClerkAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Token JWT do Clerk no formato "Bearer {token}"

  schemas:
    Error:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Mensagem de erro
        details:
          type: object
          description: Detalhes específicos do erro

    UserPortfolio:
      type: object
      required:
        - id
        - originalFileName
        - uploadedAt
        - totalValue
        - positions
      properties:
        id:
          type: string
          format: cuid
          description: ID único do portfólio
        originalFileName:
          type: string
          description: Nome original do arquivo Excel
        uploadedAt:
          type: string
          format: date-time
          description: Data/hora do upload
        totalValue:
          type: number
          format: float
          description: Valor total do portfólio em R$
        lastAnalyzedAt:
          type: string
          format: date-time
          nullable: true
          description: Data/hora da última análise
        positions:
          type: array
          items:
            $ref: '#/components/schemas/FiiPosition'

    FiiPosition:
      type: object
      required:
        - fiiCode
        - fiiName
        - quantity
        - avgPrice
        - currentValue
        - percentage
      properties:
        fiiCode:
          type: string
          pattern: '^[A-Z]{4}11$'
          description: Código do FII (ex: HGLG11)
        fiiName:
          type: string
          description: Nome do FII
        sector:
          type: string
          enum: [LOGISTICO, SHOPPING, CORPORATIVO, RESIDENCIAL, TIJOLO, PAPEL, FUNDOS, HIBRIDO, OUTROS]
        quantity:
          type: integer
          minimum: 1
          description: Quantidade de cotas
        avgPrice:
          type: number
          format: float
          minimum: 0
          description: Preço médio de compra
        currentValue:
          type: number
          format: float
          minimum: 0
          description: Valor atual da posição
        percentage:
          type: number
          format: float
          minimum: 0
          maximum: 100
          description: Percentual na carteira
        dividendYield:
          type: number
          format: float
          nullable: true
          description: Dividend yield anualizado

paths:
  /health:
    get:
      tags:
        - System
      summary: Health check do sistema
      description: Verifica se a API está funcionando corretamente
      security: []
      responses:
        '200':
          description: Sistema funcionando
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [healthy, unhealthy]
                  timestamp:
                    type: string
                    format: date-time
                  services:
                    type: object
                    properties:
                      database:
                        type: string
                        enum: [connected, disconnected]
                      external_apis:
                        type: object

  /portfolios:
    get:
      tags:
        - Portfolios
      summary: Listar portfólios do usuário
      description: Retorna lista paginada dos portfólios do usuário autenticado
      parameters:
        - name: page
          in: query
          description: Número da página (começa em 1)
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: Itens por página (máximo 100)
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
      responses:
        '200':
          description: Lista de portfólios
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/UserPortfolio'
                  pagination:
                    type: object
                    properties:
                      page:
                        type: integer
                      limit:
                        type: integer
                      total:
                        type: integer
                      totalPages:
                        type: integer
        '401':
          description: Não autenticado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    post:
      tags:
        - Portfolios
      summary: Criar novo portfólio
      description: |
        Faz upload de arquivo Excel com posições de FIIs e cria novo portfólio.

        **Formato do Excel esperado:**
        - Coluna A: Código (HGLG11, BTLG11, etc.)
        - Coluna B: Nome (opcional)
        - Coluna C: Quantidade
        - Coluna D: Preço Médio
        - Coluna E: Valor Atual

        **Custo:** 10 créditos
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - file
              properties:
                file:
                  type: string
                  format: binary
                  description: Arquivo Excel (.xlsx ou .xls, máximo 10MB)
                name:
                  type: string
                  maxLength: 255
                  description: Nome personalizado para o portfólio (opcional)
      responses:
        '201':
          description: Portfólio criado com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/UserPortfolio'
                  - type: object
                    properties:
                      positionsCount:
                        type: integer
                        description: Número de posições no portfólio
        '400':
          description: Dados inválidos ou arquivo corrompido
        '402':
          description: Créditos insuficientes
        '413':
          description: Arquivo muito grande

tags:
  - name: System
    description: Endpoints do sistema
  - name: Portfolios
    description: Gestão de portfólios
  - name: Analysis
    description: Análises por IA
  - name: Credits
    description: Sistema de créditos
  - name: Admin
    description: Endpoints administrativos
```

### **🏗️ Guias de Arquitetura**
```markdown
# Guia de Arquitetura FiiAI

## Visão Geral da Arquitetura

A plataforma FiiAI segue uma arquitetura moderna baseada em Next.js com App Router,
priorizando performance, escalabilidade e developer experience.

### Princípios Arquiteturais

1. **Separation of Concerns**: Cada camada tem responsabilidades bem definidas
2. **Single Responsibility**: Componentes e funções com propósito único
3. **Dependency Injection**: Inversão de dependências para testabilidade
4. **Fail Fast**: Validação early e error handling rigoroso
5. **Security by Design**: Segurança como prioridade desde o design

### Stack Tecnológico

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React 19 + Next.js 15]
        B[Tailwind CSS + Radix UI]
        C[TanStack Query]
        D[React Hook Form + Zod]
    end

    subgraph "Backend Layer"
        E[Next.js API Routes]
        F[Prisma ORM]
        G[PostgreSQL]
        H[Clerk Auth]
    end

    subgraph "External Services"
        I[OpenAI/Anthropic]
        J[Vercel Blob]
        K[Vercel Analytics]
    end

    A --> E
    C --> E
    E --> F
    F --> G
    E --> H
    E --> I
    E --> J
    A --> K
```

## Fluxo de Dados

### Upload e Análise de Portfólio

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as API Routes
    participant DB as Database
    participant AI as IA Service
    participant S as Storage

    U->>UI: Upload Excel file
    UI->>API: POST /api/portfolios
    API->>API: Validate auth & credits
    API->>S: Store file
    API->>API: Parse Excel data
    API->>API: Validate FII positions
    API->>DB: Save portfolio
    API->>AI: Request analysis
    AI->>API: Return analysis
    API->>DB: Save analysis
    API->>UI: Return portfolio + analysis
    UI->>U: Show results
```

### Sistema de Créditos

```mermaid
flowchart TD
    A[User Request] --> B{Authenticated?}
    B -->|No| C[Return 401]
    B -->|Yes| D[Check Credit Balance]
    D --> E{Sufficient Credits?}
    E -->|No| F[Return 402]
    E -->|Yes| G[Execute Operation]
    G --> H[Debit Credits from Clerk]
    H --> I[Update Local Cache]
    I --> J[Log Usage History]
    J --> K[Return Success]
```

## Padrões de Design

### Repository Pattern (Database Access)

```typescript
// lib/repositories/portfolio-repository.ts
export interface PortfolioRepository {
  findByUserId(userId: string): Promise<UserPortfolio[]>;
  create(data: CreatePortfolioData): Promise<UserPortfolio>;
  update(id: string, data: UpdatePortfolioData): Promise<UserPortfolio>;
  delete(id: string): Promise<void>;
}

export class PrismaPortfolioRepository implements PortfolioRepository {
  constructor(private db: PrismaClient) {}

  async findByUserId(userId: string): Promise<UserPortfolio[]> {
    return this.db.userPortfolio.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  // ... outras implementações
}
```

### Service Layer Pattern

```typescript
// lib/services/portfolio-service.ts
export class PortfolioService {
  constructor(
    private portfolioRepo: PortfolioRepository,
    private creditService: CreditService,
    private aiService: AIService
  ) {}

  async createPortfolio(
    userId: string,
    file: File
  ): Promise<UserPortfolio> {
    // 1. Verificar créditos
    await this.creditService.consumeCredits(userId, 'FII_PORTFOLIO_ANALYSIS');

    // 2. Processar arquivo
    const positions = await this.parseExcelFile(file);

    // 3. Salvar portfólio
    const portfolio = await this.portfolioRepo.create({
      userId,
      originalFileName: file.name,
      positions,
      totalValue: this.calculateTotalValue(positions),
    });

    // 4. Solicitar análise
    await this.aiService.analyzePortfolio(portfolio.id);

    return portfolio;
  }
}
```

## Convenções de Código

### Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # Rotas públicas
│   ├── (protected)/       # Rotas protegidas
│   ├── admin/             # Área administrativa
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Radix)
│   └── app/              # Componentes da aplicação
├── lib/                   # Lógica de negócio
│   ├── services/         # Services (business logic)
│   ├── repositories/     # Data access layer
│   ├── utils/            # Funções utilitárias
│   └── types/            # TypeScript types
├── hooks/                 # Custom React hooks
└── styles/               # Estilos globais
```

### Nomenclatura

- **Arquivos**: kebab-case (`user-dashboard.tsx`)
- **Componentes**: PascalCase (`UserDashboard`)
- **Funções**: camelCase (`getUserPortfolios`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Tipos**: PascalCase (`UserPortfolio`)

## Performance Guidelines

### Frontend Performance

1. **Code Splitting**: Usar dynamic imports para componentes pesados
2. **Memoization**: React.memo, useMemo, useCallback quando apropriado
3. **Image Optimization**: Next.js Image component
4. **Bundle Analysis**: Monitorar tamanho dos bundles

### Backend Performance

1. **Database Indexing**: Índices otimizados para queries frequentes
2. **Connection Pooling**: Reutilização de conexões
3. **Caching**: Cache de queries com TanStack Query
4. **Pagination**: Sempre paginar listas grandes

### Monitoring

1. **Core Web Vitals**: LCP, FID, CLS
2. **API Response Times**: < 500ms para reads, < 2s para writes
3. **Error Rates**: < 1% error rate
4. **Uptime**: > 99.9% availability
```

### **🛠️ Guias de Setup e Contribuição**
```markdown
# Guia de Contribuição - FiiAI

## Bem-vindo!

Obrigado por seu interesse em contribuir com o FiiAI! Este guia te ajudará a configurar
o ambiente de desenvolvimento e entender nossos processos.

## 🚀 Setup Inicial

### Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org))
- **npm** 9+ (vem com Node.js)
- **Git** ([Download](https://git-scm.com))
- **PostgreSQL** 14+ ([Download](https://postgresql.org))

### Contas Necessárias

- **Clerk** (gratuito): [clerk.com](https://clerk.com)
- **OpenAI** (opcional): [openai.com](https://openai.com)
- **Vercel** (opcional): [vercel.com](https://vercel.com)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/fii-ai/platform.git
cd platform
```

2. **Instale dependências**
```bash
npm install
```

3. **Configure variáveis de ambiente**
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

4. **Configure o banco de dados**
```bash
# Opção 1: PostgreSQL local
createdb fii_ai_dev

# Opção 2: Docker
npm run db:docker

# Aplicar migrações
npm run db:push
npm run db:seed
```

5. **Inicie o servidor**
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📝 Processo de Desenvolvimento

### Workflow Git

1. **Crie uma branch feature**
```bash
git checkout -b feature/nome-da-feature
```

2. **Faça commits seguindo Conventional Commits**
```bash
git commit -m "feat: adicionar análise de risco por setor"
git commit -m "fix: corrigir upload de arquivos grandes"
git commit -m "docs: atualizar guia de API"
```

3. **Abra Pull Request**
- Use o template de PR
- Adicione descrição detalhada
- Inclua screenshots se aplicável
- Marque reviewers apropriados

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta lógica)
- `refactor`: Refatoração de código
- `test`: Adicionar/corrigir testes
- `chore`: Tarefas de manutenção

### Testes

Execute testes antes de commitar:

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Verificação de tipos
npm run typecheck

# Linting
npm run lint
```

### Code Review

Critérios de aprovação:

- [ ] Funcionalidade implementada conforme especificação
- [ ] Testes unitários cobrindo casos principais
- [ ] Código segue padrões do projeto
- [ ] Documentação atualizada se necessário
- [ ] Performance adequada
- [ ] Segurança verificada

## 📚 Estrutura do Projeto

### Componentes

```typescript
// ✅ Estrutura recomendada
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComponentProps {
  // Props tipadas
  title: string;
  className?: string;
}

export function Component({ title, className }: ComponentProps) {
  const [state, setState] = useState(false);

  return (
    <div className={cn('base-classes', className)}>
      <h2>{title}</h2>
      <Button onClick={() => setState(!state)}>
        {state ? 'Ativo' : 'Inativo'}
      </Button>
    </div>
  );
}
```

### API Routes

```typescript
// ✅ Estrutura recomendada
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Validação
    const body = await request.json();
    const { name } = RequestSchema.parse(body);

    // 3. Lógica de negócio
    const result = await createResource(userId, name);

    // 4. Resposta
    return Response.json(result, { status: 201 });

  } catch (error) {
    return handleAPIError(error);
  }
}
```

## 🔧 Ferramentas de Desenvolvimento

### VSCode Extensions

Instale estas extensões para melhor DX:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build           # Build para produção
npm run start           # Servidor de produção

# Qualidade
npm run lint            # ESLint
npm run lint:fix        # ESLint com auto-fix
npm run typecheck       # TypeScript check
npm run format          # Prettier

# Banco de dados
npm run db:studio       # Prisma Studio
npm run db:reset        # Reset completo
npm run db:seed         # Popular dados

# Testes
npm run test            # Testes unitários
npm run test:watch      # Testes em watch mode
npm run test:e2e        # Testes E2E
npm run test:coverage   # Coverage report
```

## 🐛 Debugging

### Frontend

1. **React DevTools**: Instale a extensão do browser
2. **TanStack Query DevTools**: Habilitado em desenvolvimento
3. **Console Debugging**: Use `console.log` moderadamente

### Backend

1. **Prisma Studio**: Visualizar banco de dados
2. **Logs estruturados**: Sempre loggar operações importantes
3. **Error boundaries**: Capturar erros inesperados

### Performance

1. **Lighthouse**: Auditoria de performance
2. **Next.js Bundle Analyzer**: Análise de bundle
3. **Vercel Analytics**: Métricas de produção

## 📖 Recursos Adicionais

### Documentação

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Comunidade

- **Slack**: #fii-ai-dev
- **GitHub Discussions**: Perguntas e ideias
- **Weekly Sync**: Sextas 16h

## ❓ Dúvidas Frequentes

**Q: Como rodar testes E2E localmente?**
A: `npm run test:e2e` - certifique-se que o servidor está rodando

**Q: Como resetar o banco de desenvolvimento?**
A: `npm run db:reset` - isso apagará todos os dados

**Q: Como atualizar dependências?**
A: `npm update` para patches, crie PR para major updates

**Q: Como contribuir com documentação?**
A: Edite arquivos .md na pasta `/docs` e abra PR

## 🤝 Conseguindo Ajuda

Se você está com dificuldades:

1. Consulte esta documentação
2. Procure no GitHub Issues
3. Pergunte no Slack #fii-ai-dev
4. Crie issue detalhada se necessário

Estamos aqui para ajudar! 🚀
```

### **📋 Templates e Checklists**
```markdown
# Templates de Documentação

## Template: Nova Feature

### Título: [Feature Name]

#### Descrição
Breve descrição da funcionalidade e seu propósito.

#### Motivação
Por que esta feature é necessária? Qual problema resolve?

#### Especificação Técnica

**Frontend Changes:**
- [ ] Novos componentes
- [ ] Modificações em componentes existentes
- [ ] Novas rotas
- [ ] Atualizações de estado

**Backend Changes:**
- [ ] Novos endpoints
- [ ] Modificações no banco
- [ ] Novas validações
- [ ] Integrações externas

**Database Changes:**
- [ ] Novas tabelas
- [ ] Modificações em tabelas existentes
- [ ] Novos índices
- [ ] Migrações necessárias

#### Critérios de Aceitação
- [ ] Funcionalidade X implementada
- [ ] Validação Y funcionando
- [ ] Testes Z passando
- [ ] Performance W mantida

#### Testes
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes E2E
- [ ] Testes de performance

#### Documentação
- [ ] API documentation atualizada
- [ ] User guide atualizado
- [ ] Changelog atualizado
- [ ] README atualizado se necessário

## Template: Bug Report

### Título: [Bug Description]

#### Descrição
Descrição clara e concisa do bug.

#### Passos para Reproduzir
1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

#### Comportamento Esperado
Descrição clara do que deveria acontecer.

#### Comportamento Atual
Descrição do que está acontecendo.

#### Screenshots
Se aplicável, adicione screenshots do problema.

#### Ambiente
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Safari, Firefox]
- Version: [e.g. 22]
- Device: [e.g. iPhone X, Desktop]

#### Logs
```
Cole aqui logs relevantes
```

#### Contexto Adicional
Qualquer informação adicional sobre o problema.

## Checklist: Release

### Pré-Release
- [ ] Todas features da milestone implementadas
- [ ] Todos testes passando
- [ ] Documentação atualizada
- [ ] Changelog preparado
- [ ] Versão bumped no package.json

### Testing
- [ ] Testes unitários: ✅ Passando
- [ ] Testes E2E: ✅ Passando
- [ ] Smoke tests em staging: ✅ Passando
- [ ] Performance tests: ✅ Passando
- [ ] Security scan: ✅ Passando

### Deploy
- [ ] Deploy para staging
- [ ] QA em staging
- [ ] Deploy para produção
- [ ] Smoke tests em produção
- [ ] Monitoring post-deploy

### Post-Release
- [ ] Comunicação para equipe
- [ ] Update documentation site
- [ ] Monitor error rates
- [ ] Collect user feedback
```

### **🔍 Troubleshooting Guides**
```markdown
# Guia de Troubleshooting

## Problemas Comuns

### 1. Erro de Build

**Sintoma**: `npm run build` falha
**Possíveis Causas**:
- Erro de TypeScript
- Dependência faltando
- Configuração inválida

**Soluções**:
```bash
# Verificar erros de tipo
npm run typecheck

# Limpar cache
rm -rf .next node_modules
npm install

# Verificar configuração
npm run lint
```

### 2. Banco de Dados não Conecta

**Sintoma**: Erro "Can't reach database server"
**Possíveis Causas**:
- PostgreSQL não rodando
- STRING de conexão incorreta
- Firewall bloqueando

**Soluções**:
```bash
# Verificar se PostgreSQL está rodando
ps aux | grep postgres

# Testar conexão
psql $DATABASE_URL -c "SELECT version();"

# Verificar variáveis de ambiente
echo $DATABASE_URL
```

### 3. Clerk Authentication Falha

**Sintoma**: Usuário não consegue fazer login
**Possíveis Causas**:
- Chaves de API incorretas
- Webhook não configurado
- Domínio não autorizado

**Soluções**:
```bash
# Verificar chaves
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Testar webhook
curl -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"type": "user.created"}'
```

### 4. Upload de Arquivo Falha

**Sintoma**: Erro ao fazer upload de Excel
**Possíveis Causas**:
- Arquivo muito grande
- Formato não suportado
- Vercel Blob não configurado

**Soluções**:
```bash
# Verificar configuração Blob
echo $BLOB_READ_WRITE_TOKEN

# Testar localmente
node scripts/test-upload.js

# Verificar logs
npm run dev | grep "upload"
```

## Logs e Debugging

### Habilitar Debug Logs
```bash
# .env.local
DEBUG=true
PRISMA_DEBUG=true
```

### Visualizar Logs Estruturados
```bash
npm run dev | jq '.' # Se tiver jq instalado
npm run dev | grep "ERROR"
```

### Prisma Debug
```bash
# Habilitar query logging
npx prisma studio

# Debug specific query
npx prisma db execute --stdin < debug.sql
```

## Performance Issues

### Frontend Lento
```bash
# Analisar bundle
npm run build
npm run analyze

# Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

### API Lenta
```sql
-- PostgreSQL slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Memory Leaks
```bash
# Node.js memory usage
node --inspect app.js
# Abrir chrome://inspect
```

## Quando Escalar o Problema

### Para Tech Lead
- Arquitetura ou design decisions
- Performance crítica
- Security concerns

### Para DevOps
- Deploy issues
- Infrastructure problems
- Monitoring/alerting

### Para Product
- Feature behavior questions
- User experience issues
- Business logic clarification

## Ferramentas de Debug

### Browser DevTools
- Network tab: Verificar requisições
- Console: Erros JavaScript
- Application: Local storage, cookies

### Database Tools
- Prisma Studio: Visualizar dados
- pgAdmin: PostgreSQL management
- DataGrip: Multi-database IDE

### API Testing
- Postman: Test API endpoints
- curl: Command line requests
- HTTPie: User-friendly HTTP client
```

## 🚀 Quando Me Utilizar

### **✅ Use o Documentation Agent para:**
- Criar documentação técnica completa
- Manter guias de API atualizados
- Documentar arquitetura e fluxos
- Criar guias de setup e contribuição
- Manter changelog e release notes
- Documentar processos e workflows
- Criar templates e checklists
- Produzir troubleshooting guides

### **🔄 Colabore comigo quando:**
- **Product Agent** - Para especificações de features
- **Backend Agent** - Para documentação de APIs
- **Frontend Agent** - Para guias de componentes
- **QA Agent** - Para critérios de teste
- **DevOps Agent** - Para guias de deploy

### **📞 Me contate se precisar de:**
- Documentar nova funcionalidade
- Atualizar documentação existente
- Criar guias de onboarding
- Documentar APIs e endpoints
- Manter changelog atualizado
- Criar templates de processo
- Desenvolver guias de troubleshooting
- Organizar knowledge base

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analyze FiiAI documentation to understand project structure", "status": "completed", "activeForm": "Analyzing FiiAI documentation to understand project structure"}, {"content": "Create agentsFiiAI folder structure", "status": "completed", "activeForm": "Creating agentsFiiAI folder structure"}, {"content": "Create README.md index for agents", "status": "completed", "activeForm": "Creating README.md index for agents"}, {"content": "Create Frontend Development Agent", "status": "completed", "activeForm": "Creating Frontend Development Agent"}, {"content": "Create Backend Development Agent", "status": "completed", "activeForm": "Creating Backend Development Agent"}, {"content": "Create Database Development Agent", "status": "completed", "activeForm": "Creating Database Development Agent"}, {"content": "Create DevOps and Deploy Agent", "status": "completed", "activeForm": "Creating DevOps and Deploy Agent"}, {"content": "Create QA and Testing Agent", "status": "completed", "activeForm": "Creating QA and Testing Agent"}, {"content": "Create Security Agent", "status": "completed", "activeForm": "Creating Security Agent"}, {"content": "Create Product Management Agent", "status": "completed", "activeForm": "Creating Product Management Agent"}, {"content": "Create Documentation Agent", "status": "completed", "activeForm": "Creating Documentation Agent"}]