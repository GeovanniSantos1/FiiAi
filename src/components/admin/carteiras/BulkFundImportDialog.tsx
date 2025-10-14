'use client';

/**
 * Componente: Dialog principal de importação em massa de fundos
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FundFileUploadZone } from './FundFileUploadZone';
import { FundImportPreview } from './FundImportPreview';
import { useParseFundFile } from '@/hooks/admin/use-parse-fund-file';
import { useValidateBulkFunds, useBulkImportFunds } from '@/hooks/admin/use-bulk-import-funds';
import { validateFundImportData } from '@/lib/validators/fund-import-validator';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import type { FundImportRow, ParsedFundFile } from '@/types/fund-import';

interface BulkFundImportDialogProps {
  portfolioId: string;
  portfolioName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'processing' | 'complete';
type ImportMode = 'merge' | 'replace';

export function BulkFundImportDialog({
  portfolioId,
  portfolioName,
  open,
  onOpenChange
}: BulkFundImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [parsedData, setParsedData] = useState<ParsedFundFile | null>(null);
  const [funds, setFunds] = useState<FundImportRow[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);

  const { parseFile, isParsing, error: parseError } = useParseFundFile();
  const validateMutation = useValidateBulkFunds(portfolioId);
  const importMutation = useBulkImportFunds(portfolioId);

  const handleFileSelect = async (file: File) => {
    const data = await parseFile(file);
    if (data) {
      setParsedData(data);
      setFunds(data.data);

      // Validar localmente
      const localValidation = validateFundImportData(data.data);

      setStep('preview');
      toast.success(`${data.rowCount} fundos carregados para validação`);

      // Validar no servidor automaticamente
      handleValidateOnServer(data.data);
    }
  };

  const handleValidateOnServer = async (fundsToValidate?: FundImportRow[]) => {
    const dataToValidate = fundsToValidate || funds;

    try {
      const result = await validateMutation.mutateAsync(dataToValidate);
      setValidationResult(result);

      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erro(s) encontrado(s). Corrija antes de importar.`);
      } else if (!result.allocationValid) {
        toast.warning(`Alocação total = ${result.totalAllocation.toFixed(1)}%. Ajuste para 100%.`);
      } else {
        toast.success('✅ Validação OK! Pronto para importar.');
      }
    } catch (error) {
      toast.error('Erro ao validar fundos no servidor');
    }
  };

  const handleImport = async () => {
    if (!validationResult) {
      toast.error('Execute a validação primeiro');
      return;
    }

    if (validationResult.errors.length > 0) {
      toast.error('Corrija os erros antes de importar');
      return;
    }

    if (!validationResult.allocationValid) {
      toast.error('Alocação total deve somar 100%');
      return;
    }

    setStep('processing');

    try {
      const result = await importMutation.mutateAsync({
        funds: validationResult.valid,
        mode: importMode
      });

      setStep('complete');

      const message = importMode === 'replace'
        ? `Carteira substituída! ${result.created} fundos criados.`
        : `${result.created} fundos criados, ${result.updated} atualizados!`;

      toast.success(message);

      if (result.failed > 0) {
        toast.error(`${result.failed} falharam. Verifique o relatório.`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar fundos');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setImportMode('merge');
    setParsedData(null);
    setFunds([]);
    setValidationResult(null);
    onOpenChange(false);
  };

  const canImport = validationResult &&
    validationResult.errors.length === 0 &&
    validationResult.allocationValid;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Fundos em Lote</DialogTitle>
          <DialogDescription>
            Carteira: <strong>{portfolioName}</strong> - Faça upload de uma planilha
            com os fundos para adicionar/atualizar em massa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <FundFileUploadZone
              onFileSelect={handleFileSelect}
              isProcessing={isParsing}
              error={parseError}
            />
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && parsedData && validationResult && (
            <>
              {/* Seletor de modo */}
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-sm font-medium mb-3 block">
                  Modo de Importação:
                </Label>
                <RadioGroup
                  value={importMode}
                  onValueChange={(value) => setImportMode(value as ImportMode)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 bg-background rounded-lg p-3 border">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Mesclar (Merge)</p>
                        <p className="text-xs text-muted-foreground">
                          Adiciona novos e atualiza existentes
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-background rounded-lg p-3 border border-amber-200">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Substituir (Replace)</p>
                        <p className="text-xs text-muted-foreground">
                          Remove todos e importa novos
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Preview dos dados */}
              <FundImportPreview
                data={funds}
                errors={validationResult.errors}
                existingFunds={validationResult.existingFunds}
                newFunds={validationResult.newFunds}
                totalAllocation={validationResult.totalAllocation}
                onDataChange={(newData) => {
                  setFunds(newData);
                  handleValidateOnServer(newData);
                }}
              />

              {/* Ações */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Voltar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleValidateOnServer()}
                  disabled={validateMutation.isPending}
                >
                  {validateMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Revalidar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!canImport || importMutation.isPending}
                >
                  {importMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Importar {validationResult.valid.length} Fundos
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Processando importação...</p>
              <p className="text-sm text-muted-foreground mt-2">
                {importMode === 'replace'
                  ? 'Substituindo fundos da carteira...'
                  : 'Adicionando e atualizando fundos...'}
              </p>
            </div>
          )}

          {/* STEP 4: Complete */}
          {step === 'complete' && importMutation.data && (
            <div className="text-center py-12">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                Importação Concluída!
              </h3>
              <div className="space-y-2 text-sm">
                <p>✅ {importMutation.data.created} fundos criados</p>
                <p>🔄 {importMutation.data.updated} fundos atualizados</p>
                {importMutation.data.failed > 0 && (
                  <p className="text-destructive">
                    ❌ {importMutation.data.failed} falharam
                  </p>
                )}
                <p className="text-muted-foreground">
                  Alocação final: {importMutation.data.finalAllocation.toFixed(1)}%
                </p>
                <p className="text-muted-foreground">
                  Processado em {(importMutation.data.duration / 1000).toFixed(1)}s
                </p>
              </div>
              <Button onClick={handleClose} className="mt-6">
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
