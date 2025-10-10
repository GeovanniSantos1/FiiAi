import { useState } from 'react';
import { parseExcelFile } from '@/lib/parsers/excel-parser';
import { parseCSVFile } from '@/lib/parsers/csv-parser';
import type { ParsedFileData } from '@/types/bulk-import';

export function useParseUserFile() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = async (file: File): Promise<ParsedFileData | null> => {
    setIsParsing(true);
    setError(null);

    try {
      // Verificar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB');
      }

      // Verificar extensão
      const extension = file.name.split('.').pop()?.toLowerCase();
      let parsedData: ParsedFileData;

      if (extension === 'xlsx' || extension === 'xls') {
        parsedData = await parseExcelFile(file);
      } else if (extension === 'csv') {
        parsedData = await parseCSVFile(file);
      } else {
        throw new Error('Formato não suportado. Use .xlsx, .xls ou .csv');
      }

      // Verificar se tem dados
      if (parsedData.data.length === 0) {
        throw new Error('Arquivo vazio ou sem dados válidos');
      }

      // Verificar limite (max 500 usuários)
      if (parsedData.data.length > 500) {
        throw new Error('Limite de 500 usuários por importação excedido');
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
    error,
  };
}
