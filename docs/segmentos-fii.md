# Segmentos de Fundos Imobiliários (FII) - FiiAI

**Data de Atualização:** 2025-10-13
**Versão:** 2.0

## 📊 Visão Geral

O sistema FiiAI trabalha com 16 segmentos distintos de Fundos de Investimento Imobiliário (FIIs), organizados para refletir as categorias atuais do mercado brasileiro.

## 🏢 Segmentos Disponíveis

### 1. **Lajes Corporativas (LAJES)**
- **Descrição:** Fundos que investem em lajes corporativas e edifícios comerciais de escritórios
- **Exemplos:** HGLG11, BRCR11, JSRE11
- **Características:** Renda de aluguel de empresas, contratos de longo prazo, concentração em grandes centros
- **Cor no Sistema:** Azul

### 2. **Logística (LOGISTICA)**
- **Descrição:** Fundos focados em galpões logísticos e centros de distribuição
- **Exemplos:** HGBS11, BTLG11, XPLG11
- **Características:** Alta demanda do e-commerce, contratos atrelados à inflação, localização estratégica
- **Cor no Sistema:** Laranja

### 3. **Shopping Centers (SHOPPING)**
- **Descrição:** Fundos que investem em shopping centers e outlets
- **Exemplos:** HGBS11, VISC11, XPML11
- **Características:** Renda variável (% sobre vendas), sazonalidade, gestão ativa
- **Cor no Sistema:** Roxo

### 4. **Varejo/Renda Urbana (VAREJO_RENDA_URBANA)**
- **Descrição:** Fundos com imóveis de varejo de rua, lojas e renda urbana
- **Exemplos:** KNRI11, HSML11, VRTA11
- **Características:** Diversificação geográfica, contratos pulverizados, mix de varejo
- **Cor no Sistema:** Rosa

### 5. **Papel (CRIs) (PAPEL)**
- **Descrição:** Fundos que investem em papéis (CRIs, LCIs, LCAs e outros recebíveis)
- **Exemplos:** MXRF11, RBRF11, KNCR11
- **Características:** Alta liquidez, exposição a crédito, diversificação de emissores
- **Cor no Sistema:** Verde

### 6. **Hedge Funds (FOFs) (HEDGE_FUNDS)**
- **Descrição:** Fundos de fundos (FOFs) - investem em cotas de outros FIIs
- **Exemplos:** BCFF11, RBRR11, VIUR11
- **Características:** Diversificação automática, gestão profissional, menor volatilidade
- **Cor no Sistema:** Índigo

### 7. **Educacional (EDUCACIONAL)**
- **Descrição:** Fundos que investem em instituições de ensino (escolas, universidades)
- **Exemplos:** VGIR11, KFOF11
- **Características:** Contratos de longo prazo, setor regulado, demanda estrutural
- **Cor no Sistema:** Ciano

### 8. **Híbridos (HIBRIDOS)**
- **Descrição:** Fundos com estratégia mista combinando tijolo e papel
- **Exemplos:** HGCR11, BTCR11
- **Características:** Diversificação de risco, flexibilidade de gestão, balanceamento ativo
- **Cor no Sistema:** Violeta

### 9. **Agronegócio (AGRO)**
- **Descrição:** Fundos focados em propriedades rurais e agronegócio
- **Exemplos:** BTCR11, RURA11
- **Características:** Exposição ao agronegócio, contratos de arrendamento, sazonalidade agrícola
- **Cor no Sistema:** Lima

### 10. **Infraestrutura (INFRA)**
- **Descrição:** Fundos de infraestrutura (energia, torres de telecomunicação, etc.)
- **Exemplos:** TORD11, SNCI11
- **Características:** Contratos de concessão, indexação à inflação, setor regulado
- **Cor no Sistema:** Âmbar

### 11. **Desenvolvimento (DESENVOLVIMENTO)**
- **Descrição:** Fundos focados em desenvolvimento imobiliário e construção
- **Exemplos:** ALZR11, VILG11
- **Características:** Maior risco, potencial de ganho de capital, ciclo de desenvolvimento
- **Cor no Sistema:** Teal

### 12. **Hospitais (HOSPITAIS)**
- **Descrição:** Fundos que investem em hospitais, clínicas e infraestrutura de saúde
- **Exemplos:** NSLU11, HSLG11
- **Características:** Contratos de longo prazo, setor essencial, operadores especializados
- **Cor no Sistema:** Vermelho

### 13. **Hotéis (HOTEIS)**
- **Descrição:** Fundos focados em hotéis, resorts e infraestrutura hoteleira
- **Exemplos:** HTMX11, JHSF11
- **Características:** Renda variável (% sobre receita), sazonalidade turística, gestão hoteleira
- **Cor no Sistema:** Fúcsia

