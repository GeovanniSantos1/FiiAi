/**
 * Validador de dados para importação de fundos
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import type {
  FundImportRow,
  FundValidationError,
  FundImportValidationResult
} from '@/types/fund-import';
import { isValidSector, normalizeSector } from '@/types/fii-sectors';

const TICKER_REGEX = /^[A-Z]{4}\d{1,2}[A-Z]?$/; // Ex: HGLG11, BTLG11B

const VALID_RECOMMENDATIONS = ['BUY', 'SELL', 'HOLD'] as const;

/**
 * Valida dados de importação de fundos localmente
 */
export function validateFundImportData(
  funds: FundImportRow[]
): Pick<FundImportValidationResult, 'valid' | 'errors'> {
  const errors: FundValidationError[] = [];
  const valid: FundImportRow[] = [];

  funds.forEach(fund => {
    let hasError = false;

    // Validar ticker
    if (!fund.ticker || fund.ticker.length === 0) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'ticker',
        error: 'Ticker é obrigatório',
        value: fund.ticker
      });
      hasError = true;
    } else if (!TICKER_REGEX.test(fund.ticker.toUpperCase())) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'ticker',
        error: 'Ticker inválido (formato esperado: HGLG11)',
        value: fund.ticker
      });
      hasError = true;
    }

    // Validar nome
    if (!fund.nome || fund.nome.length < 3) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'nome',
        error: 'Nome é obrigatório (mínimo 3 caracteres)',
        value: fund.nome
      });
      hasError = true;
    }

    // Validar segmento
    if (!isValidSector(fund.segmento)) {
      // Tenta normalizar
      const normalized = normalizeSector(fund.segmento);
      if (normalized === 'OUTROS' && fund.segmento.toUpperCase() !== 'OUTROS') {
        errors.push({
          rowNumber: fund.rowNumber,
          field: 'segmento',
          error: `Segmento inválido: "${fund.segmento}"`,
          value: fund.segmento
        });
        hasError = true;
      }
    }

    // Validar preços
    if (fund.precoAtual <= 0) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'precoAtual',
        error: 'Preço atual deve ser maior que zero',
        value: fund.precoAtual
      });
      hasError = true;
    }

    if (fund.precoMedio <= 0) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'precoMedio',
        error: 'Preço médio deve ser maior que zero',
        value: fund.precoMedio
      });
      hasError = true;
    }

    if (fund.precoTeto <= 0) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'precoTeto',
        error: 'Preço teto deve ser maior que zero',
        value: fund.precoTeto
      });
      hasError = true;
    }

    // Validar alocação
    if (fund.alocacao < 0 || fund.alocacao > 100) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'alocacao',
        error: 'Alocação deve estar entre 0% e 100%',
        value: fund.alocacao
      });
      hasError = true;
    }

    // Validar recomendação
    if (!VALID_RECOMMENDATIONS.includes(fund.recomendacao as any)) {
      errors.push({
        rowNumber: fund.rowNumber,
        field: 'recomendacao',
        error: 'Recomendação inválida (use: BUY, SELL ou HOLD)',
        value: fund.recomendacao
      });
      hasError = true;
    }

    if (!hasError) {
      valid.push(fund);
    }
  });

  return { valid, errors };
}
