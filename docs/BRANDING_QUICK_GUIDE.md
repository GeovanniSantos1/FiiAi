# FiiAI Branding - Guia Rápido 🎨

## Logo Adaptativo

```tsx
import { Logo } from '@/components/brand/logo';

// Uso básico (adapta automaticamente ao tema)
<Logo variant="full" size="md" />

// Variantes disponíveis
<Logo variant="full" />  // Logo completo
<Logo variant="icon" />  // Apenas símbolo

// Tamanhos disponíveis
<Logo size="sm" />  // 100x30px (mobile)
<Logo size="md" />  // 140x42px (padrão)
<Logo size="lg" />  // 180x54px (sidebar)
<Logo size="xl" />  // 220x66px (landing)

// Props opcionais
<Logo priority />              // Remove lazy loading (use above-the-fold)
<Logo className="opacity-80" />  // Classes CSS customizadas
```

---

## Paleta de Cores

### Tailwind Classes

```tsx
// Cores primárias
<div className="bg-primary text-primary-foreground">
  Dourado escuro (light) / Dourado claro (dark)
</div>

// Cores secundárias
<div className="bg-secondary text-secondary-foreground">
  Dourado claro (light) / Dourado escuro (dark)
</div>

// Cores de destaque
<div className="bg-accent text-accent-foreground">
  Dourado claro para highlights
</div>

// Backgrounds
<div className="bg-background text-foreground">
  Branco (light) / Preto (dark)
</div>

// Cards e painéis
<div className="bg-card text-card-foreground border border-border">
  Cards com borda
</div>
```

### CSS Variables

```css
/* Em CSS puro ou styled-components */
.custom-element {
  color: var(--primary);
  background: var(--background);
  border: 1px solid var(--border);
}

/* Cores disponíveis */
--primary        /* Dourado principal */
--secondary      /* Dourado secundário */
--accent         /* Dourado accent */
--background     /* Branco/Preto */
--foreground     /* Preto/Dourado */
--card           /* Fundo de cards */
--border         /* Cor de bordas */
--input          /* Cor de inputs */
--ring           /* Cor de foco */
--neon           /* Glow dourado claro */
--neon-2         /* Glow dourado escuro */
```

---

## Tipografia

### Headings (Poppins Bold)

```tsx
<h1 className="text-4xl font-bold">Título Principal</h1>
<h2 className="text-3xl font-bold">Subtítulo</h2>
<h3 className="text-2xl font-bold">Seção</h3>
```

### Body Text (Poppins Regular)

```tsx
<p className="text-base">Texto normal em Poppins Regular</p>
<span className="text-sm">Texto pequeno</span>
```

### Code (Geist Mono)

```tsx
<code className="font-mono">código inline</code>
<pre className="font-mono">
  bloco de código
</pre>
```

---

## Efeitos Visuais FiiAI

### Glass Morphism

```tsx
<div className="glass-panel p-6">
  Painel com efeito glass e glow dourado
</div>
```

### Glow Separator

```tsx
<div className="glow-separator w-full" />
```

### Neon Border

```tsx
<div className="neon-border p-4">
  Border com glow dourado suave
</div>
```

### Neon Focus

```tsx
<button className="neon-focus">
  Botão com focus ring dourado
</button>
```

### Text Neon

```tsx
<h1 className="text-neon">
  Texto com glow dourado
</h1>
```

---

## Brand Config

### Acessar Configurações

```typescript
import { site } from '@/lib/brand-config';

// Informações do site
site.name          // 'FiiAI - Análise Inteligente de...'
site.shortName     // 'FiiAI'
site.description   // Descrição completa
site.url           // URL do site

// Logos
site.logo.dark     // '/img/FIIS.IA.png'
site.logo.light    // '/img/FIIS.IA - BRANCO.png'

// Cores
site.colors.primary.dark    // '#edd2a3'
site.colors.primary.light   // '#6d3a05'

// Fontes
site.fonts.primary          // 'Poppins'
site.fonts.weights.bold     // 700
site.fonts.weights.regular  // 400
```

