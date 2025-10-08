import type { Metadata } from 'next'

type LogoPaths = {
  light?: string
  dark?: string
}

type IconPaths = {
  favicon?: string
  apple?: string
  shortcut?: string
}

export type AnalyticsConfig = {
  gtmId?: string
  gaMeasurementId?: string
  facebookPixelId?: string
}

export const site = {
  name: 'FiiAI - Análise Inteligente de Fundos Imobiliários',
  shortName: 'FiiAI',
  description:
    'Análise de portfólios de FIIs com Inteligência Artificial. Recomendações personalizadas e insights profissionais para seus investimentos imobiliários.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  author: 'FiiAI Team',
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
  ogImage: '/img/FIIS.IA.png',
  logo: {
    light: '/img/FIIS.IA - BRANCO.png',
    dark: '/img/FIIS.IA.png',
  } as LogoPaths,
  icons: {
    favicon: '/img/FIIS.IA - SIMBOLO.png',
    apple: '/img/FIIS.IA - SIMBOLO.png',
    shortcut: '/img/FIIS.IA - SIMBOLO.png',
  } as IconPaths,
  socials: {
    twitter: '@fiiai',
  },
  support: {
    email: 'suporte@fiiai.com',
  },
  analytics: {
    gtmId: process.env.NEXT_PUBLIC_GTM_ID,
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_ID,
    facebookPixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
  } as AnalyticsConfig,
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
} as const

export const siteMetadata: Metadata = {
  title: site.name,
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: site.author }],
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    images: site.ogImage ? [{ url: site.ogImage }] : undefined,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name,
    description: site.description,
  },
  icons: {
    icon: site.icons.favicon,
    apple: site.icons.apple,
    shortcut: site.icons.shortcut,
  },
}
