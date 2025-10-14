import { z } from 'zod';
import { FII_SECTORS } from '@/types/fii-sectors';

export const FundRecommendationEnum = z.enum(['BUY', 'SELL', 'HOLD']);

export const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updatePortfolioSchema = createPortfolioSchema.partial();

export const createFundSchema = z.object({
  ticker: z.string()
    .min(1, 'Ticker é obrigatório')
    .max(10, 'Ticker deve ter no máximo 10 caracteres')
    .transform(val => val.toUpperCase())
    .refine(val => /^[A-Z]{4}[0-9]{2}$/.test(val), 'Ticker deve seguir o padrão XXXX11 (ex: HGLG11)'),
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  segment: z.enum(FII_SECTORS, {
    errorMap: () => ({ message: 'Segmento inválido. Selecione um segmento da lista.' })
  }),
  currentPrice: z.number()
    .positive('Preço atual deve ser positivo')
    .max(10000, 'Preço atual deve ser menor que R$ 10.000')
    .transform(val => Number(val.toFixed(2))),
  averagePrice: z.number()
    .positive('Preço médio deve ser positivo')
    .max(10000, 'Preço médio deve ser menor que R$ 10.000')
    .transform(val => Number(val.toFixed(2))),
  ceilingPrice: z.number()
    .positive('Preço teto deve ser positivo')
    .max(10000, 'Preço teto deve ser menor que R$ 10.000')
    .transform(val => Number(val.toFixed(2))),
  allocation: z.number()
    .min(0, 'Alocação deve ser positiva')
    .max(100, 'Alocação deve estar entre 0-100%')
    .transform(val => Number(val.toFixed(2))),
  recommendation: FundRecommendationEnum,
});

export const updateFundSchema = createFundSchema.partial();

// Schema para validar alocação total da carteira
export const validatePortfolioAllocationSchema = z.object({
  funds: z.array(z.object({
    allocation: z.number(),
    id: z.string().optional()
  }))
}).refine(
  data => {
    const totalAllocation = data.funds.reduce((sum, fund) => sum + fund.allocation, 0);
    return totalAllocation <= 100;
  },
  {
    message: 'A soma das alocações não pode exceder 100%',
    path: ['funds']
  }
);

// Schema para bulk operations
export const bulkFundOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  funds: z.array(z.union([createFundSchema, updateFundSchema.extend({ id: z.string() }), z.object({ id: z.string() })]))
});

export type CreatePortfolioData = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioData = z.infer<typeof updatePortfolioSchema>;
export type CreateFundData = z.infer<typeof createFundSchema>;
export type UpdateFundData = z.infer<typeof updateFundSchema>;
export type FundRecommendation = z.infer<typeof FundRecommendationEnum>;
export type ValidatePortfolioAllocationData = z.infer<typeof validatePortfolioAllocationSchema>;
export type BulkFundOperationData = z.infer<typeof bulkFundOperationSchema>;

// Utility types for API responses
export type PortfolioWithFunds = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  funds: RecommendedFundType[];
  _count?: {
    funds: number;
  };
};

export type RecommendedFundType = {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  segment: string;
  currentPrice: number;
  averagePrice: number;
  ceilingPrice: number;
  allocation: number;
  recommendation: FundRecommendation;
  createdAt: Date;
  updatedAt: Date;
};

// Helper functions for validation
export const validateTicker = (ticker: string): boolean => {
  return /^[A-Z]{4}[0-9]{2}$/.test(ticker.toUpperCase());
};

export const validateAllocation = (allocation: number): boolean => {
  return allocation >= 0 && allocation <= 100;
};

export const calculateTotalAllocation = (funds: Array<{ allocation: number }>): number => {
  return funds.reduce((sum, fund) => sum + fund.allocation, 0);
};

// Recommendation display helpers
export const getRecommendationLabel = (recommendation: FundRecommendation): string => {
  const labels = {
    BUY: 'Comprar',
    SELL: 'Vender',
    HOLD: 'Aguardar'
  };
  return labels[recommendation];
};

export const getRecommendationColor = (recommendation: FundRecommendation): string => {
  const colors = {
    BUY: 'success',
    SELL: 'destructive',
    HOLD: 'secondary'
  };
  return colors[recommendation];
};