### Metadata para SEO

```typescript
import { siteMetadata } from '@/lib/brand-config';

// Usar em layout.tsx ou page.tsx
export const metadata = siteMetadata;

// Ou extender
export const metadata = {
  ...siteMetadata,
  title: 'Página Específica | FiiAI',
};
```

---

## Exemplos Práticos

### Card com Branding FiiAI

```tsx
<div className="glass-panel p-6 rounded-xl border border-border">
  <Logo variant="icon" size="sm" className="mb-4" />
  <h2 className="text-2xl font-bold text-primary mb-2">
    Título do Card
  </h2>
  <p className="text-foreground mb-4">
    Descrição do conteúdo do card.
  </p>
  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
    Ação Principal
  </button>
</div>
```

### Hero Section

```tsx
<section className="relative py-20 bg-background">
  <div className="container mx-auto text-center">
    <Logo variant="full" size="xl" className="mx-auto mb-6" priority />
    <h1 className="text-5xl font-bold text-primary mb-4 text-neon">
      {site.tagline}
    </h1>
    <p className="text-xl text-muted-foreground mb-8">
      {site.description}
    </p>
    <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg neon-focus">
      Começar Agora
    </button>
  </div>
  <div className="glow-separator w-full mt-12" />
</section>
```

### Navbar com Logo

```tsx
<nav className="glass-panel sticky top-0 z-50">
  <div className="container mx-auto flex items-center justify-between h-16 px-4">
    <Link href="/">
      <Logo variant="full" size="sm" priority />
    </Link>

    <div className="flex items-center gap-6">
      <Link href="/features" className="text-foreground hover:text-primary">
        Recursos
      </Link>
      <Link href="/pricing" className="text-foreground hover:text-primary">
        Preços
      </Link>
      <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
        Entrar
      </button>
    </div>
  </div>
</nav>
```

### Footer com Branding

```tsx
<footer className="bg-card border-t border-border py-12">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <Logo variant="full" size="md" className="mb-4" />
        <p className="text-sm text-muted-foreground">
          {site.description}
        </p>
      </div>

      <div>
        <h3 className="font-bold mb-4 text-primary">Produto</h3>
        <ul className="space-y-2">
          <li><Link href="/features">Recursos</Link></li>
          <li><Link href="/pricing">Preços</Link></li>
        </ul>
      </div>

      <div>
        <h3 className="font-bold mb-4 text-primary">Suporte</h3>
        <ul className="space-y-2">
          <li><Link href="/docs">Documentação</Link></li>
          <li><Link href="/contact">Contato</Link></li>
        </ul>
      </div>

      <div>
        <h3 className="font-bold mb-4 text-primary">Social</h3>
        <p className="text-sm">Twitter: {site.socials.twitter}</p>
      </div>
    </div>

    <div className="glow-separator w-full my-8" />

    <div className="text-center text-sm text-muted-foreground">
      © 2025 {site.shortName}. Todos os direitos reservados.
    </div>
  </div>
</footer>
```

---

## Checklist de Branding

Ao criar novos componentes, certifique-se de:

- [ ] Usar `<Logo>` ao invés de texto "FiiAI"
- [ ] Aplicar cores via Tailwind classes (`bg-primary`, `text-accent`, etc)
- [ ] Usar `font-bold` para headings (aplica Poppins Bold)
- [ ] Usar classes de efeitos visuais (`glass-panel`, `glow-separator`)
- [ ] Importar `site` de `brand-config.ts` para textos dinâmicos
- [ ] Adicionar `priority` em logos above-the-fold
- [ ] Usar `neon-focus` em elementos interativos importantes

---

## Cores Hex de Referência

```
#212121 - Preto (background dark, foreground light)
#ffffff - Branco (background light, foreground dark)
#edd2a3 - Dourado Claro (primary dark, accent)
#6d3a05 - Dourado Escuro (primary light)
```

---

**Documentação Completa:** [BRANDING_IMPLEMENTATION.md](./BRANDING_IMPLEMENTATION.md)
