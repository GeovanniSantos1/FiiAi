# Plan 002 - Logo Adaptativo e Paleta de Cores FiiAI

**Agente Responsável:** Frontend Agent
**Data:** 2025-10-03
**Prioridade:** Alta
**Estimativa:** 4-6 horas

---

## 📋 Objetivo

Implementar sistema de logo adaptativo que responde ao tema (claro/escuro) escolhido pelo usuário e aplicar a paleta de cores oficial da marca FiiAI em todo o sistema, substituindo o branding genérico "SaaS Template".

---

## 🎨 Identidade Visual FiiAI

### Logo Variants (disponíveis em `/src/img/`)
- **Modo Escuro:** `FIIS.IA.png` (logo com dourado/laranja #edd2a3 e #6d3a05)
- **Modo Claro:** `FIIS.IA - BRANCO.png` (logo branco)
- **Símbolos:**
  - `FIIS.IA - SIMBOLO.png` (símbolo colorido para favicon/small)
  - `FIIS.IA - SIMBOLO - BRANCO.png` (símbolo branco)

### Paleta de Cores Oficial

**Cores Primárias:**
- **Preto:** `#212121` (RGB: 33, 33, 33) - Backgrounds modo escuro
- **Branco:** `#ffffff` (RGB: 0, 0, 0) - Backgrounds modo claro
- **Dourado Claro:** `#edd2a3` (RGB: 237, 210, 163) - Accents suaves
- **Dourado Escuro:** `#6d3a05` (RGB: 109, 58, 5) - Accents fortes, CTAs

**Tipografia:**
- **Primária:** Poppins Bold
- **Secundária:** Poppins Regular

---

## 🎯 Escopo do Projeto

### Fase 1: Componente de Logo Adaptativo
- [ ] Criar componente `<Logo>` reutilizável com suporte a tema
- [ ] Suportar variantes: `full` (logo completo), `icon` (apenas símbolo)
- [ ] Suportar tamanhos: `sm`, `md`, `lg`, `xl`
- [ ] Trocar logo automaticamente quando tema muda

### Fase 2: Aplicação da Paleta de Cores
- [ ] Atualizar `globals.css` com cores FiiAI
- [ ] Mapear cores nos modos claro e escuro
- [ ] Manter compatibilidade com Radix UI e Tailwind CSS v4
- [ ] Preservar glass morphism e efeitos visuais existentes

### Fase 3: Substituição de Branding
- [ ] Atualizar topbar com logo FiiAI
- [ ] Atualizar sidebar com logo FiiAI
- [ ] Atualizar admin topbar/sidebar
- [ ] Substituir textos "SaaS Template" por "FiiAI"

### Fase 4: Tipografia
- [ ] Integrar fontes Poppins (Google Fonts)
- [ ] Configurar Poppins Bold e Regular
- [ ] Manter Geist Mono para código

### Fase 5: Metadata e Assets
- [ ] Atualizar `brand-config.ts` com informações FiiAI
- [ ] Gerar favicon a partir do símbolo
- [ ] Atualizar Open Graph images

---

## 📁 Estrutura de Arquivos

### Novos Arquivos
```
src/
├── components/
│   └── brand/
│       ├── logo.tsx              # Componente de logo adaptativo
│       └── brand-icon.tsx        # Ícone da marca
├── lib/
│   └── brand-config.ts           # Configurações da marca (já existe)
└── app/
    └── layout.tsx                # Atualizar fontes
```

### Arquivos a Modificar
```
src/
├── app/
│   ├── globals.css               # Paleta de cores FiiAI
│   └── layout.tsx                # Fontes Poppins
├── components/
│   ├── app/
│   │   ├── topbar.tsx            # Logo no topbar
│   │   └── sidebar.tsx           # Logo na sidebar
│   └── admin/
│       ├── admin-topbar.tsx      # Logo admin topbar
│       └── admin-sidebar.tsx     # Logo admin sidebar
└── lib/
    └── brand-config.ts           # Metadata FiiAI
```

---

## 🔧 Implementação Técnica

### 1. Componente `<Logo>` Adaptativo

**Localização:** `src/components/brand/logo.tsx`

**Funcionalidades:**
- Detecta tema atual via `useTheme()` hook
- Renderiza logo correto (escuro ou claro)
- Suporta propriedades: `variant`, `size`, `className`
- Otimizado com Next.js Image component
- Lazy loading e priority para above-the-fold

**Interface:**
```typescript
type LogoProps = {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
};
```

**Lógica de Seleção:**
```typescript
const logoSrc = useMemo(() => {
  if (variant === 'icon') {
    return resolvedTheme === 'dark'
      ? '/img/FIIS.IA - SIMBOLO.png'
      : '/img/FIIS.IA - SIMBOLO - BRANCO.png';
  }
  return resolvedTheme === 'dark'
    ? '/img/FIIS.IA.png'
    : '/img/FIIS.IA - BRANCO.png';
}, [variant, resolvedTheme]);
```

**Dimensões por Tamanho:**
- `sm`: 80x20px (topbar mobile)
- `md`: 120x30px (topbar desktop)
- `lg`: 160x40px (sidebar)
- `xl`: 200x50px (landing page)

---

### 2. Paleta de Cores em `globals.css`

**Mapeamento de Cores:**

#### Light Mode
```css
:root {
  /* FiiAI Brand Colors - Light Mode */
  --background: oklch(0.99 0 0);              /* #ffffff - Branco */
  --foreground: oklch(0.15 0 0);              /* #212121 - Preto */

  --primary: oklch(0.56 0.08 65);             /* #6d3a05 - Dourado Escuro */
  --primary-foreground: oklch(0.99 0 0);      /* Branco em cima do dourado */

  --secondary: oklch(0.88 0.04 65);           /* #edd2a3 - Dourado Claro */
  --secondary-foreground: oklch(0.15 0 0);    /* Preto em cima do claro */

  --accent: oklch(0.88 0.04 65);              /* #edd2a3 - Dourado Claro */
  --accent-foreground: oklch(0.15 0 0);

  --muted: oklch(0.96 0 0);                   /* Cinza muito claro */
  --muted-foreground: oklch(0.45 0 0);        /* Cinza médio */

  --card: oklch(0.99 0 0);                    /* Branco */
  --card-foreground: oklch(0.15 0 0);

  --border: oklch(0.90 0 0);                  /* Cinza claro */
  --input: oklch(0.90 0 0);
  --ring: oklch(0.56 0.08 65);                /* Dourado escuro */
}
```

#### Dark Mode
```css
.dark {
  /* FiiAI Brand Colors - Dark Mode */
  --background: oklch(0.15 0 0);              /* #212121 - Preto */
  --foreground: oklch(0.88 0.04 65);          /* #edd2a3 - Dourado Claro */

  --primary: oklch(0.88 0.04 65);             /* #edd2a3 - Dourado Claro */
  --primary-foreground: oklch(0.15 0 0);      /* Preto em cima do dourado */

  --secondary: oklch(0.56 0.08 65);           /* #6d3a05 - Dourado Escuro */
  --secondary-foreground: oklch(0.99 0 0);    /* Branco */

  --accent: oklch(0.88 0.04 65);              /* #edd2a3 - Dourado Claro */
  --accent-foreground: oklch(0.15 0 0);

  --muted: oklch(0.20 0 0);                   /* Cinza escuro */
  --muted-foreground: oklch(0.65 0 0);        /* Cinza claro */

  --card: oklch(0.18 0 0);                    /* Quase preto */
  --card-foreground: oklch(0.88 0.04 65);

  --border: oklch(0.25 0 0);                  /* Cinza escuro */
  --input: oklch(0.25 0 0);
  --ring: oklch(0.88 0.04 65);                /* Dourado claro */
}
```

**Cores Semânticas (mantém existentes):**
```css
:root {
  /* Success, Warning, Error, Info - mantém cores atuais */
  --success-500: oklch(0.65 0.22 145);
  --warning-500: oklch(0.75 0.25 85);
  --error-500: oklch(0.55 0.25 27);
  --info-500: oklch(0.6 0.2 230);
}
```

**Glass Morphism Ajustado:**
```css
:root {
  /* Ajustar glass effects com dourado */
  --neon: oklch(0.88 0.04 65);                /* Dourado claro */
  --neon-2: oklch(0.56 0.08 65);              /* Dourado escuro */
}

.dark {
  --neon: oklch(0.88 0.04 65);                /* Dourado claro */
  --neon-2: oklch(0.56 0.08 65);              /* Dourado escuro */
}
```

---

### 3. Integração de Fontes Poppins

**Atualizar `src/app/layout.tsx`:**

```typescript
import { Poppins, Geist_Mono } from "next/font/google";

const poppinsBold = Poppins({
  weight: "700",
  variable: "--font-poppins-bold",
  subsets: ["latin"],
  display: "swap",
});

const poppinsRegular = Poppins({
  weight: "400",
  variable: "--font-poppins-regular",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// No body
className={`${poppinsRegular.variable} ${poppinsBold.variable} ${geistMono.variable} antialiased text-foreground`}
```

**Atualizar `globals.css`:**

```css
@theme inline {
  --font-sans: var(--font-poppins-regular);
  --font-bold: var(--font-poppins-bold);
  --font-mono: var(--font-geist-mono);
}

@layer base {
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-bold);
  }

  body {
    font-family: var(--font-sans);
  }

  code, pre {
    font-family: var(--font-mono);
  }
}
```

---

### 4. Atualização de Componentes com Logo

#### `src/components/app/topbar.tsx`

**Antes:**
```tsx
<Link href="/" className="flex items-center gap-2 md:hidden">
  <div className="h-6 w-6 rounded bg-primary" />
  <span className="text-sm font-semibold">SaaS Template</span>
</Link>
```

**Depois:**
```tsx
<Link href="/" className="flex items-center md:hidden">
  <Logo variant="full" size="sm" priority />
</Link>
```

**Mobile Menu:**
```tsx
<SheetHeader className="p-4 text-left">
  <div className="flex items-center justify-between">
    <Logo variant="full" size="md" />
  </div>
</SheetHeader>
```

#### `src/components/app/sidebar.tsx`

**Header da Sidebar:**
```tsx
<div className="flex h-16 items-center border-b px-4">
  <Link href="/dashboard" className="flex items-center gap-2">
    <Logo variant="full" size="lg" priority />
  </Link>
</div>
```

**Versão Collapsed:**
```tsx
{collapsed && (
  <Link href="/dashboard" className="flex justify-center py-4">
    <Logo variant="icon" size="md" />
  </Link>
)}
```

#### `src/components/admin/admin-sidebar.tsx`

Similar ao sidebar principal, mas com link para `/admin`:

```tsx
<div className="flex h-16 items-center border-b px-4">
  <Link href="/admin" className="flex items-center gap-2">
    <Logo variant="full" size="lg" priority />
  </Link>
</div>
```

#### `src/components/admin/admin-topbar.tsx`

```tsx
<Link href="/admin" className="flex items-center md:hidden">
  <Logo variant="full" size="sm" priority />
</Link>
```

---

### 5. Metadata e SEO

**Atualizar `src/lib/brand-config.ts`:**

```typescript
export const siteMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'FiiAI - Análise Inteligente de Fundos Imobiliários',
    template: '%s | FiiAI',
  },
  description: 'Análise de portfólios de FIIs com Inteligência Artificial. Recomendações personalizadas e insights profissionais para seus investimentos imobiliários.',
  keywords: [
    'FII',
    'Fundos Imobiliários',
    'Análise de Portfólio',
    'Inteligência Artificial',
    'Investimentos',
    'Real Estate',
    'REIT Brasil',
    'Análise Automatizada',
  ],
  authors: [{ name: 'FiiAI Team' }],
  creator: 'FiiAI',
  publisher: 'FiiAI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/img/FIIS.IA - SIMBOLO.png',
    shortcut: '/img/FIIS.IA - SIMBOLO.png',
    apple: '/img/FIIS.IA - SIMBOLO.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'FiiAI',
    title: 'FiiAI - Análise Inteligente de Fundos Imobiliários',
    description: 'Análise de portfólios de FIIs com IA. Recomendações personalizadas para seus investimentos.',
    images: [
      {
        url: '/img/FIIS.IA.png',
        width: 1200,
        height: 630,
        alt: 'FiiAI - Análise Inteligente de FIIs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FiiAI - Análise Inteligente de Fundos Imobiliários',
    description: 'Análise de portfólios de FIIs com IA.',
    images: ['/img/FIIS.IA.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const brandConfig = {
  name: 'FiiAI',
  tagline: 'Análise Inteligente de Fundos Imobiliários',
  description: 'Plataforma de análise de portfólios de FIIs com Inteligência Artificial',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  logo: {
    dark: '/img/FIIS.IA.png',
    light: '/img/FIIS.IA - BRANCO.png',
    icon: '/img/FIIS.IA - SIMBOLO.png',
    iconLight: '/img/FIIS.IA - SIMBOLO - BRANCO.png',
  },
  colors: {
    primary: {
      light: '#6d3a05',   // Dourado escuro
      dark: '#edd2a3',    // Dourado claro
    },
    secondary: {
      light: '#edd2a3',   // Dourado claro
      dark: '#6d3a05',    // Dourado escuro
    },
    background: {
      light: '#ffffff',   // Branco
      dark: '#212121',    // Preto
    },
  },
  fonts: {
    primary: 'Poppins',
    weights: {
      regular: 400,
      bold: 700,
    },
  },
  social: {
    twitter: '@fiiai',
    linkedin: 'company/fiiai',
    github: 'fiiai',
  },
};
```

---

### 6. Favicon Generation

**Gerar favicons a partir de `FIIS.IA - SIMBOLO.png`:**

Usando ferramenta online ou script:
- `favicon.ico` (16x16, 32x32, 48x48)
- `apple-touch-icon.png` (180x180)
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

**Adicionar em `public/` raiz:**
```
public/
├── favicon.ico
├── apple-touch-icon.png
├── icon-192.png
└── icon-512.png
```

**Atualizar `src/app/layout.tsx` ou `src/app/icon.tsx`:**

Criar `src/app/icon.tsx` para dynamic icons:
```typescript
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Usar SVG do símbolo ou PNG */}
      </div>
    ),
    {
      ...size,
    }
  );
}
```

---

## 🧪 Testes e Validação

### Checklist de Validação

#### 1. Logo Adaptativo
- [ ] Logo muda corretamente ao alternar tema (light/dark/system)
- [ ] Logo exibe corretamente em todos os tamanhos (sm, md, lg, xl)
- [ ] Variante `icon` funciona em mobile e sidebar collapsed
- [ ] Imagens carregam com lazy loading (exceto above-the-fold com `priority`)
- [ ] Logos têm alt text adequado para acessibilidade

#### 2. Paleta de Cores
- [ ] Cores primárias (#6d3a05, #edd2a3) aplicadas corretamente
- [ ] Contraste adequado entre texto e background (WCAG AA)
- [ ] Cores semânticas (success, warning, error) mantidas
- [ ] Glass morphism e efeitos visuais preservados
- [ ] Modo escuro e claro consistentes

#### 3. Tipografia
- [ ] Poppins Bold aplicada em headings (h1-h6)
- [ ] Poppins Regular aplicada em body text
- [ ] Geist Mono mantida em blocos de código
- [ ] Fontes carregam com `display: swap` (sem FOIT)
- [ ] Fallbacks adequados para fonts não carregadas

#### 4. Componentes Atualizados
- [ ] Topbar principal exibe logo FiiAI
- [ ] Sidebar principal exibe logo FiiAI
- [ ] Admin topbar exibe logo FiiAI
- [ ] Admin sidebar exibe logo FiiAI
- [ ] Mobile menu exibe logo FiiAI
- [ ] Textos "SaaS Template" substituídos por "FiiAI"

#### 5. SEO e Metadata
- [ ] Favicon visível na aba do browser
- [ ] Título da página correto: "FiiAI - ..."
- [ ] Open Graph tags corretas (compartilhamento redes sociais)
- [ ] Meta description relevante
- [ ] Keywords apropriadas

#### 6. Responsividade
- [ ] Logo responsivo em mobile (320px+)
- [ ] Logo responsivo em tablet (768px+)
- [ ] Logo responsivo em desktop (1024px+)
- [ ] Logo em 4K/Retina (2x, 3x)

#### 7. Performance
- [ ] Logos otimizados (WebP quando possível)
- [ ] Lazy loading funcionando
- [ ] Sem layout shift (CLS) ao carregar logo
- [ ] Fonts carregando sem blocking

---

## 🔍 Testes Manuais

### 1. Teste de Tema
```
1. Acessar /dashboard
2. Verificar logo no modo system (deve seguir tema do OS)
3. Alternar para dark mode → logo deve mudar para versão dourada
4. Alternar para light mode → logo deve mudar para versão branca
5. Recarregar página → logo deve persistir com tema salvo
```

### 2. Teste de Responsividade
```
1. Desktop (1920x1080): Logo full size na sidebar
2. Tablet (768x1024): Logo médio no topbar
3. Mobile (375x667): Logo pequeno + menu hambúrguer
4. Mobile landscape (667x375): Logo não quebra layout
```

### 3. Teste de Acessibilidade
```
1. Screen reader deve ler "FiiAI - Logotipo" ou similar
2. Logo deve ter role="img"
3. Links com logo devem ter aria-label
4. Contraste de cores >= 4.5:1 para texto normal
5. Contraste de cores >= 3:1 para texto grande
```

### 4. Teste Cross-Browser
```
- Chrome/Edge (Chromium): ✅
- Firefox: ✅
- Safari (macOS/iOS): ✅
- Samsung Internet (Android): ✅
```

---

## 📊 Métricas de Sucesso

### Performance
- **LCP (Largest Contentful Paint):** < 2.5s
- **CLS (Cumulative Layout Shift):** < 0.1
- **FCP (First Contentful Paint):** < 1.8s
- **Tamanho do bundle:** +5KB max (fontes + logos)

### Acessibilidade
- **Lighthouse Accessibility Score:** >= 95
- **WCAG Level:** AA compliance
- **Keyboard navigation:** 100% funcional

### SEO
- **Lighthouse SEO Score:** 100
- **Open Graph validation:** Pass
- **Twitter Card validation:** Pass

---

## 📝 Documentação

### Uso do Componente Logo

```tsx
import { Logo } from '@/components/brand/logo';

// Logo completo em modo escuro/claro adaptativo
<Logo variant="full" size="md" />

// Apenas ícone (sidebar collapsed, mobile)
<Logo variant="icon" size="sm" />

// Logo prioritário (above-the-fold, no lazy load)
<Logo variant="full" size="lg" priority />

// Logo customizado
<Logo variant="full" size="md" className="opacity-80 hover:opacity-100" />
```

### Uso da Paleta de Cores

```tsx
// Tailwind classes com cores FiiAI
<div className="bg-primary text-primary-foreground">
  <h1 className="text-accent">Título com dourado</h1>
</div>

// CSS custom properties
<div style={{ color: 'var(--primary)' }}>
  Texto com cor primária
</div>
```

---

## 🚀 Deployment

### Pre-Deploy Checklist
- [ ] Build de produção sem erros: `npm run build`
- [ ] TypeScript sem erros: `npm run typecheck`
- [ ] ESLint sem warnings críticos: `npm run lint`
- [ ] Testes visuais em todos os breakpoints
- [ ] Verificar `.env` com variáveis corretas
- [ ] Assets de logo commitados em `/src/img/`
- [ ] Favicons gerados e em `/public/`

### Rollback Plan
- Manter branch `main` limpa antes do merge
- Tag de release antes do deploy: `v1.0.0-branding`
- Se houver problemas críticos:
  ```bash
  git revert <commit-hash>
  npm run build && npm run start
  ```

---

## 🔄 Iterações Futuras

### Fase 6 (Opcional - Pós-MVP)
- [ ] Animação de entrada do logo (fade-in suave)
- [ ] Logo interativo no hover (leve glow dourado)
- [ ] Dark mode automático por horário (18h-6h)
- [ ] Tema personalizado por usuário (admin)
- [ ] Logo animado (Lottie) na landing page
- [ ] Versão SVG do logo para melhor escalabilidade

### Melhorias de Performance
- [ ] Converter PNGs para WebP/AVIF
- [ ] Implementar progressive image loading
- [ ] Lazy load logos abaixo da dobra
- [ ] Preconnect para Google Fonts

---

## 📚 Referências

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Tailwind CSS v4 Color System](https://tailwindcss.com/docs/customizing-colors)
- [WCAG 2.1 Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Google Fonts Best Practices](https://web.dev/font-best-practices/)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

---

## ✅ Critérios de Aceitação

### Deve ter (Must-Have)
- ✅ Logo adaptativo funcionando em dark/light mode
- ✅ Paleta FiiAI aplicada em todo o sistema
- ✅ Fontes Poppins integradas
- ✅ Todos os "SaaS Template" substituídos
- ✅ Favicon FiiAI no browser

### Deveria ter (Should-Have)
- ✅ Logo responsivo em todos os breakpoints
- ✅ Performance mantida (LCP < 2.5s)
- ✅ Acessibilidade WCAG AA
- ✅ SEO otimizado com metadata

### Poderia ter (Could-Have)
- ⚪ Animações suaves de transição de tema
- ⚪ Logo SVG para escalabilidade perfeita
- ⚪ PWA icons customizados

---

**Status:** 🟡 Pronto para Implementação
**Revisado por:** Frontend Agent
**Aprovado por:** Aguardando aprovação
