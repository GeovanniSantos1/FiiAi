# ⚙️ Configuração do Ambiente FiiAI

## 📋 Pré-requisitos

### **Software Necessário**
- **Node.js** 18.x ou superior
- **npm** 9.x ou superior
- **PostgreSQL** 14.x ou superior
- **Git** para controle de versão

### **Contas Externas**
- **Clerk** - Autenticação e gestão de usuários
- **OpenAI** - API para análises de IA (opcional)
- **Anthropic** - API Claude para análises (opcional)
- **Vercel** - Deploy e storage (recomendado)

## 🚀 Setup Inicial

### **1. Clone do Repositório**
```bash
# Clone o projeto
git clone https://github.com/seu-usuario/fii-ai.git
cd fii-ai

# Instale as dependências
npm install
```

### **2. Configuração do Banco de Dados**

**Opção A: PostgreSQL Local**
```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar usuário e banco
sudo -u postgres psql
CREATE USER fii_ai WITH PASSWORD 'sua_senha';
CREATE DATABASE fii_ai_dev OWNER fii_ai;
GRANT ALL PRIVILEGES ON DATABASE fii_ai_dev TO fii_ai;
\q

# Testar conexão
psql -h localhost -U fii_ai -d fii_ai_dev
```

**Opção B: Docker Compose**
```bash
# Usar o script automático
npm run db:docker

# Ou manualmente
docker-compose up postgres -d
```

**Opção C: Neon/Vercel Postgres (Recomendado)**
```bash
# Criar projeto na Vercel
npx vercel

# Adicionar PostgreSQL
npx vercel postgres
```

### **3. Variáveis de Ambiente**

**Copiar template:**
```bash
cp .env.example .env.local
```

**Configurar .env.local:**
```bash
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/fii_ai_dev"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# URLs do Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI APIs (Opcional)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

### **4. Setup do Banco de Dados**
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma db push

# Popular dados iniciais
npx prisma db seed
```

### **5. Verificar Instalação**
```bash
# Executar testes
npm run test

# Verificar tipos
npm run typecheck

# Verificar lint
npm run lint

# Iniciar desenvolvimento
npm run dev
```

## 🔐 Configuração do Clerk

