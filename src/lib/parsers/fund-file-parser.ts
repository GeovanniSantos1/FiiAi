/**
 * Parsers para arquivos Excel e CSV de importação de fundos
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ParsedFundFile, FundImportRow } from '@/types/fund-import';

interface RawFundRow {
  ticker?: string;
  nome?: string;
  name?: string;
  segmento?: string;
  segment?: string;
  'preço atual'?: string | number;
  'preco atual'?: string | number;
  precoatual?: string | number;
  currentprice?: string | number;
  'preço médio'?: string | number;
  'preco medio'?: string | number;
  precomedio?: string | number;
  averageprice?: string | number;
  'preço teto'?: string | number;
  'preco teto'?: string | number;
  precoteto?: string | number;
  ceilingprice?: string | number;
  'alocação'?: string | number;
  'alocacao'?: string | number;
  allocation?: string | number;
  'recomendação'?: string;
  'recomendacao'?: string;
  recommendation?: string;
}

type FundRecommendation = 'BUY' | 'SELL' | 'HOLD';

/**
 * Normaliza valores de recomendação para o formato esperado
 */
function normalizeRecommendation(value: string): FundRecommendation {
  const normalized = value.toUpperCase().trim();

  const map: Record<string, FundRecommendation> = {
    'COMPRAR': 'BUY',
    'BUY': 'BUY',
    'VENDER': 'SELL',
    'SELL': 'SELL',
    'AGUARDAR': 'HOLD',
    'HOLD': 'HOLD',
    'MANTER': 'HOLD'
  };

  return map[normalized] || 'HOLD';
}

/**
 * Converte valores diversos para número
 */
function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove R$, espaços, e substitui vírgula por ponto
    const cleaned = value.replace(/[R$\s]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

/**
 * Normaliza nomes de colunas (remove acentos, espaços, converte para minúscula)
 */
function normalizeColumnName(col: string): string {
  return col
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '');
}

/**
 * Mapeia linha bruta para objeto FundImportRow
 */
function mapRowToFund(row: RawFundRow, index: number): FundImportRow | null {
  // Tentar pegar ticker
  const ticker = String(row.ticker || '').trim().toUpperCase();
  if (!ticker) return null;

  // Tentar pegar nome
  const nome = String(row.nome || row.name || '').trim();
  if (!nome) return null;

  // Tentar pegar segmento
  const segmento = String(row.segmento || row.segment || '').trim();
  if (!segmento) return null;

  // Preços
  const precoAtual = parseNumber(
    row['preço atual'] || row['preco atual'] || row.precoatual || row.currentprice || 0
  );
  const precoMedio = parseNumber(
    row['preço médio'] || row['preco medio'] || row.precomedio || row.averageprice || 0
  );
  const precoTeto = parseNumber(
    row['preço teto'] || row['preco teto'] || row.precoteto || row.ceilingprice || 0
  );

  // Alocação
  const alocacao = parseNumber(
    row['alocação'] || row['alocacao'] || row.allocation || 0
  );

  // Recomendação
  const recomendacaoRaw = String(
    row['recomendação'] || row['recomendacao'] || row.recommendation || 'HOLD'
  );
  const recomendacao = normalizeRecommendation(recomendacaoRaw);

  return {
    ticker,
    nome,
    segmento,
    precoAtual,
    precoMedio,
    precoTeto,
    alocacao,
    recomendacao,
    rowNumber: index + 2 // +2 por causa do header
  };
}

/**
 * Parse arquivo Excel (.xlsx, .xls)
 */
export async function parseExcelFundFile(file: File): Promise<ParsedFundFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Pegar primeira aba
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Converter para JSON
        const rawData = XLSX.utils.sheet_to_json<RawFundRow>(firstSheet, {
          defval: '',
          raw: false // Para pegar valores como string
        });

        // Normalizar nomes de colunas
        const normalizedData = rawData.map(row => {
          const normalized: any = {};
          Object.keys(row).forEach(key => {
            normalized[normalizeColumnName(key)] = (row as any)[key];
          });
          return normalized;
        });

        // Mapear para formato esperado
        const funds: FundImportRow[] = normalizedData
          .map((row: any, index: number) => mapRowToFund(row, index))
          .filter((row): row is FundImportRow => row !== null);

        if (funds.length === 0) {
          reject(new Error('Nenhum fundo válido encontrado na planilha'));
          return;
        }

        resolve({
          data: funds,
          fileName: file.name,
          fileSize: file.size,
          rowCount: funds.length
        });
      } catch (error: any) {
        reject(new Error(`Erro ao processar Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Parse arquivo CSV
 */
export async function parseCSVFundFile(file: File): Promise<ParsedFundFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawFundRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeColumnName(header),
      complete: (results) => {
        try {
          const funds: FundImportRow[] = results.data
            .map((row, index) => mapRowToFund(row, index))
            .filter((row): row is FundImportRow => row !== null);

          if (funds.length === 0) {
            reject(new Error('Nenhum fundo válido encontrado no CSV'));
            return;
          }

          resolve({
            data: funds,
            fileName: file.name,
            fileSize: file.size,
            rowCount: funds.length
          });
        } catch (error: any) {
          reject(new Error(`Erro ao processar CSV: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao ler CSV: ${error.message}`));
      }
    });
  });
}
