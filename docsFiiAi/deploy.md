# 🚀 Guia de Deploy FiiAI

## 📋 Visão Geral

O FiiAI é otimizado para deploy na Vercel, mas pode ser implantado em qualquer plataforma que suporte Next.js. Este guia cobre configuração de produção, CI/CD e monitoramento.

## 🌐 Deploy na Vercel (Recomendado)

### **1. Preparação**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login na Vercel
vercel login

# Inicializar projeto
vercel
```

### **2. Configuração de Projeto**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "regions": ["gru1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **3. Variáveis de Ambiente**
```bash
# Configurar via Vercel CLI
vercel env add DATABASE_URL
vercel env add CLERK_SECRET_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Ou via dashboard Vercel
# Project Settings > Environment Variables
```

### **4. Deploy**
```bash
# Deploy para preview
vercel

# Deploy para produção
vercel --prod
```

## 🐳 Deploy com Docker

### **Dockerfile**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Gerar Prisma client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Adicionar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### **docker-compose.yml**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=fii_ai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### **Deploy Commands**
```bash
# Build e executar
docker-compose up --build

# Executar migrações
docker-compose exec app npx prisma migrate deploy

# Executar em background
docker-compose up -d
```

## ☁️ Deploy na AWS

### **1. Setup do ECS/Fargate**
```yaml
# aws-task-definition.json
{
  "family": "fii-ai",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "fii-ai-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/fii-ai:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:fii-ai/database-url"
        }
      ]
    }
  ]
}
```

### **2. RDS PostgreSQL Setup**
```bash
# Criar instância RDS
aws rds create-db-instance \
  --db-instance-identifier fii-ai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 20 \
  --db-name fii_ai \
  --master-username postgres \
  --master-user-password your-secure-password \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --storage-encrypted
```

### **3. Application Load Balancer**
```yaml
# alb-config.yml
Resources:
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Port: 3000
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      HealthCheckPath: /api/health
```

## 🔄 CI/CD Pipeline

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci

      # Deploy para Vercel
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### **GitLab CI**
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run lint
    - npm run typecheck
    - npm run test
  only:
    - merge_requests
    - main

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/fii-ai app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
```

## 🗄️ Configuração de Banco de Dados

### **Migrações em Produção**
```bash
# Executar migrações
npx prisma migrate deploy

# Gerar client Prisma
npx prisma generate

# Popular dados iniciais (se necessário)
npx prisma db seed
```

### **Backup e Restore**
```bash
# Backup automático (PostgreSQL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql $DATABASE_URL < backup_20240101_120000.sql

# Backup com script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

## 🔐 Configuração de Segurança

### **Environment Variables**
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# API Keys (nunca commit)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# URLs de produção
NEXT_PUBLIC_APP_URL=https://fii-ai.com
CLERK_WEBHOOK_SECRET=whsec_...
```

### **Headers de Segurança**
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

### **CSP (Content Security Policy)**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s+/g, ' ').trim());

  return response;
}
```

## 📊 Monitoramento

### **Health Check Endpoint**
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Verificar conexão com banco
    await db.$queryRaw`SELECT 1`;

    // Verificar APIs externas
    const clerkHealth = await fetch(`${process.env.CLERK_API_URL}/health`);

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        clerk: clerkHealth.ok ? 'connected' : 'degraded'
      }
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message
      },
      { status: 503 }
    );
  }
}
```

### **Metrics & Logging**
```typescript
// lib/monitoring.ts
import { NextRequest } from 'next/server';

export function logRequest(req: NextRequest, duration: number) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    duration,
    ip: req.ip
  }));
}

export function logError(error: Error, context: any) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context
  }));
}
```

### **Performance Monitoring**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## 🔧 Troubleshooting

### **Problemas Comuns**

**1. Erro de Conexão com Banco**
```bash
# Verificar conectividade
npx prisma db push --accept-data-loss

# Verificar string de conexão
echo $DATABASE_URL

# Testar conexão direta
psql $DATABASE_URL -c "SELECT version();"
```

**2. Problemas com Clerk**
```bash
# Verificar chaves de API
curl -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  https://api.clerk.dev/v1/users

# Verificar webhook
ngrok http 3000
# Configurar endpoint no Clerk Dashboard
```

**3. Build Failures**
```bash
# Limpar cache
rm -rf .next node_modules
npm ci
npm run build

# Verificar tipos
npm run typecheck

# Verificar lint
npm run lint
```

### **Logs e Debug**

**Vercel Logs**
```bash
# Ver logs em tempo real
vercel logs --follow

# Logs de uma função específica
vercel logs --function=api/portfolios
```

**Docker Logs**
```bash
# Ver logs do container
docker logs -f container_name

# Logs de um serviço específico
docker-compose logs -f app
```

## 📈 Escalabilidade

### **Database Scaling**
```sql
-- Índices para performance
CREATE INDEX CONCURRENTLY idx_users_clerk_id ON users(clerk_id);
CREATE INDEX CONCURRENTLY idx_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX CONCURRENTLY idx_analysis_user_id ON analysis_reports(user_id);

-- Particionamento por data (se necessário)
CREATE TABLE usage_history_2024_01 PARTITION OF usage_history
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### **CDN Configuration**
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.com'],
    loader: 'custom',
    loaderFile: './lib/image-loader.js'
  },

  async rewrites() {
    return [
      {
        source: '/assets/:path*',
        destination: 'https://cdn.fii-ai.com/assets/:path*'
      }
    ];
  }
};
```

### **Load Balancing**
```nginx
# nginx.conf
upstream fii_ai_backend {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    server_name fii-ai.com;

    location / {
        proxy_pass http://fii_ai_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---
**Próximos Passos:** Consulte [Monitoramento](./monitoramento.md) para configurar observabilidade completa.