# 🛠️ Guidelines de Desenvolvimento FiiAI

## 📋 Padrões Gerais

### **Princípios Fundamentais**
- **Consistência:** Mantenha padrões em todo o codebase
- **Simplicidade:** Prefira soluções simples e legíveis
- **Performance:** Otimize para velocidade e eficiência
- **Segurança:** Nunca exponha dados sensíveis
- **Testabilidade:** Escreva código facilmente testável

### **Convenções de Nomenclatura**
```typescript
// ✅ Correto - PascalCase para componentes
export function UserDashboard() {}

// ✅ Correto - camelCase para funções e variáveis
const getUserPortfolios = async () => {}
const creditBalance = 100;

// ✅ Correto - UPPER_SNAKE_CASE para constantes
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

// ✅ Correto - kebab-case para arquivos
user-dashboard.tsx
credit-balance.ts

// ✅ Correto - PascalCase para tipos e interfaces
interface UserPortfolio {}
type AnalysisResult = {};
```

## 🏗️ Arquitetura de Componentes

### **Estrutura de Componente**
```typescript
'use client'; // Se necessário

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUserPortfolios } from '@/hooks/use-portfolios';

interface UserDashboardProps {
  userId: string;
  className?: string;
}

export function UserDashboard({ userId, className }: UserDashboardProps) {
  // 1. Hooks no topo
  const { data: portfolios, isLoading } = useUserPortfolios();
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);

  // 2. Effects
  useEffect(() => {
    if (portfolios?.length) {
      setSelectedPortfolio(portfolios[0].id);
    }
  }, [portfolios]);

  // 3. Event handlers
  const handlePortfolioSelect = (portfolioId: string) => {
    setSelectedPortfolio(portfolioId);
  };

  // 4. Render conditions
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  // 5. Main render
  return (
    <div className={cn('dashboard-container', className)}>
      {/* JSX content */}
    </div>
  );
}
```

### **Props Interface Pattern**
```typescript
// ✅ Interface separada e tipada
interface ComponentProps {
  // Props obrigatórias primeiro
  title: string;
  userId: string;

  // Props opcionais depois
  className?: string;
  onClose?: () => void;

  // Children por último
  children?: React.ReactNode;
}

// ✅ Destructuring com defaults
export function Component({
  title,
  userId,
  className,
  onClose,
  children
}: ComponentProps) {
  // implementação
}
```

## 🔧 Padrões de Hooks

### **Custom Hooks Pattern**
```typescript
// hooks/use-user-portfolios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useUserPortfolios() {
  return useQuery<UserPortfolio[]>({
    queryKey: ['portfolios'],
    queryFn: () => api.get('/api/portfolios'),
    staleTime: 5 * 60_000, // 5 minutos
    gcTime: 10 * 60_000,   // 10 minutos
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortfolioData) =>
      api.post('/api/portfolios', data),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
    onError: (error) => {
      // Tratamento de erro consistente
      console.error('Erro ao criar portfólio:', error);
    },
  });
}
```

### **TanStack Query Guidelines**
```typescript
// ✅ Query Keys estruturadas
const queryKeys = {
  portfolios: ['portfolios'] as const,
  portfolio: (id: string) => ['portfolios', id] as const,
  analysis: (portfolioId: string) => ['analysis', portfolioId] as const,
};

// ✅ Stale time baseado no tipo de dado
const CACHE_TIMES = {
  REAL_TIME: 30_000,      // 30 segundos - dados críticos
  FREQUENT: 5 * 60_000,   // 5 minutos - dados frequentes
  STABLE: 30 * 60_000,    // 30 minutos - dados estáveis
};

// ✅ Error handling consistente
export function usePortfolio(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolio(id),
    queryFn: () => api.get(`/api/portfolios/${id}`),
    staleTime: CACHE_TIMES.FREQUENT,
    retry: (failureCount, error) => {
      // Não retry em erros 404
      if (error.status === 404) return false;
      return failureCount < 3;
    },
  });
}
```

## 🌐 Padrões de API Routes

### **Estrutura de API Route**
```typescript
// app/api/portfolios/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { ApiError } from '@/lib/api-client';

// Schema de validação
const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(255),
  file: z.instanceof(File),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Obter usuário do banco
    const user = await getUserFromClerkId(userId);

    // 3. Validar dados de entrada
    const formData = await request.formData();
    const body = {
      name: formData.get('name'),
      file: formData.get('file'),
    };

    const validatedData = CreatePortfolioSchema.parse(body);

    // 4. Lógica de negócio
    const portfolio = await createPortfolio(user.id, validatedData);

    // 5. Resposta de sucesso
    return Response.json(portfolio, { status: 201 });

  } catch (error) {
    // 6. Tratamento de erro
    console.error('Erro ao criar portfólio:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ApiError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return Response.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### **Padrão de Validação Zod**
```typescript
// lib/schemas.ts
import { z } from 'zod';

export const CreatePortfolioSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome muito longo'),

  description: z.string()
    .max(1000, 'Descrição muito longa')
    .optional(),

  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'Arquivo muito grande')
    .refine(file => file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Apenas arquivos Excel'),
});

// Uso em componente
const form = useForm<z.infer<typeof CreatePortfolioSchema>>({
  resolver: zodResolver(CreatePortfolioSchema),
});
```

## 🎨 Padrões de UI/Styling

### **Tailwind CSS Guidelines**
```typescript
// ✅ Use o utilitário cn() para merge de classes
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', ...props }) {
  return (
    <button
      className={cn(
        // Classes base
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'ring-offset-background transition-colors focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',

        // Variantes
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },

        // Classes personalizadas
        className
      )}
      {...props}
    />
  );
}
```

### **Design System Components**
```typescript
// components/ui/card.tsx - Componente base reutilizável
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  );
}

