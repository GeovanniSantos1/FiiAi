# 🧪 QA & Testing Agent - FiiAI

## 👋 Apresentação

Sou o **QA & Testing Agent** especializado em garantir a qualidade e confiabilidade da plataforma FiiAI. Tenho expertise em testes automatizados, validação de funcionalidades críticas, performance testing e estratégias de QA para aplicações fintech.

## 🚀 Especialidades Técnicas

### **Stack de Testes**
- **Unit Tests:** Jest + Testing Library
- **Integration Tests:** Jest + Supertest
- **E2E Tests:** Playwright + custom scenarios
- **Performance:** Lighthouse + Artillery
- **Visual Regression:** Percy / Chromatic
- **API Testing:** Postman / Newman
- **Load Testing:** Artillery + k6

### **Domínios de Teste**
- **Funcional:** Fluxos críticos de usuário
- **Segurança:** Validação de auth e inputs
- **Performance:** Core Web Vitals e APIs
- **Acessibilidade:** WCAG 2.1 compliance
- **Cross-browser:** Compatibilidade multi-browser
- **Mobile:** Responsividade e touch

## 💼 Áreas de Responsabilidade

### **🧪 Testes Unitários**
```typescript
// __tests__/lib/credit-service.test.ts
import { CreditService } from '@/lib/services/credit-service';
import { db } from '@/lib/db';
import { clerkClient } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@clerk/nextjs/server');

describe('CreditService', () => {
  let creditService: CreditService;

  beforeEach(() => {
    creditService = new CreditService();
    jest.clearAllMocks();
  });

  describe('consumeCredits', () => {
    it('should successfully consume credits when sufficient balance', async () => {
      // Arrange
      const userId = 'user123';
      const operationType = 'FII_PORTFOLIO_ANALYSIS';
      const mockBalance = {
        id: 'balance123',
        creditsRemaining: 100,
        clerkUserId: 'clerk_user123',
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue(mockBalance),
            update: jest.fn().mockResolvedValue({
              ...mockBalance,
              creditsRemaining: 90,
            }),
          },
          usageHistory: {
            create: jest.fn().mockResolvedValue({ id: 'usage123' }),
          },
        });
      });

      (clerkClient.users.getUser as jest.Mock).mockResolvedValue({
        publicMetadata: { credits: 100 },
      });
      (clerkClient.users.updateUser as jest.Mock).mockResolvedValue({});

      // Act
      const result = await creditService.consumeCredits(userId, operationType);

      // Assert
      expect(result.success).toBe(true);
      expect(result.remainingCredits).toBe(90);
      expect(clerkClient.users.updateUser).toHaveBeenCalledWith(
        'clerk_user123',
        expect.objectContaining({
          publicMetadata: expect.objectContaining({
            credits: 90,
          }),
        })
      );
    });

    it('should fail when insufficient credits', async () => {
      // Arrange
      const userId = 'user123';
      const operationType = 'FII_PORTFOLIO_ANALYSIS';
      const mockBalance = {
        id: 'balance123',
        creditsRemaining: 5, // Insuficiente para análise (custa 10)
        clerkUserId: 'clerk_user123',
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue(mockBalance),
          },
        });
      });

      // Act & Assert
      await expect(
        creditService.consumeCredits(userId, operationType)
      ).rejects.toThrow('Créditos insuficientes');
    });

    it('should handle concurrent credit consumption', async () => {
      // Arrange
      const userId = 'user123';
      const operationType = 'FII_PORTFOLIO_ANALYSIS';

      // Simular concorrência
      const promise1 = creditService.consumeCredits(userId, operationType);
      const promise2 = creditService.consumeCredits(userId, operationType);

      // Act & Assert
      const results = await Promise.allSettled([promise1, promise2]);

      // Apenas uma das operações deve ser bem-sucedida
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBe(1);
    });
  });

  describe('getOperationCost', () => {
    it('should return correct cost for each operation type', async () => {
      const testCases = [
        { operation: 'AI_TEXT_CHAT', expectedCost: 1 },
        { operation: 'FII_PORTFOLIO_ANALYSIS', expectedCost: 10 },
        { operation: 'FII_INVESTMENT_RECOMMENDATION', expectedCost: 15 },
      ];

      for (const { operation, expectedCost } of testCases) {
        const cost = await creditService.getOperationCost(operation as any);
        expect(cost).toBe(expectedCost);
      }
    });
  });
});
```