### **1. Criar Conta no Clerk**
1. Acesse [clerk.com](https://clerk.com)
2. Crie uma conta gratuita
3. Crie um novo projeto

### **2. Configurar Aplicação**
```typescript
// Configurações no Dashboard Clerk:

// 1. URLs da aplicação
// Sign-in URL: http://localhost:3000/sign-in
// Sign-up URL: http://localhost:3000/sign-up
// Home URL: http://localhost:3000/dashboard

// 2. Webhook endpoints
// Endpoint URL: http://localhost:3000/api/webhooks/clerk
// Events: user.created, user.updated, user.deleted
```

### **3. Configurar Webhooks Locais**
```bash
# Instalar ngrok para desenvolvimento
npm install -g ngrok

# Expor aplicação local
ngrok http 3000

# Configurar webhook URL no Clerk
# https://your-ngrok-url.ngrok.io/api/webhooks/clerk
```

### **4. Configurar Metadata de Usuário**
```json
// No Clerk Dashboard > User & Authentication > Metadata

// Public metadata schema:
{
  "credits": {
    "type": "number",
    "default": 100
  },
  "plan": {
    "type": "string",
    "default": "basic"
  }
}
```

## 🤖 Configuração de APIs de IA

### **OpenAI Setup**
```bash
# 1. Criar conta em openai.com
# 2. Gerar API key
# 3. Adicionar ao .env.local
OPENAI_API_KEY="sk-..."

# 4. Configurar organização (opcional)
OPENAI_ORG_ID="org-..."
```

### **Anthropic Setup**
```bash
# 1. Criar conta em console.anthropic.com
# 2. Gerar API key
# 3. Adicionar ao .env.local
ANTHROPIC_API_KEY="sk-ant-..."
```

### **Teste das APIs**
```typescript
// scripts/test-ai-apis.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

async function testOpenAI() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
    max_tokens: 10,
  });

  console.log('OpenAI response:', response.choices[0].message.content);
}

async function testAnthropic() {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Hello!' }],
  });

  console.log('Anthropic response:', response.content);
}
```

## 💾 Configuração de Storage

### **Vercel Blob (Recomendado)**
```bash
# 1. Instalar CLI da Vercel
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Conectar projeto
vercel link

# 4. Criar Blob store
vercel blob create

# 5. Obter token e adicionar ao .env.local
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

### **AWS S3 (Alternativa)**
```bash
# Configurar AWS S3
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="fii-ai-storage"
```

### **Configuração Local (Desenvolvimento)**
```bash
# Criar pasta para uploads
mkdir -p uploads/portfolios
mkdir -p uploads/temp

# Configurar permissões
chmod 755 uploads/
```

## 📧 Configuração de Email (Opcional)

### **Resend (Recomendado)**
```bash
# 1. Criar conta em resend.com
# 2. Verificar domínio
# 3. Gerar API key
RESEND_API_KEY="re_..."

# 4. Configurar domínio
RESEND_FROM_EMAIL="noreply@seu-dominio.com"
```

### **SendGrid (Alternativa)**
```bash
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@seu-dominio.com"
```

## 🔧 Scripts de Desenvolvimento

### **Package.json Scripts**
```json
{
  "scripts": {
    "dev": "prisma generate && next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",

    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:docker": "node scripts/setup-postgres-docker.mjs",

    "setup": "npm run db:push && npm run db:seed",
    "clean": "rm -rf .next node_modules",
    "fresh": "npm run clean && npm install && npm run setup"
  }
}
```

### **Scripts Úteis**

**scripts/setup-dev.sh:**
```bash
#!/bin/bash
echo "🚀 Setting up FiiAI development environment..."

# Verificar Node.js
node_version=$(node --version)
echo "Node.js version: $node_version"

# Instalar dependências
echo "📦 Installing dependencies..."
npm install

# Setup do banco
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push
npx prisma db seed

# Verificar instalação
echo "🔍 Running checks..."
npm run typecheck
npm run lint

echo "✅ Setup complete! Run 'npm run dev' to start development"
```

**scripts/reset-dev.sh:**
```bash
#!/bin/bash
echo "🔄 Resetting development environment..."

# Reset do banco
npx prisma migrate reset --force

# Limpar cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstalar
npm ci
npx prisma generate
npx prisma db seed

echo "✅ Environment reset complete!"
```

## 🧪 Configuração de Testes

### **Jest Setup**
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    userId: 'user_test123',
  }),
  auth: () => Promise.resolve({ userId: 'user_test123' }),
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
```

### **Playwright E2E Setup**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 🐳 Docker Development

### **Dockerfile.dev**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Gerar Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### **docker-compose.dev.yml**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/fii_ai_dev
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=fii_ai_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔍 Troubleshooting

### **Problemas Comuns**

**1. Erro de conexão com banco:**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql $DATABASE_URL -c "SELECT version();"

# Verificar string de conexão
echo $DATABASE_URL
```

**2. Problemas com Prisma:**
```bash
# Regenerar cliente
npx prisma generate

# Reset completo
npx prisma migrate reset

# Verificar schema
npx prisma validate
```

**3. Problemas com Clerk:**
```bash
# Verificar variáveis
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Testar webhook
curl -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"type": "user.created"}'
```

**4. Port já em uso:**
```bash
# Encontrar processo na porta 3000
lsof -ti:3000

# Matar processo
kill -9 $(lsof -ti:3000)

# Usar porta diferente
PORT=3001 npm run dev
```

### **Logs e Debug**

**Ativar logs de debug:**
```bash
# .env.local
DEBUG=true
PRISMA_DEBUG=true
NODE_ENV=development
```

**Visualizar logs estruturados:**
```bash
# Instalar pino-pretty
npm install -g pino-pretty

# Usar com logs
npm run dev | pino-pretty
```

## 📚 Recursos Adicionais

### **Documentação das Dependências**
- [Next.js 15](https://nextjs.org/docs)
- [Prisma ORM](https://www.prisma.io/docs)
- [Clerk Auth](https://clerk.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)

### **Ferramentas Recomendadas**
- **VS Code** com extensões:
  - Prisma
  - Tailwind CSS IntelliSense
  - TypeScript Hero
  - GitLens
- **Postman/Insomnia** para testar APIs
- **Prisma Studio** para visualizar banco
- **React DevTools** para debug

---
**Próximos Passos:** Consulte [Guidelines de Desenvolvimento](./guidelines-desenvolvimento.md) para padrões de código.