'use client';

/**
 * Componente: Preview de dados importados com validação
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import { Check, X, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import type { FundImportRow, FundValidationError } from '@/types/fund-import';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FundImportPreviewProps {
  data: FundImportRow[];
  errors: FundValidationError[];
  existingFunds: Array<{ ticker: string; rowNumber: number; action: 'UPDATE' }>;
  newFunds: Array<{ ticker: string; rowNumber: number; action: 'INSERT' }>;
  totalAllocation: number;
  onDataChange: (data: FundImportRow[]) => void;
}

export function FundImportPreview({
  data,
  errors,
  existingFunds,
  newFunds,
  totalAllocation,
  onDataChange
}: FundImportPreviewProps) {
  const getRowError = (rowNumber: number) => {
    return errors.filter(e => e.rowNumber === rowNumber);
  };

  const hasError = (rowNumber: number) => {
    return errors.some(e => e.rowNumber === rowNumber);
  };

  const getRowAction = (rowNumber: number): 'INSERT' | 'UPDATE' | 'ERROR' => {
    if (hasError(rowNumber)) return 'ERROR';
    if (existingFunds.some(f => f.rowNumber === rowNumber)) return 'UPDATE';
    return 'INSERT';
  };

  const handleRemoveRow = (rowNumber: number) => {
    onDataChange(data.filter(row => row.rowNumber !== rowNumber));
  };

  const allocationValid = Math.abs(totalAllocation - 100) < 0.1;

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Preview dos Dados ({data.length} fundos)
        </h3>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Plus className="h-4 w-4 text-blue-500" />
            {newFunds.length} novos
          </span>
          <span className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4 text-amber-500" />
            {existingFunds.length} atualizar
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <X className="h-4 w-4" />
            {errors.length} erros
          </span>
        </div>
      </div>

      {/* Totalizador de alocação */}
      <div className={`p-4 rounded-lg border ${
        allocationValid
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Alocação Total:</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${
              allocationValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {totalAllocation.toFixed(1)}%
            </span>
            {allocationValid ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
          </div>
        </div>
        {!allocationValid && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            A alocação deve somar exatamente 100% (diferença: {(totalAllocation - 100).toFixed(1)}%)
          </p>
        )}
      </div>

      {/* Tabela de fundos */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-12">#</th>
                <th className="px-3 py-2 text-left font-medium">Ticker</th>
                <th className="px-3 py-2 text-left font-medium">Nome</th>
                <th className="px-3 py-2 text-left font-medium">Segmento</th>
                <th className="px-3 py-2 text-right font-medium">Atual</th>
                <th className="px-3 py-2 text-right font-medium">Teto</th>
                <th className="px-3 py-2 text-right font-medium">Aloc%</th>
                <th className="px-3 py-2 text-center font-medium w-24">Ação</th>
                <th className="px-3 py-2 text-center font-medium w-20">Remover</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => {
                const action = getRowAction(row.rowNumber);

                return (
                  <tr
                    key={row.rowNumber}
                    className={`border-t ${
                      action === 'ERROR' ? 'bg-destructive/5' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2 font-mono font-medium">
                      {row.ticker}
                    </td>
                    <td className="px-3 py-2 text-xs">{row.nome}</td>
                    <td className="px-3 py-2 text-xs">{row.segmento}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      R$ {row.precoAtual.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      R$ {row.precoTeto.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {row.alocacao.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-center">
                      {action === 'INSERT' && (
                        <Badge variant="default" className="text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Novo
                        </Badge>
                      )}
                      {action === 'UPDATE' && (
                        <Badge variant="secondary" className="text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Atualizar
                        </Badge>
                      )}
                      {action === 'ERROR' && (
                        <Badge variant="destructive" className="text-xs">
                          <X className="h-3 w-3 mr-1" />
                          Erro
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRow(row.rowNumber)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de erros */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="font-medium text-destructive mb-2 text-sm">
            ❌ {errors.length} erro(s) encontrado(s):
          </p>
          <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground font-mono">
                  L{error.rowNumber}:
                </span>
                <span>
                  <strong>{error.field}</strong> - {error.error}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