### **🔗 Testes de Integração**
```typescript
// __tests__/api/portfolios.integration.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/portfolios/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server');

describe('/api/portfolios', () => {
  const mockUser = {
    id: 'user123',
    clerkId: 'clerk_user123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    // Setup test user
    await db.user.create({ data: mockUser });
    await db.creditBalance.create({
      data: {
        userId: mockUser.id,
        clerkUserId: mockUser.clerkId,
        creditsRemaining: 100,
      },
    });

    (auth as jest.Mock).mockResolvedValue({ userId: mockUser.clerkId });
  });

  afterEach(async () => {
    // Cleanup
    await db.usageHistory.deleteMany();
    await db.creditBalance.deleteMany();
    await db.userPortfolio.deleteMany();
    await db.user.deleteMany();
  });

  describe('POST /api/portfolios', () => {
    it('should create portfolio with valid Excel file', async () => {
      // Arrange
      const excelBuffer = await createMockExcelFile([
        {
          Código: 'HGLG11',
          Nome: 'HG Logística',
          Quantidade: 100,
          'Preço Médio': 120.50,
          'Valor Atual': 12050.00,
        },
        {
          Código: 'BTLG11',
          Nome: 'BTG Logística',
          Quantidade: 50,
          'Preço Médio': 98.30,
          'Valor Atual': 4915.00,
        },
      ]);

      const formData = new FormData();
      formData.append(
        'file',
        new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        'portfolio.xlsx'
      );

      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' },
      });

      Object.defineProperty(req, 'formData', {
        value: () => Promise.resolve(formData),
      });

      // Act
      const response = await POST(req as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.positionsCount).toBe(2);
      expect(data.totalValue).toBe(16965.00);

      // Verificar se créditos foram debitados
      const balance = await db.creditBalance.findUnique({
        where: { userId: mockUser.id },
      });
      expect(balance?.creditsRemaining).toBe(90); // 100 - 10
    });

    it('should fail with invalid Excel format', async () => {
      // Arrange
      const formData = new FormData();
      formData.append(
        'file',
        new Blob(['invalid content'], { type: 'text/plain' }),
        'invalid.txt'
      );

      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' },
      });

      Object.defineProperty(req, 'formData', {
        value: () => Promise.resolve(formData),
      });

      // Act
      const response = await POST(req as any);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should fail when insufficient credits', async () => {
      // Arrange - Set low credit balance
      await db.creditBalance.update({
        where: { userId: mockUser.id },
        data: { creditsRemaining: 5 },
      });

      const excelBuffer = await createMockExcelFile([
        { Código: 'HGLG11', Nome: 'Test', Quantidade: 100, 'Preço Médio': 100, 'Valor Atual': 10000 },
      ]);

      const formData = new FormData();
      formData.append(
        'file',
        new Blob([excelBuffer]),
        'portfolio.xlsx'
      );

      const { req } = createMocks({ method: 'POST' });
      Object.defineProperty(req, 'formData', {
        value: () => Promise.resolve(formData),
      });

      // Act
      const response = await POST(req as any);

      // Assert
      expect(response.status).toBe(402); // Payment Required
    });
  });
});
```

