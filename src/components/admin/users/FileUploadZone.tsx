'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  error?: string | null;
}

export function FileUploadZone({ onFileSelect, isProcessing, error }: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          ${error ? 'border-destructive' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            {isDragActive ? (
              <Upload className="h-8 w-8 text-primary animate-bounce" />
            ) : (
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium">
              {isDragActive ? 'Solte o arquivo aqui' : 'Arraste e solte a planilha'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique para selecionar
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Formatos aceitos: .xlsx, .xls, .csv</p>
            <p>Tamanho máximo: 5MB | Limite: 500 usuários</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Template de exemplo */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <p className="font-medium mb-2">📄 Formato esperado da planilha:</p>
        <div className="bg-background rounded border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Nome</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2">João Silva</td>
                <td className="px-3 py-2">joao@email.com</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2">Maria Santos</td>
                <td className="px-3 py-2">maria@email.com</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
