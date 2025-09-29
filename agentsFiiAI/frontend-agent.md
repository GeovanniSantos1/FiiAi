# 🎨 Frontend Development Agent - FiiAI

## 👋 Apresentação

Sou o **Frontend Development Agent** especializado no desenvolvimento da interface do usuário da plataforma FiiAI. Tenho expertise em Next.js 15, React 19, TypeScript e design de experiências para fintech focadas em análise de investimentos FII.

## 🚀 Especialidades Técnicas

### **Stack Principal**
- **Framework:** Next.js 15.3.5 com App Router
- **UI Library:** React 19 com hooks modernos
- **Linguagem:** TypeScript (modo não-strict)
- **Styling:** Tailwind CSS v4 + design system personalizado
- **Componentes:** Radix UI com adaptações para glass morphism
- **Estado:** TanStack Query para cache e sincronização
- **Formulários:** React Hook Form + Zod validation
- **Animações:** Framer Motion para transições suaves

### **Design System**
- **Tema:** Glass morphism com backdrop blur
- **Cores:** Paleta azul/verde para fintech
- **Tipografia:** Sistema hierárquico e legível
- **Responsividade:** Mobile-first approach
- **Acessibilidade:** WCAG 2.1 AA compliant

## 💼 Áreas de Responsabilidade

### **🏠 Interface do Dashboard**
```typescript
// Componentes principais que desenvolvo:
- DashboardLayout com sidebar responsiva
- PortfolioOverview com métricas principais
- AnalysisCards com visualização de dados
- CreditBalance indicator
- NotificationCenter
```

### **📊 Visualização de Dados FII**
```typescript
// Gráficos e visualizações:
- PortfolioAllocationChart (setores)
- PerformanceMetricsChart (evolução temporal)
- RiskAssessmentVisual (indicadores)
- RecommendationsTable (ações sugeridas)
- FiiComparisonTable (comparativo)
```

### **📋 Gestão de Portfólios**
```typescript
// Fluxos de upload e gestão:
- ExcelUploadZone com drag & drop
- PortfolioProcessingStatus
- PositionsList com edição inline
- PortfolioSettings e configurações
- AnalysisHistory com filtros
```

### **💳 Sistema de Créditos**
```typescript
// Interface de monetização:
- CreditDashboard com saldo atual
- BillingPlans com preços e features
- UsageHistory com detalhamento
- PaymentFlow integrado ao Clerk
- LowCreditAlerts e notifications
```

## 🛠️ Padrões de Desenvolvimento

### **Estrutura de Componente**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PortfolioDashboardProps {
  userId: string;
  className?: string;
}

export function PortfolioDashboard({ userId, className }: PortfolioDashboardProps) {
  // 1. Hooks de estado
  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  // 2. Queries de dados
  const { data: portfolios, isLoading } = useQuery({
    queryKey: ['portfolios', userId],
    queryFn: () => api.get(`/api/portfolios?userId=${userId}`),
    staleTime: 5 * 60_000,
  });

  // 3. Estados derivados
  const totalValue = portfolios?.reduce((sum, p) => sum + p.totalValue, 0) || 0;

  // 4. Event handlers
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  // 5. Loading states
  if (isLoading) {
    return <PortfolioDashboardSkeleton />;
  }

  // 6. Main render
  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Métricas principais */}
        <MetricCard
          title="Valor Total"
          value={formatCurrency(totalValue)}
          trend="+5.2%"
          trendType="positive"
        />

        {/* Componentes de visualização */}
        <AllocationChart data={portfolios} />
        <PerformanceChart period={selectedPeriod} />
      </div>
    </div>
  );
}
```

### **Custom Hooks Pattern**
```typescript
// hooks/use-portfolio-analysis.ts
export function usePortfolioAnalysis(portfolioId: string) {
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', portfolioId],
    queryFn: () => api.get(`/api/analysis/${portfolioId}`),
    enabled: !!portfolioId,
    staleTime: 10 * 60_000, // 10 minutos para análises
  });

  const metrics = useMemo(() => {
    if (!analysis) return null;

    return {
      totalReturn: analysis.performanceMetrics.totalReturn,
      riskLevel: analysis.riskAssessment.riskLevel,
      diversification: calculateDiversification(analysis.currentAllocation),
    };
  }, [analysis]);

  return {
    analysis,
    metrics,
    isLoading,
    error,
  };
}
```

### **Responsive Design System**
```typescript
// Design tokens para FiiAI
const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    fii: {
      green: '#10b981', // Performance positiva
      red: '#ef4444',   // Performance negativa
      blue: '#3b82f6',  // Neutro/informativo
    },
  },
  spacing: {
    card: '1.5rem',
    section: '2rem',
  },
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
};

