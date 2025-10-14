# Plan-005: Sistema de Indicadores de Carregamento nas Transições de Rotas

## 📋 Metadados do Plano

- **ID:** PLAN-005
- **Título:** Sistema de Indicadores de Carregamento nas Transições de Rotas
- **Agente Responsável:** Frontend Development Agent
- **Prioridade:** Alta
- **Complexidade:** Média
- **Estimativa:** 2-3 dias
- **Data de Criação:** 2025-10-10

## 🎯 Objetivo

Implementar um sistema global de indicadores de carregamento durante transições entre rotas da aplicação, melhorando significativamente a experiência do usuário ao fornecer feedback visual imediato de que a navegação está em andamento.

## 📊 Problema Identificado

Atualmente, quando o usuário clica em links de navegação (ex: Avaliador de Carteiras, Dashboard, etc.), não há feedback visual de que algo está acontecendo. Isso causa:

1. **Confusão do usuário**: Não sabe se o clique foi registrado
2. **Duplos cliques**: Usuário clica múltiplas vezes achando que não funcionou
3. **Percepção de lentidão**: Sem feedback, parece que o sistema travou
4. **Experiência ruim**: Não atende padrões modernos de UX

## 🎨 Solução Proposta

Implementar um sistema de loading em duas camadas:

### 1. **Top Loading Bar** (Barra Superior)
- Barra fina no topo da página (estilo YouTube/GitHub)
- Animação de progresso durante navegação
- Cores da paleta FiiAI (gradiente azul/verde)
- Não intrusivo, mas sempre visível

### 2. **Route Transition Overlay** (Overlay de Transição)
- Fade out suave da página atual
- Spinner centralizado com logo FiiAI
- Fade in da nova página
- Apenas para rotas que demoram >500ms

## 🏗️ Arquitetura da Solução

```
src/
├── components/
│   └── navigation/
│       ├── TopLoadingBar.tsx          # Barra de progresso superior
│       ├── RouteTransition.tsx        # Overlay de transição
│       └── NavigationLoadingProvider.tsx  # Provider de estado
├── hooks/
│   └── use-navigation-loading.ts      # Hook para controlar loading
└── app/
    └── layout.tsx                      # Integração no layout principal
```

## 📝 Especificação Técnica

### **Fase 1: Top Loading Bar Component**

#### 1.1 Criar Componente Base
**Arquivo:** `src/components/navigation/TopLoadingBar.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Detectar início de navegação
    setLoading(true);
    setProgress(0);

    // Simular progresso
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    // Completar ao carregar nova rota
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    }, 500);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div
        className="h-full bg-gradient-to-r from-primary via-blue-500 to-green-500 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
        }}
      />
    </div>
  );
}
```

**Features:**
- Animação suave de progresso
- Gradiente nas cores da marca
- Glow effect sutil
- Auto-complete ao carregar página

#### 1.2 Criar Hook de Navegação
**Arquivo:** `src/hooks/use-navigation-loading.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsNavigating(true);

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return { isNavigating };
}
```

**Benefícios:**
- Reutilizável em qualquer componente
- Detecta mudanças de rota e query params
- Debounce automático

### **Fase 2: Route Transition Overlay**

#### 2.1 Criar Componente de Transição
**Arquivo:** `src/components/navigation/RouteTransition.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function RouteTransition() {
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);

    // Delay para não mostrar em navegações rápidas
    const showTimer = setTimeout(() => {
      if (loading) {
        setShow(true);
      }
    }, 300);

    // Esconder após carregamento
    const hideTimer = setTimeout(() => {
      setShow(false);
      setTimeout(() => setLoading(false), 300);
    }, 800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Logo animado */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>

          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
        </div>

        <p className="text-sm text-muted-foreground font-medium">
          Carregando...
        </p>
      </div>
    </div>
  );
}
```

**Features:**
- Delay de 300ms para navegações rápidas
- Backdrop blur para foco
- Animação de spinner com logo
- Pulse ring effect
- Fade in/out suave

#### 2.2 Provider de Estado (Opcional)
**Arquivo:** `src/components/navigation/NavigationLoadingProvider.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationLoadingContextType {
  isLoading: boolean;
  progress: number;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  isLoading: false,
  progress: 0,
});

export function useNavigationLoadingContext() {
  return useContext(NavigationLoadingContext);
}

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    const completeTimer = setTimeout(() => {
      setProgress(100);
      setIsLoading(false);
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  return (
    <NavigationLoadingContext.Provider value={{ isLoading, progress }}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}
```

### **Fase 3: Integração no Layout Principal**

#### 3.1 Atualizar Root Layout
**Arquivo:** `src/app/layout.tsx`

```typescript
import { TopLoadingBar } from '@/components/navigation/TopLoadingBar';
import { RouteTransition } from '@/components/navigation/RouteTransition';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Barra de loading no topo */}
        <TopLoadingBar />

        {/* Overlay de transição */}
        <RouteTransition />

        {/* Conteúdo da aplicação */}
        {children}
      </body>
    </html>
  );
}
```