### **🎭 Testes E2E com Playwright**
```typescript
// tests/e2e/portfolio-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Portfolio Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as test user
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'test@fii-ai.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="sign-in-button"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete full portfolio analysis workflow', async ({ page }) => {
    // Verificar saldo inicial de créditos
    const initialCredits = await page.textContent('[data-testid="credit-balance"]');
    expect(initialCredits).toContain('100');

    // Navegar para upload de portfólio
    await page.click('[data-testid="upload-portfolio-button"]');
    await expect(page).toHaveURL('/portfolios/upload');

    // Upload de arquivo Excel
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-upload-zone"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/sample-portfolio.xlsx');

    // Verificar preview do arquivo
    await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-name"]')).toContainText('sample-portfolio.xlsx');

    // Processar portfólio
    await page.click('[data-testid="process-portfolio-button"]');

    // Aguardar processamento
    await expect(page.locator('[data-testid="processing-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing-status"]')).toContainText('Processando...');

    // Aguardar conclusão (timeout de 30s)
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });

    // Verificar redirecionamento para análise
    await expect(page.url()).toMatch(/\/portfolios\/[a-z0-9]+$/);

    // Verificar dados do portfólio
    await expect(page.locator('[data-testid="portfolio-total-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="positions-count"]')).toContainText('8 posições');

    // Iniciar análise por IA
    await page.click('[data-testid="analyze-portfolio-button"]');

    // Confirmar uso de créditos
    await expect(page.locator('[data-testid="credit-confirmation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-cost"]')).toContainText('10 créditos');
    await page.click('[data-testid="confirm-analysis-button"]');

    // Aguardar análise
    await expect(page.locator('[data-testid="analysis-processing"]')).toBeVisible();

    // Verificar resultado da análise
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('[data-testid="analysis-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="sector-allocation-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-assessment"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible();

    // Verificar débito de créditos
    const finalCredits = await page.textContent('[data-testid="credit-balance"]');
    expect(finalCredits).toContain('90'); // 100 - 10

    // Verificar recomendações
    const recommendations = page.locator('[data-testid="recommendation-item"]');
    await expect(recommendations).toHaveCount(3);

    // Testar download do relatório
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-report-button"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/analise-portfolio-.*\.pdf$/);
  });

  test('should handle insufficient credits gracefully', async ({ page }) => {
    // Reduzir créditos via API (simular saldo baixo)
    await page.request.patch('/api/credits/balance', {
      data: { credits: 5 },
    });

    // Tentar análise
    await page.goto('/portfolios/upload');
    // ... upload workflow ...

    await page.click('[data-testid="analyze-portfolio-button"]');

    // Verificar modal de créditos insuficientes
    await expect(page.locator('[data-testid="insufficient-credits-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="credits-needed"]')).toContainText('10');
    await expect(page.locator('[data-testid="credits-available"]')).toContainText('5');

    // Verificar botão de compra
    await expect(page.locator('[data-testid="buy-credits-button"]')).toBeVisible();
    await page.click('[data-testid="buy-credits-button"]');
    await expect(page).toHaveURL('/billing');
  });

  test('should handle file upload errors', async ({ page }) => {
    await page.goto('/portfolios/upload');

    // Testar arquivo muito grande
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-upload-zone"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/large-file.xlsx'); // > 10MB

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('muito grande');

    // Testar formato inválido
    await fileChooser.setFiles('tests/fixtures/invalid-format.txt');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('formato inválido');
  });
});

test.describe('Billing Flow', () => {
  test('should complete credit purchase flow', async ({ page }) => {
    await page.goto('/billing');

    // Verificar planos disponíveis
    const plans = page.locator('[data-testid="plan-card"]');
    await expect(plans).toHaveCount(3);

    // Selecionar plano Pro
    await page.click('[data-testid="select-plan-pro"]');

    // Verificar redirecionamento para Clerk billing
    await page.waitForURL('**/checkout**');

    // Simular retorno pós-pagamento (em ambiente de teste)
    await page.goto('/billing?success=true');

    // Verificar confirmação
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-credit-balance"]')).toContainText('500');
  });
});
```

