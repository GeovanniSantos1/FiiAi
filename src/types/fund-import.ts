/**
 * Types para importação em lote de fundos em carteiras recomendadas
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

export interface FundImportRow {
  ticker: string;
  nome: string;
  segmento: string;
  precoAtual: number;
  precoMedio: number;
  precoTeto: number;
  alocacao: number;
  recomendacao: 'BUY' | 'SELL' | 'HOLD';
  rowNumber: number; // Linha original na planilha
}

export interface FundValidationError {
  rowNumber: number;
  field: keyof Omit<FundImportRow, 'rowNumber'>;
  error: string;
  value: any;
}

export interface FundValidationWarning {
  rowNumber: number;
  message: string;
}

export interface FundImportValidationResult {
  valid: FundImportRow[];
  errors: FundValidationError[];
  warnings: FundValidationWarning[];
  existingFunds: Array<{
    ticker: string;
    rowNumber: number;
    action: 'UPDATE';
  }>;
  newFunds: Array<{
    ticker: string;
    rowNumber: number;
    action: 'INSERT';
  }>;
  totalAllocation: number;
  allocationValid: boolean;
  summary?: {
    total: number;
    valid: number;
    toCreate: number;
    toUpdate: number;
    errors: number;
    warnings: number;
  };
}

export interface FundImportProgress {
  total: number;
  processed: number;
  created: number;
  updated: number;
  failed: number;
}

export interface FundImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    ticker: string;
    error: string;
  }>;
  finalAllocation: number;
  duration: number; // ms
  timestamp: Date;
}

export interface ParsedFundFile {
  data: FundImportRow[];
  fileName: string;
  fileSize: number;
  rowCount: number;
}