### 14. **Agências Bancárias (AGENCIAS)**
- **Descrição:** Fundos que investem em agências bancárias
- **Exemplos:** BBFI11B, BBPO11
- **Características:** Inquilinos de alta qualidade, contratos de longo prazo, localização prime
- **Cor no Sistema:** Esmeralda

### 15. **Residencial (RESIDENCIAL)**
- **Descrição:** Fundos focados em imóveis residenciais (apartamentos, casas)
- **Exemplos:** HGRE11, IRDM11
- **Características:** Pulverização de inquilinos, programa habitacional, gestão intensiva
- **Cor no Sistema:** Azul Celeste

### 16. **Outros (OUTROS)**
- **Descrição:** Fundos com estratégias não classificadas nas categorias acima
- **Exemplos:** Fundos multiestratégias, nichos específicos
- **Características:** Variadas, estratégias inovadoras
- **Cor no Sistema:** Cinza

---

## 🔄 Migração dos Segmentos Antigos

### Mapeamento de Conversão

| Segmento Antigo | Segmento Novo | Justificativa |
|----------------|---------------|---------------|
| Logístico | Logística | Correção ortográfica |
| Corporativo | Lajes | Especificação mais precisa (lajes corporativas) |
| Tijolo | Lajes | Consolidação em categoria mais específica |
| Fundos | Hedge Funds | Termo mais preciso (Fundos de Fundos) |
| Híbrido | Híbridos | Ajuste para plural |
| Shopping | Shopping | Mantido igual |
| Papel | Papel | Mantido igual |
| Residencial | Residencial | Mantido igual |
| Outros | Outros | Mantido igual |

### Novos Segmentos (sem equivalente anterior)
- Varejo/Renda Urbana
- Educacional
- Agronegócio
- Infraestrutura
- Desenvolvimento
- Hospitais
- Hotéis
- Agências Bancárias

---

## 💻 Uso no Sistema

### Frontend (React/Next.js)

```typescript
import { getSectorLabel, getSectorOptions, SectorBadge } from '@/types/fii-sectors';

// Obter label amigável
const label = getSectorLabel('LOGISTICA'); // "Logística"

// Usar opções em Select
const options = getSectorOptions();

// Exibir badge colorido
<SectorBadge sector="LOGISTICA" />
```

### Backend (Services)

```typescript
import { normalizeSector, isValidSector } from '@/types/fii-sectors';

// Normalizar segmento de entrada (compatibilidade reversa)
const sector = normalizeSector('Logístico'); // "LOGISTICA"

// Validar segmento
if (isValidSector(input)) {
  // OK
}
```

### Banco de Dados (Prisma)

```prisma
enum FiiSector {
  LAJES
  LOGISTICA
  SHOPPING
  // ... todos os 16 segmentos
}
```

---

## 📈 Categorias de Segmentos

Para análises agregadas, os segmentos são organizados em categorias:

### Tijolo (Imóveis Físicos)
- Lajes Corporativas
- Logística
- Shopping Centers
- Varejo/Renda Urbana
- Residencial
- Hospitais
- Hotéis
- Agências Bancárias
- Educacional

### Papel (Recebíveis)
- Papel (CRIs)
- Hedge Funds

### Híbrido
- Híbridos

### Especiais
- Agronegócio
- Infraestrutura
- Desenvolvimento

### Outros
- Outros

---

## 🎨 Design System - Cores dos Segmentos

Cada segmento possui uma cor específica no sistema para facilitar identificação visual:

| Segmento | Cor Base | Classe Tailwind |
|----------|----------|-----------------|
| Lajes | Azul | `blue-500` |
| Logística | Laranja | `orange-500` |
| Shopping | Roxo | `purple-500` |
| Varejo/Renda Urbana | Rosa | `pink-500` |
| Papel | Verde | `green-500` |
| Hedge Funds | Índigo | `indigo-500` |
| Educacional | Ciano | `cyan-500` |
| Híbridos | Violeta | `violet-500` |
| Agro | Lima | `lime-500` |
| Infra | Âmbar | `amber-500` |
| Desenvolvimento | Teal | `teal-500` |
| Hospitais | Vermelho | `red-500` |
| Hotéis | Fúcsia | `fuchsia-500` |
| Agências | Esmeralda | `emerald-500` |
| Residencial | Azul Celeste | `sky-500` |
| Outros | Cinza | `gray-500` |

---

## 🔗 Referências

- **B3:** Classificação oficial de FIIs
- **ANBIMA:** Categorização de fundos imobiliários
- **Relatórios Setoriais:** Análises de mercado 2024-2025

---

**Documentação mantida pelo:** Database Agent
**Última revisão:** 2025-10-13