#### 3.2 Atualizar Protected Layout (Opcional)
**Arquivo:** `src/app/(protected)/layout.tsx`

Adicionar skeleton states para componentes que demoram:

```typescript
'use client';

import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useNavigationLoading();

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1">
        <TopBar />

        {isNavigating ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
```

### **Fase 4: Melhorias em Links de Navegação**

#### 4.1 Criar Link Component com Loading State
**Arquivo:** `src/components/navigation/LoadingLink.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showInlineLoader?: boolean;
}

export function LoadingLink({
  href,
  children,
  className,
  showInlineLoader = false
}: LoadingLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (showInlineLoader) {
      e.preventDefault();
      setIsLoading(true);
      router.push(href);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 transition-opacity',
        isLoading && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {children}
      {isLoading && showInlineLoader && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
    </Link>
  );
}
```

#### 4.2 Atualizar Links do Sidebar
**Arquivo:** `src/components/app/sidebar.tsx`

Substituir `<Link>` por `<LoadingLink>` nos itens principais:

```typescript
import { LoadingLink } from '@/components/navigation/LoadingLink';

// Dentro do componente Sidebar:
<LoadingLink
  href="/dashboard/avaliar-carteira"
  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"
  showInlineLoader
>
  <BarChart3 className="w-5 h-5" />
  <span>Avaliar Carteira</span>
</LoadingLink>
```

### **Fase 5: Loading States por Página**

#### 5.1 Criar Loading Skeletons Reutilizáveis
**Arquivo:** `src/components/loading/DashboardSkeleton.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>

      {/* Main Content */}
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
```

**Arquivo:** `src/components/loading/PortfolioSkeleton.tsx`

```typescript
export function PortfolioSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
```

#### 5.2 Adicionar loading.tsx em Rotas Principais

**Arquivo:** `src/app/(protected)/dashboard/loading.tsx`
```typescript
import { DashboardSkeleton } from '@/components/loading/DashboardSkeleton';

export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
```

**Arquivo:** `src/app/(protected)/dashboard/avaliar-carteira/loading.tsx`
```typescript
import { PortfolioSkeleton } from '@/components/loading/PortfolioSkeleton';

export default function AvaliarCarteiraLoading() {
  return <PortfolioSkeleton />;
}
```

**Arquivo:** `src/app/(protected)/dashboard/direcionar-aportes/loading.tsx`
```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function DirecionarAportesLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
```

### **Fase 6: Configurações de Performance**

#### 6.1 Adicionar Prefetch nos Links Principais
**Arquivo:** `src/components/app/sidebar.tsx`

```typescript
<LoadingLink
  href="/dashboard/avaliar-carteira"
  prefetch={true}  // Prefetch automático
  className="..."
>
  Avaliar Carteira
</LoadingLink>
```

#### 6.2 Otimizar Transições com Suspense
**Arquivo:** `src/app/(protected)/layout.tsx`

```typescript
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/loading/DashboardSkeleton';

export default function ProtectedLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <TopBar />
        <Suspense fallback={<DashboardSkeleton />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
```

## 🎨 Design Specifications

### Cores e Estilos

```css
/* Barra de Loading */
--loading-bar-height: 3px;
--loading-bar-color: linear-gradient(90deg, #3b82f6, #10b981);
--loading-bar-shadow: 0 0 10px rgba(59, 130, 246, 0.5);

/* Overlay */
--overlay-bg: rgba(0, 0, 0, 0.3);
--overlay-blur: 8px;

/* Spinner */
--spinner-size: 40px;
--spinner-color: #3b82f6;
```

### Animações

```typescript
// Durações
const ANIMATION_DURATION = {
  fast: 200,      // Loading bar start
  normal: 300,    // Fade transitions
  slow: 500,      // Complete loading
  delay: 300,     // Delay before showing overlay
};

// Easing
const EASING = {
  progress: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fade: 'ease-in-out',
};
```

## 📦 Dependências Necessárias

Todas as dependências já estão instaladas:
- ✅ `next` - Sistema de rotas
- ✅ `react` - Hooks e componentes
- ✅ `lucide-react` - Ícones (Loader2)
- ✅ `tailwindcss` - Estilos
- ✅ `@radix-ui` - Componentes base (Skeleton)

## 🧪 Critérios de Teste

### Testes Funcionais

1. **Navegação entre rotas**
   - [ ] Barra de loading aparece no topo
   - [ ] Progresso anima suavemente de 0 a 100%
   - [ ] Barra desaparece ao completar

2. **Overlay de transição**
   - [ ] Só aparece em rotas que demoram >300ms
   - [ ] Spinner centralizado e animado
   - [ ] Fade in/out suave
   - [ ] Não bloqueia cliques após desaparecer

3. **Links com loading inline**
   - [ ] Spinner aparece ao lado do texto
   - [ ] Link fica disabled durante loading
   - [ ] Opacity reduz durante loading

4. **Skeletons por página**
   - [ ] Dashboard mostra skeleton apropriado
   - [ ] Avaliar Carteira mostra skeleton de portfolio
   - [ ] Direcionar Aportes mostra skeleton correto

