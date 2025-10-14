/**
 * Segmentos de Fundos Imobiliários (FII)
 * Atualizado em: 2025-10-13
 *
 * Este arquivo centraliza toda a lógica relacionada a segmentos de FIIs,
 * incluindo tipos, labels, descrições e funções helper.
 */

/**
 * Lista de todos os segmentos de FII disponíveis
 */
export const FII_SECTORS = [
  'LAJES',
  'LOGISTICA',
  'SHOPPING',
  'VAREJO_RENDA_URBANA',
  'PAPEL',
  'HEDGE_FUNDS',
  'EDUCACIONAL',
  'HIBRIDOS',
  'AGRO',
  'INFRA',
  'DESENVOLVIMENTO',
  'HOSPITAIS',
  'HOTEIS',
  'AGENCIAS',
  'RESIDENCIAL',
  'OUTROS',
] as const;

/**
 * Type de segmento de FII (TypeScript)
 */
export type FiiSector = typeof FII_SECTORS[number];

/**
 * Labels amigáveis para exibição na UI
 */
export const FII_SECTOR_LABELS: Record<FiiSector, string> = {
  LAJES: 'Lajes Corporativas',
  LOGISTICA: 'Logística',
  SHOPPING: 'Shopping Centers',
  VAREJO_RENDA_URBANA: 'Varejo/Renda Urbana',
  PAPEL: 'Papel (CRIs)',
  HEDGE_FUNDS: 'Hedge Funds',
  EDUCACIONAL: 'Educacional',
  HIBRIDOS: 'Híbridos',
  AGRO: 'Agronegócio',
  INFRA: 'Infraestrutura',
  DESENVOLVIMENTO: 'Desenvolvimento',
  HOSPITAIS: 'Hospitais',
  HOTEIS: 'Hotéis',
  AGENCIAS: 'Agências Bancárias',
  RESIDENCIAL: 'Residencial',
  OUTROS: 'Outros',
};

/**
 * Descrições dos segmentos para tooltips
 */
export const FII_SECTOR_DESCRIPTIONS: Record<FiiSector, string> = {
  LAJES: 'Fundos que investem em lajes corporativas e edifícios comerciais de escritórios',
  LOGISTICA: 'Fundos focados em galpões logísticos e centros de distribuição',
  SHOPPING: 'Fundos que investem em shopping centers e outlets',
  VAREJO_RENDA_URBANA: 'Fundos com imóveis de varejo de rua, lojas e renda urbana',
  PAPEL: 'Fundos que investem em papéis (CRIs, LCIs, LCAs e outros recebíveis)',
  HEDGE_FUNDS: 'Fundos de fundos (FOFs) - investem em cotas de outros FIIs',
  EDUCACIONAL: 'Fundos que investem em instituições de ensino (escolas, universidades)',
  HIBRIDOS: 'Fundos com estratégia mista combinando tijolo e papel',
  AGRO: 'Fundos focados em propriedades rurais e agronegócio',
  INFRA: 'Fundos de infraestrutura (energia, torres de telecomunicação, etc.)',
  DESENVOLVIMENTO: 'Fundos focados em desenvolvimento imobiliário e construção',
  HOSPITAIS: 'Fundos que investem em hospitais, clínicas e infraestrutura de saúde',
  HOTEIS: 'Fundos focados em hotéis, resorts e infraestrutura hoteleira',
  AGENCIAS: 'Fundos que investem em agências bancárias',
  RESIDENCIAL: 'Fundos focados em imóveis residenciais (apartamentos, casas)',
  OUTROS: 'Fundos com estratégias não classificadas nas categorias acima',
};

/**
 * Função helper para obter label do segmento
 * @param sector - Segmento do FII
 * @returns Label amigável para exibição
 */
export function getSectorLabel(sector: FiiSector): string {
  return FII_SECTOR_LABELS[sector] || sector;
}

/**
 * Função helper para obter descrição do segmento
 * @param sector - Segmento do FII
 * @returns Descrição detalhada do segmento
 */
export function getSectorDescription(sector: FiiSector): string {
  return FII_SECTOR_DESCRIPTIONS[sector] || '';
}

/**
 * Mapeamento de valores antigos para novos (para compatibilidade reversa)
 * Útil para migração de dados e suporte a uploads com formato antigo
 */