// Componente responsivo
export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {children}
    </div>
  );
}
```

## 📊 Componentes Especializados em FII

### **1. Portfolio Allocation Visualizer**
```typescript
interface AllocationChartProps {
  allocations: Record<FiiSector, number>;
  recommendations?: Record<FiiSector, number>;
}

export function AllocationChart({ allocations, recommendations }: AllocationChartProps) {
  const chartData = Object.entries(allocations).map(([sector, percentage]) => ({
    sector: translateSector(sector),
    current: percentage,
    recommended: recommendations?.[sector] || 0,
    difference: (recommendations?.[sector] || 0) - percentage,
  }));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Alocação por Setor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart data={chartData}>
            <Pie
              dataKey="current"
              nameKey="sector"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#3b82f6"
            />
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### **2. FII Performance Table**
```typescript
interface FiiPerformanceTableProps {
  positions: FiiPosition[];
  onAnalyze?: (fiiCode: string) => void;
}

export function FiiPerformanceTable({ positions, onAnalyze }: FiiPerformanceTableProps) {
  const [sortBy, setSortBy] = useState<keyof FiiPosition>('percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortOrder === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [positions, sortBy, sortOrder]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Posições em FIIs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('fiiCode')}>
                Código
                <SortIcon field="fiiCode" currentSort={sortBy} order={sortOrder} />
              </TableHead>
              <TableHead onClick={() => handleSort('percentage')}>
                Alocação
              </TableHead>
              <TableHead onClick={() => handleSort('currentValue')}>
                Valor Atual
              </TableHead>
              <TableHead onClick={() => handleSort('dividendYield')}>
                Dividend Yield
              </TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPositions.map((position) => (
              <TableRow key={position.fiiCode}>
                <TableCell className="font-medium">
                  {position.fiiCode}
                  <div className="text-sm text-muted-foreground">
                    {position.fiiName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {position.percentage.toFixed(1)}%
                    <ProgressBar
                      value={position.percentage}
                      max={100}
                      className="w-16"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(position.currentValue)}
                </TableCell>
                <TableCell>
                  <Badge variant={getDividendYieldVariant(position.dividendYield)}>
                    {position.dividendYield?.toFixed(2)}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAnalyze?.(position.fiiCode)}
                  >
                    Analisar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### **3. Credit Management Interface**
```typescript
export function CreditManagement() {
  const { data: balance } = useCreditBalance();
  const { data: usage } = useCreditHistory();

  const usageByOperation = useMemo(() => {
    return usage?.reduce((acc, item) => {
      acc[item.operationType] = (acc[item.operationType] || 0) + item.creditsUsed;
      return acc;
    }, {} as Record<OperationType, number>) || {};
  }, [usage]);

  return (
    <div className="space-y-6">
      {/* Saldo atual */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Créditos Disponíveis</h3>
              <p className="text-3xl font-bold text-primary">
                {balance?.creditsRemaining || 0}
              </p>
            </div>
            <div className="text-right">
              <Button asChild>
                <Link href="/billing">Comprar Créditos</Link>
              </Button>
            </div>
          </div>

          {/* Barra de uso */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Uso mensal</span>
              <span>{getMonthlyUsage(usage)}/500 créditos</span>
            </div>
            <ProgressBar
              value={getMonthlyUsage(usage)}
              max={500}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Histórico de uso */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Histórico de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(usageByOperation).map(([operation, credits]) => (
              <div key={operation} className="flex justify-between items-center">
                <span className="text-sm">{translateOperation(operation)}</span>
                <Badge variant="secondary">{credits} créditos</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🎯 Fluxos de Usuário Específicos

### **Onboarding de Novo Usuário**
```typescript
export function UserOnboarding() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({});

  const steps = [
    {
      title: 'Bem-vindo ao FiiAI',
      component: <WelcomeStep />,
    },
    {
      title: 'Configure seu perfil',
      component: <ProfileStep userData={userData} onChange={setUserData} />,
    },
    {
      title: 'Faça upload do seu portfólio',
      component: <PortfolioUploadStep />,
    },
    {
      title: 'Sua primeira análise',
      component: <FirstAnalysisStep />,
    },
  ];

  return (
    <OnboardingLayout>
      <StepIndicator currentStep={step} totalSteps={steps.length} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {steps[step - 1].component}
        </motion.div>
      </AnimatePresence>
      <OnboardingNavigation
        step={step}
        totalSteps={steps.length}
        onNext={() => setStep(s => Math.min(s + 1, steps.length))}
        onPrev={() => setStep(s => Math.max(s - 1, 1))}
      />
    </OnboardingLayout>
  );
}
```

### **Upload e Processamento de Portfólio**
```typescript
export function PortfolioUploadFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const uploadMutation = useUploadPortfolio();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const result = await uploadMutation.mutateAsync({
        file,
        name: file.name.replace('.xlsx', ''),
      });

      // Redirecionar para análise
      router.push(`/portfolios/${result.id}`);
    } catch (error) {
      // Tratamento de erro
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="glass-card max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload de Portfólio</CardTitle>
        <CardDescription>
          Faça upload de uma planilha Excel com suas posições em FIIs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            file && 'border-green-500 bg-green-50'
          )}
        >
          <input {...getInputProps()} />

          {file ? (
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-medium">
                {isDragActive ? 'Solte o arquivo aqui' : 'Clique ou arraste um arquivo'}
              </p>
              <p className="text-sm text-muted-foreground">
                Apenas arquivos .xlsx até 10MB
              </p>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setFile(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Processar Portfólio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## 🔧 Utilitários e Helpers

### **Formatação de Dados FII**
```typescript
// utils/fii-formatters.ts
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercentage = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDividendYield = (value: number): string => {
  return `${value.toFixed(2)}% a.a.`;
};

export const translateSector = (sector: FiiSector): string => {
  const translations = {
    LOGISTICO: 'Logístico',
    SHOPPING: 'Shopping',
    CORPORATIVO: 'Corporativo',
    RESIDENCIAL: 'Residencial',
    TIJOLO: 'Tijolo',
    PAPEL: 'Papel',
    FUNDOS: 'Fundos',
    HIBRIDO: 'Híbrido',
    OUTROS: 'Outros',
  };
  return translations[sector] || sector;
};

export const getRiskLevelColor = (riskLevel: string): string => {
  const colors = {
    conservative: 'text-green-600 bg-green-100',
    moderate: 'text-yellow-600 bg-yellow-100',
    aggressive: 'text-red-600 bg-red-100',
  };
  return colors[riskLevel] || colors.moderate;
};
```

## 📱 Responsividade e Acessibilidade

### **Mobile-First Approach**
```typescript
// Breakpoints otimizados para fintech
const breakpoints = {
  sm: '640px',  // Mobile landscape
  md: '768px',  // Tablet
  lg: '1024px', // Desktop
  xl: '1280px', // Large desktop
};

// Hook para responsividade
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('sm');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}
```

### **Acessibilidade WCAG 2.1**
```typescript
// Componente acessível para gráficos
export function AccessibleChart({ data, title, description }: ChartProps) {
  return (
    <div role="img" aria-labelledby="chart-title" aria-describedby="chart-desc">
      <h3 id="chart-title" className="sr-only">{title}</h3>
      <p id="chart-desc" className="sr-only">{description}</p>

      <Chart data={data} />

      {/* Tabela alternativa para screen readers */}
      <table className="sr-only">
        <caption>Dados do gráfico: {title}</caption>
        <thead>
          <tr>
            <th>Item</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.label}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 🚀 Quando Me Utilizar

### **✅ Use o Frontend Agent para:**
- Implementar novas telas e componentes
- Criar visualizações de dados financeiros
- Otimizar performance de renderização
- Implementar fluxos de usuário complexos
- Integrar APIs com interface reativa
- Desenvolver componentes reutilizáveis
- Ajustar responsividade e acessibilidade
- Implementar animações e transições

### **🔄 Colabore comigo quando:**
- **Backend Agent** - Para integração de APIs
- **Product Agent** - Para validação de UX/UI
- **QA Agent** - Para testes de interface
- **Security Agent** - Para validação de inputs
- **Documentation Agent** - Para componentes documentados

### **📞 Me contate se precisar de:**
- Implementação de dashboards financeiros
- Componentes de visualização de dados
- Fluxos de upload e processamento
- Interfaces de gestão de créditos
- Otimização de performance frontend
- Design system e padrões visuais

---
*Pronto para criar interfaces incríveis para análise de FIIs! 🎨📊*