### Testes de Performance

1. **Não deve impactar performance**
   - [ ] FCP (First Contentful Paint) < 1.5s
   - [ ] LCP (Largest Contentful Paint) < 2.5s
   - [ ] No layout shifts (CLS = 0)

2. **Animações fluidas**
   - [ ] 60 FPS em navegações
   - [ ] Sem travamentos

### Testes de UX

1. **Feedback imediato**
   - [ ] Usuário vê feedback em <100ms
   - [ ] Claro que navegação iniciou

2. **Não intrusivo**
   - [ ] Não atrapalha leitura
   - [ ] Pode ser ignorado

## 📋 Checklist de Implementação

### Dia 1: Setup e Componentes Base
- [ ] Criar pasta `src/components/navigation/`
- [ ] Implementar `TopLoadingBar.tsx`
- [ ] Implementar `RouteTransition.tsx`
- [ ] Criar hook `use-navigation-loading.ts`
- [ ] Testar componentes isoladamente

### Dia 2: Integração e Skeletons
- [ ] Integrar no `src/app/layout.tsx`
- [ ] Criar componente `LoadingLink.tsx`
- [ ] Atualizar links do Sidebar
- [ ] Criar skeletons: `DashboardSkeleton`, `PortfolioSkeleton`
- [ ] Adicionar `loading.tsx` nas rotas principais

### Dia 3: Otimizações e Testes
- [ ] Adicionar prefetch nos links principais
- [ ] Implementar Suspense boundaries
- [ ] Ajustar timings e animações
- [ ] Testar em todas as rotas
- [ ] Validar performance (Lighthouse)
- [ ] Ajustes finais de UX

## 🚀 Rotas a Cobrir

### Rotas Protegidas (Alta Prioridade)
- `/dashboard` - Dashboard principal
- `/dashboard/avaliar-carteira` - Avaliador de carteiras
- `/dashboard/direcionar-aportes` - Direcionador de aportes
- `/dashboard/carteiras-recomendadas` - Carteiras recomendadas
- `/ai-chat` - Chat com IA
- `/profile` - Perfil do usuário

### Rotas Admin (Média Prioridade)
- `/admin` - Dashboard admin
- `/admin/users` - Gestão de usuários
- `/admin/settings` - Configurações

### Rotas Públicas (Baixa Prioridade)
- `/` - Landing page
- `/sign-in` - Login
- `/sign-up` - Cadastro

## 📊 Métricas de Sucesso

### Quantitativas
- **Redução de duplos cliques:** >80%
- **Tempo percebido de loading:** <50% do atual
- **Satisfação do usuário:** >4.5/5 (após deploy)

### Qualitativas
- Usuário sempre sabe o que está acontecendo
- Navegação parece mais rápida e fluida
- Interface mais profissional e moderna
- Alinhado com padrões de mercado (GitHub, Vercel, etc.)

## 🔄 Melhorias Futuras

### v2 (Próxima Iteração)
1. **Loading progressivo com dados reais**
   - Integrar com API para progresso real
   - Mostrar etapas: "Carregando dados...", "Processando..."

2. **Animações customizadas por rota**
   - Dashboard: Slide da esquerda
   - Carteiras: Fade com blur
   - Chat: Slide de baixo

3. **Skeleton com dados parciais**
   - Mostrar dados em cache enquanto busca novos
   - Progressive enhancement

4. **Analytics de performance**
   - Rastrear tempo de navegação
   - Identificar rotas lentas

## 📝 Documentação para Usuário

### Para Desenvolvedores

```markdown
# Sistema de Loading

## Como usar

### Em componentes:
```typescript
import { useNavigationLoading } from '@/hooks/use-navigation-loading';

function MyComponent() {
  const { isNavigating } = useNavigationLoading();

  if (isNavigating) {
    return <Skeleton />;
  }

  return <ActualContent />;
}
```

### Em links:
```typescript
import { LoadingLink } from '@/components/navigation/LoadingLink';

<LoadingLink href="/dashboard" showInlineLoader>
  Ir para Dashboard
</LoadingLink>
```

### Criar loading.tsx:
```typescript
// app/minha-rota/loading.tsx
export default function Loading() {
  return <MyCustomSkeleton />;
}
```
```

## ⚠️ Pontos de Atenção

1. **Performance**: Não adicionar lógica pesada nos componentes de loading
2. **Acessibilidade**: Garantir que screen readers anunciem loading states
3. **Mobile**: Testar especialmente em conexões lentas
4. **Timing**: Ajustar delays para não piscar em navegações muito rápidas

## 🎉 Resultado Esperado

Após implementação completa:

✅ **Feedback visual imediato** em todas as navegações
✅ **Barra de progresso superior** estilo GitHub/YouTube
✅ **Overlay suave** em navegações demoradas
✅ **Skeletons inteligentes** por tipo de página
✅ **Links com estado de loading** inline
✅ **Performance mantida** (sem regressões)
✅ **UX profissional** alinhada com mercado

---

**Agente Responsável:** Frontend Development Agent
**Revisão:** Product Management Agent
**Aprovação:** Lead Developer
