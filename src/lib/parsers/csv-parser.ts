import Papa from 'papaparse';
import type { ParsedFileData, UserImportRow } from '@/types/bulk-import';

export function parseCSVFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    Papa.parse<{ nome?: string; email?: string }>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: (results) => {
        try {
          const users: UserImportRow[] = results.data
            .map((row, index) => ({
              nome: String(row.nome || row['name'] || '').trim(),
              email: String(row.email || row['e-mail'] || '').trim().toLowerCase(),
              rowNumber: index + 2, // +2 por causa do header
            }))
            .filter((row) => row.nome || row.email);

          resolve({
            data: users,
            fileName: file.name,
            fileSize: file.size,
            rowCount: users.length,
          });
        } catch (error: any) {
          reject(new Error(`Erro ao processar CSV: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao ler CSV: ${error.message}`));
      },
    });
  });
}