// Uso em componentes específicos
export function PortfolioCard({ portfolio }: { portfolio: UserPortfolio }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <h3 className="font-semibold">{portfolio.name}</h3>
        <p className="text-sm text-muted-foreground">
          Valor total: {formatCurrency(portfolio.totalValue)}
        </p>
      </CardHeader>
    </Card>
  );
}
```

## 📊 Padrões de Estado Global

### **Zustand Store Pattern**
```typescript
// stores/use-app-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  // Estado
  sidebarOpen: boolean;
  theme: 'light' | 'dark';

  // Ações
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      sidebarOpen: true,
      theme: 'light',

      // Ações
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'app-store' }
  )
);
```

## 🔒 Padrões de Segurança

### **Verificação de Autenticação**
```typescript
// ✅ Server-side - API Routes
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await getUserFromClerkId(userId);
  // ... lógica
}

// ✅ Client-side - Componentes
export function ProtectedComponent() {
  const { isSignedIn, user } = useAuth();

  if (!isSignedIn) {
    redirect('/sign-in');
  }

  return <Content />;
}
```

### **Validação de Propriedade de Recursos**
```typescript
// ✅ Verificar se o usuário possui acesso ao recurso
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  const user = await getUserFromClerkId(userId);

  const portfolio = await db.userPortfolio.findFirst({
    where: {
      id: params.id,
      userId: user.id, // ✅ Verificação de propriedade
    },
  });

  if (!portfolio) {
    return new Response('Not Found', { status: 404 });
  }

  return Response.json(portfolio);
}
```

### **Sanitização de Dados**
```typescript
// ✅ Sempre validar entrada com Zod
const schema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(1000).optional(),
});

// ✅ Escapar HTML se necessário
import DOMPurify from 'dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);
```

## 📝 Padrões de Documentação

### **JSDoc Comments**
```typescript
/**
 * Analisa um portfólio de FIIs usando IA
 *
 * @param portfolioId - ID do portfólio a ser analisado
 * @param options - Opções de configuração da análise
 * @returns Promise com o resultado da análise
 *
 * @example
 * ```typescript
 * const result = await analyzePortfolio('portfolio-123', {
 *   includeRecommendations: true,
 *   riskTolerance: 'moderate'
 * });
 * ```
 */
export async function analyzePortfolio(
  portfolioId: string,
  options: AnalysisOptions
): Promise<AnalysisResult> {
  // implementação
}
```

### **README Components**
```typescript
// components/ui/button/README.md
# Button Component

## Usage
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="md" onClick={handleClick}>
  Clique aqui
</Button>
```

## Props
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `className`: string (optional)
```

## 🧪 Padrões de Testes

### **Estrutura de Teste**
```typescript
// __tests__/components/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('deve renderizar com texto correto', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByText('Clique aqui')).toBeInTheDocument();
  });

  it('deve chamar onClick quando clicado', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clique</Button>);

    fireEvent.click(screen.getByText('Clique'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve aplicar variant corretamente', () => {
    render(<Button variant="destructive">Deletar</Button>);
    expect(screen.getByText('Deletar')).toHaveClass('bg-destructive');
  });
});
```

### **Testes de API**
```typescript
// __tests__/api/portfolios.test.ts
import { GET, POST } from '@/app/api/portfolios/route';
import { auth } from '@clerk/nextjs/server';

jest.mock('@clerk/nextjs/server');

describe('/api/portfolios', () => {
  beforeEach(() => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user-123' });
  });

  it('GET deve retornar portfólios do usuário', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('POST deve criar novo portfólio', async () => {
    const formData = new FormData();
    formData.append('name', 'Meu Portfólio');
    formData.append('file', new File([''], 'portfolio.xlsx'));

    const request = new Request('http://localhost:3000/api/portfolios', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

## 🚀 Padrões de Performance

### **Lazy Loading**
```typescript
// ✅ Dynamic imports para componentes pesados
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <div>Carregando gráfico...</div>,
  ssr: false, // Se não precisar de SSR
});

// ✅ Lazy loading de hooks
const useExpensiveHook = lazy(() => import('@/hooks/use-expensive-hook'));
```

### **Memoization**
```typescript
// ✅ useMemo para cálculos pesados
const expensiveCalculation = useMemo(() => {
  return portfolios.reduce((acc, portfolio) => {
    // cálculo complexo
    return acc + portfolio.totalValue;
  }, 0);
}, [portfolios]);

// ✅ useCallback para event handlers
const handlePortfolioSelect = useCallback((portfolioId: string) => {
  setSelectedPortfolio(portfolioId);
  onPortfolioChange?.(portfolioId);
}, [onPortfolioChange]);

// ✅ React.memo para componentes
export const PortfolioCard = React.memo<PortfolioCardProps>(({ portfolio }) => {
  return (
    <Card>
      {/* conteúdo */}
    </Card>
  );
});
```

## 📦 Padrões de Build e Deploy

### **Scripts Package.json**
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
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset"
  }
}
```

### **Environment Variables**
```bash
# .env.example
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://...

# Optional: AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---
**Próximos Passos:** Consulte [Documentação de APIs](./apis.md) para padrões específicos de endpoints.