'use client';

/**
 * Componente: Zona de upload de arquivo com drag & drop
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FundFileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  error?: string | null;
}

export function FundFileUploadZone({
  onFileSelect,
  isProcessing,
  error
}: FundFileUploadZoneProps) {
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
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleDownloadTemplate = () => {
    // Fazer download do arquivo Excel estático
    const link = document.createElement('a');
    link.href = '/templates/Template-FII-carteira.xlsx';
    link.download = 'Template-FII-carteira.xlsx';
    link.click();
  };

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
            <p>Tamanho máximo: 2MB | Limite: 100 fundos</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Template e exemplo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Botão de download do template */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="font-medium mb-2 text-sm">📥 Template da Planilha</p>
          <p className="text-xs text-muted-foreground mb-3">
            Baixe o template com as colunas corretas
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Template Excel
          </Button>
        </div>

        {/* Formato esperado */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="font-medium mb-2 text-sm">📋 Colunas Obrigatórias</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li><strong>Ticker:</strong> Código do FII (ex: HGLG11)</li>
            <li><strong>Nome:</strong> Nome completo</li>
            <li><strong>Segmento:</strong> Logística, Papel, Shopping...</li>
            <li><strong>Preços:</strong> Atual, Médio, Teto (R$)</li>
            <li><strong>Alocação:</strong> Percentual (0-100%)</li>
            <li><strong>Recomendação:</strong> Comprar/Vender/Aguardar</li>
          </ul>
        </div>
      </div>

      {/* Avisos importantes */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="font-medium text-amber-900 dark:text-amber-100 text-sm mb-2">
          ⚠️ Pontos importantes:
        </p>
        <ul className="text-xs space-y-1 text-amber-800 dark:text-amber-200">
          <li>A soma das alocações deve ser exatamente 100%</li>
          <li>Fundos já existentes serão atualizados</li>
          <li>Novos fundos serão adicionados</li>
          <li>Use "Modo Substituir" para apagar todos e importar novos</li>
        </ul>
      </div>
    </div>
  );
}
