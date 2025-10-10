import * as XLSX from 'xlsx';
import type { ParsedFileData, UserImportRow } from '@/types/bulk-import';

export function parseExcelFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Pegar primeira aba
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Converter para JSON
        const rawData = XLSX.utils.sheet_to_json<{ nome?: string; email?: string }>(
          firstSheet,
          { defval: '' }
        );

        // Mapear para formato esperado
        const users: UserImportRow[] = rawData
          .map((row, index) => ({
            nome: String(row.nome || row['Nome'] || '').trim(),
            email: String(row.email || row['Email'] || row['E-mail'] || '').trim().toLowerCase(),
            rowNumber: index + 2, // +2 porque Excel começa em 1 e tem header
          }))
          .filter((row) => row.nome || row.email); // Remover linhas vazias

        resolve({
          data: users,
          fileName: file.name,
          fileSize: file.size,
          rowCount: users.length,
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