export const LEGACY_SECTOR_MAP: Record<string, FiiSector> = {
  // Enum antigos (uppercase)
  'LOGISTICO': 'LOGISTICA',
  'CORPORATIVO': 'LAJES',
  'TIJOLO': 'LAJES',
  'FUNDOS': 'HEDGE_FUNDS',
  'HIBRIDO': 'HIBRIDOS',

  // Variantes com acentuação (para uploads de Excel)
  'Logístico': 'LOGISTICA',
  'Corporativo': 'LAJES',
  'Tijolo': 'LAJES',
  'Fundos': 'HEDGE_FUNDS',
  'Híbrido': 'HIBRIDOS',

  // Variantes lowercase
  'logístico': 'LOGISTICA',
  'corporativo': 'LAJES',
  'tijolo': 'LAJES',
  'fundos': 'HEDGE_FUNDS',
  'híbrido': 'HIBRIDOS',

  // Labels amigáveis (mesmos valores do FII_SECTOR_LABELS)
  'Lajes Corporativas': 'LAJES',
  'Logística': 'LOGISTICA',
  'Shopping Centers': 'SHOPPING',
  'Varejo/Renda Urbana': 'VAREJO_RENDA_URBANA',
  'Papel (CRIs)': 'PAPEL',
  'Hedge Funds': 'HEDGE_FUNDS',
  'Educacional': 'EDUCACIONAL',
  'Híbridos': 'HIBRIDOS',
  'Agronegócio': 'AGRO',
  'Infraestrutura': 'INFRA',
  'Desenvolvimento': 'DESENVOLVIMENTO',
  'Hospitais': 'HOSPITAIS',
  'Hotéis': 'HOTEIS',
  'Agências Bancárias': 'AGENCIAS',
  'Residencial': 'RESIDENCIAL',
  'Outros': 'OUTROS',
};

/**
 * Normaliza valor de segmento (trata valores antigos e variantes)
 * @param sector - Valor do segmento (pode ser antigo ou novo formato)
 * @returns Segmento normalizado no formato novo
 */
export function normalizeSector(sector: string): FiiSector {
  // Trim e uppercase para comparação
  const normalized = sector.trim();

  // Se é um valor antigo, mapeia para o novo
  if (normalized in LEGACY_SECTOR_MAP) {
    return LEGACY_SECTOR_MAP[normalized];
  }

  // Tenta match case-insensitive no map de legacy
  const legacyKey = Object.keys(LEGACY_SECTOR_MAP).find(
    key => key.toUpperCase() === normalized.toUpperCase()
  );
  if (legacyKey) {
    return LEGACY_SECTOR_MAP[legacyKey];
  }

  // Se é um valor válido, retorna
  const upperNormalized = normalized.toUpperCase() as FiiSector;
  if (FII_SECTORS.includes(upperNormalized)) {
    return upperNormalized;
  }

  // Caso contrário, retorna OUTROS
  console.warn(`Segmento desconhecido: "${sector}". Usando "OUTROS" como fallback.`);
  return 'OUTROS';
}

/**
 * Verifica se um valor é um segmento válido
 * @param sector - Valor a verificar
 * @returns true se é um segmento válido
 */
export function isValidSector(sector: string): sector is FiiSector {
  return FII_SECTORS.includes(sector as FiiSector);
}

/**
 * Retorna lista de opções para Select/Dropdown
 * Útil para formulários
 */
export function getSectorOptions() {
  return FII_SECTORS.map(sector => ({
    value: sector,
    label: getSectorLabel(sector),
    description: getSectorDescription(sector),
  }));
}

/**
 * Agrupa setores por categoria (para filtros avançados)
 */
export const SECTOR_CATEGORIES = {
  TIJOLO: ['LAJES', 'LOGISTICA', 'SHOPPING', 'VAREJO_RENDA_URBANA', 'RESIDENCIAL', 'HOSPITAIS', 'HOTEIS', 'AGENCIAS', 'EDUCACIONAL'],
  PAPEL: ['PAPEL', 'HEDGE_FUNDS'],
  HIBRIDO: ['HIBRIDOS'],
  ESPECIAIS: ['AGRO', 'INFRA', 'DESENVOLVIMENTO'],
  OUTROS: ['OUTROS'],
} as const;

/**
 * Retorna categoria de um segmento
 * @param sector - Segmento do FII
 * @returns Categoria do segmento
 */
export function getSectorCategory(sector: FiiSector): keyof typeof SECTOR_CATEGORIES {
  for (const [category, sectors] of Object.entries(SECTOR_CATEGORIES)) {
    if (sectors.includes(sector as any)) {
      return category as keyof typeof SECTOR_CATEGORIES;
    }
  }
  return 'OUTROS';
}