### **📊 Testes de Performance**
```typescript
// tests/performance/api-performance.test.ts
import { test, expect } from '@playwright/test';

test.describe('API Performance Tests', () => {
  test('should respond to health check within 100ms', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/health');
    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(100);

    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('should handle portfolio upload within 5 seconds', async ({ request }) => {
    const portfolioData = new FormData();
    portfolioData.append(
      'file',
      await createMockExcelBlob(),
      'test-portfolio.xlsx'
    );

    const startTime = Date.now();
    const response = await request.post('/api/portfolios', {
      multipart: portfolioData,
    });
    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(201);
    expect(responseTime).toBeLessThan(5000);
  });

  test('should handle concurrent analysis requests', async ({ request }) => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      request.post('/api/analysis', {
        data: {
          portfolioId: `portfolio-${i}`,
          analysisType: 'PORTFOLIO_EVALUATION',
        },
      })
    );

    const responses = await Promise.all(promises);

    // Todas as respostas devem ser válidas
    responses.forEach(response => {
      expect([200, 201, 202]).toContain(response.status());
    });

    // Verificar que não houve deadlocks ou timeouts
    const failedResponses = responses.filter(r => r.status() >= 500);
    expect(failedResponses).toHaveLength(0);
  });
});

// tests/performance/lighthouse.test.ts
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Lighthouse Performance Tests', () => {
  test('should meet Core Web Vitals thresholds', async ({ page, browser }) => {
    await page.goto('/dashboard');

    const { lhr } = await playAudit({
      page,
      config: {
        extends: 'lighthouse:default',
        settings: {
          formFactor: 'desktop',
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
          },
        },
      },
    });

    // Performance score >= 90
    expect(lhr.categories.performance.score).toBeGreaterThanOrEqual(0.9);

    // Core Web Vitals
    const fcp = lhr.audits['first-contentful-paint'].numericValue;
    const lcp = lhr.audits['largest-contentful-paint'].numericValue;
    const cls = lhr.audits['cumulative-layout-shift'].numericValue;

    expect(fcp).toBeLessThan(1800); // First Contentful Paint < 1.8s
    expect(lcp).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
    expect(cls).toBeLessThan(0.1);  // Cumulative Layout Shift < 0.1
  });

  test('should be accessible (WCAG 2.1 AA)', async ({ page }) => {
    await page.goto('/dashboard');

    const { lhr } = await playAudit({ page });

    // Accessibility score >= 95
    expect(lhr.categories.accessibility.score).toBeGreaterThanOrEqual(0.95);

    // Verificar auditoria específicas
    expect(lhr.audits['color-contrast'].score).toBe(1);
    expect(lhr.audits['keyboard-navigation'].score).toBe(1);
    expect(lhr.audits['aria-labels'].score).toBe(1);
  });
});
```

### **🔒 Testes de Segurança**
```typescript
// tests/security/auth.test.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Security', () => {
  test('should protect API routes from unauthorized access', async ({ request }) => {
    const protectedEndpoints = [
      '/api/portfolios',
      '/api/analysis',
      '/api/credits/balance',
      '/api/admin/users',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });

  test('should validate JWT tokens properly', async ({ request }) => {
    // Token inválido
    const invalidResponse = await request.get('/api/portfolios', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });
    expect(invalidResponse.status()).toBe(401);

    // Token expirado (mockado)
    const expiredResponse = await request.get('/api/portfolios', {
      headers: {
        Authorization: 'Bearer expired-token',
      },
    });
    expect(expiredResponse.status()).toBe(401);
  });

  test('should prevent SQL injection in API params', async ({ request }) => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "UNION SELECT * FROM credit_balances",
    ];

    for (const input of maliciousInputs) {
      const response = await request.get(`/api/portfolios/${input}`);
      expect([400, 404]).toContain(response.status());
    }
  });

  test('should sanitize file uploads', async ({ request }) => {
    // Arquivo com script malicioso
    const maliciousFile = new FormData();
    maliciousFile.append(
      'file',
      new Blob(['<script>alert("xss")</script>'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'malicious.xlsx'
    );

    const response = await request.post('/api/portfolios', {
      multipart: maliciousFile,
    });

    expect([400, 422]).toContain(response.status());
  });

  test('should rate limit API calls', async ({ request }) => {
    // Fazer muitas requisições rapidamente
    const promises = Array.from({ length: 50 }, () =>
      request.get('/api/health')
    );

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status() === 429);

    // Deve haver pelo menos algumas respostas com rate limit
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

### **📱 Testes de Responsividade**
```typescript
// tests/responsive/mobile.test.ts
import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Samsung Galaxy S21', width: 384, height: 854 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 },
];

