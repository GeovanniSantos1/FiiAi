/**
 * Hook para parse de arquivos de fundos (Excel/CSV)
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import { useState } from 'react';
import { parseExcelFundFile, parseCSVFundFile } from '@/lib/parsers/fund-file-parser';
import type { ParsedFundFile } from '@/types/fund-import';

export function useParseFundFile() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = async (file: File): Promise<ParsedFundFile | null> => {
    setIsParsing(true);
    setError(null);

    try {
      // Verificar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 2MB');
      }

      // Verificar extensão
      const extension = file.name.split('.').pop()?.toLowerCase();
      let parsedData: ParsedFundFile;

      if (extension === 'xlsx' || extension === 'xls') {
        parsedData = await parseExcelFundFile(file);
      } else if (extension === 'csv') {
        parsedData = await parseCSVFundFile(file);
      } else {
        throw new Error('Formato não suportado. Use .xlsx, .xls ou .csv');
      }

      // Verificar se tem dados
      if (parsedData.data.length === 0) {
        throw new Error('Arquivo vazio ou sem dados válidos');
      }

      // Verificar limite (max 100 fundos)
      if (parsedData.data.length > 100) {
        throw new Error('Limite de 100 fundos por importação excedido');
      }

      return parsedData;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  return {
    parseFile,
    isParsing,
    error
  };
}
