'use client';

import { Check, X, AlertTriangle } from 'lucide-react';
import type { UserImportRow, ValidationError } from '@/types/bulk-import';

interface ImportDataPreviewProps {
  data: UserImportRow[];
  errors: ValidationError[];
  onDataChange: (data: UserImportRow[]) => void;
}

export function ImportDataPreview({ data, errors, onDataChange }: ImportDataPreviewProps) {
  const getRowError = (rowNumber: number) => {
    return errors.filter((e) => e.rowNumber === rowNumber);
  };

  const hasError = (rowNumber: number) => {
    return errors.some((e) => e.rowNumber === rowNumber);
  };

  const handleRemoveRow = (rowNumber: number) => {
    onDataChange(data.filter((row) => row.rowNumber !== rowNumber));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Preview dos Dados ({data.length} usuários)</h3>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-success-500">
            <Check className="h-4 w-4" />
            {data.filter((row) => !hasError(row.rowNumber)).length} válidos
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <X className="h-4 w-4" />
            {errors.length} erros
          </span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-12">#</th>
              <th className="px-3 py-2 text-left font-medium">Nome</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium w-12">Status</th>
              <th className="px-3 py-2 text-center font-medium w-20">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const rowErrors = getRowError(row.rowNumber);
              const isInvalid = rowErrors.length > 0;

              return (
                <tr
                  key={row.rowNumber}
                  className={`border-t ${isInvalid ? 'bg-destructive/5' : ''}`}
                >
                  <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                  <td className="px-3 py-2">{row.nome}</td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">
                    {isInvalid ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Check className="h-4 w-4 text-success-500" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleRemoveRow(row.rowNumber)}
                      className="text-destructive hover:underline text-xs"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="font-medium text-destructive mb-2">Erros encontrados:</p>
          <ul className="text-sm space-y-1">
            {errors.slice(0, 10).map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground">Linha {error.rowNumber}:</span>
                <span>
                  <strong>{error.field}</strong> - {error.error}
                </span>
              </li>
            ))}
            {errors.length > 10 && (
              <li className="text-muted-foreground italic">
                + {errors.length - 10} erros adicionais
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