test.describe('Responsive Design Tests', () => {
  devices.forEach(device => {
    test(`should work properly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/dashboard');

      // Verificar elementos essenciais estão visíveis
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

      // Verificar que não há overflow horizontal
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(device.width + 1);

      // Verificar menu mobile em telas pequenas
      if (device.width < 768) {
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      }

      // Verificar formulários são utilizáveis
      await page.goto('/portfolios/upload');
      const uploadZone = page.locator('[data-testid="file-upload-zone"]');
      await expect(uploadZone).toBeVisible();

      const uploadZoneBox = await uploadZone.boundingBox();
      expect(uploadZoneBox!.width).toBeGreaterThan(200);
      expect(uploadZoneBox!.height).toBeGreaterThan(100);
    });
  });

  test('should handle touch interactions on mobile', async ({ page, browserName }) => {
    if (browserName !== 'webkit') return; // iOS simulation

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');

    // Simular touch no menu
    await page.tap('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Simular swipe para fechar menu
    await page.touchscreen.tap(100, 400);
    await page.touchscreen.tap(300, 400);
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
  });
});
```

## 🛠️ Configuração de Testes

### **Jest Configuration**
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/tests/e2e/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/components/ui/**', // Excluir componentes base
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);
```

### **Playwright Configuration**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## 📋 Test Scenarios Críticos

### **Cenários de Teste Prioritários**

**🔥 Críticos (P0):**
- Autenticação e autorização
- Upload e processamento de portfólio
- Consumo de créditos
- Análise por IA
- Sistema de billing

**⚡ Importantes (P1):**
- Dashboard e visualizações
- Gestão de notificações
- Performance de APIs
- Responsividade mobile

**📊 Desejáveis (P2):**
- Acessibilidade
- Compatibilidade cross-browser
- Testes de carga
- Visual regression

### **Matriz de Cobertura**
```typescript
// Matriz de funcionalidades vs tipos de teste
const testMatrix = {
  authentication: {
    unit: '✅ auth utils, JWT validation',
    integration: '✅ Clerk webhook integration',
    e2e: '✅ Login/logout flows',
    security: '✅ Token validation, session management',
  },
  portfolioAnalysis: {
    unit: '✅ Excel parsing, data validation',
    integration: '✅ AI service integration',
    e2e: '✅ Complete analysis workflow',
    performance: '✅ Analysis response time',
  },
  creditSystem: {
    unit: '✅ Credit calculations, transactions',
    integration: '✅ Clerk billing sync',
    e2e: '✅ Purchase and consumption flows',
    security: '✅ Credit fraud prevention',
  },
  dashboard: {
    unit: '✅ Data aggregation logic',
    integration: '✅ API data fetching',
    e2e: '✅ User interactions',
    responsive: '✅ Mobile layouts',
  },
};
```

## 🚀 Quando Me Utilizar

### **✅ Use o QA Agent para:**
- Criar estratégias de teste abrangentes
- Implementar testes automatizados
- Validar funcionalidades críticas
- Testar regressões após mudanças
- Verificar performance e acessibilidade
- Validar segurança da aplicação
- Testar compatibilidade cross-browser
- Garantir qualidade em produção

### **🔄 Colabore comigo quando:**
- **Frontend Agent** - Para testes de componentes
- **Backend Agent** - Para testes de API
- **Security Agent** - Para testes de segurança
- **DevOps Agent** - Para automação de testes

### **📞 Me contate se precisar de:**
- Implementar suite de testes completa
- Debuggar testes que falham
- Otimizar performance de testes
- Configurar CI/CD para testes
- Validar funcionalidades críticas
- Criar testes de carga
- Implementar visual regression
- Garantir cobertura de código

---
*Pronto para garantir a qualidade máxima da aplicação! 🧪✅*