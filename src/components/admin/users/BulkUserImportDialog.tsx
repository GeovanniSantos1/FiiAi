'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from './FileUploadZone';
import { ImportDataPreview } from './ImportDataPreview';
import { useParseUserFile } from '@/hooks/admin/use-parse-user-file';
import { useValidateBulkUsers, useBulkImportUsers } from '@/hooks/admin/use-bulk-import-users';
import { validateImportData } from '@/lib/validators/user-import-validator';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import type { UserImportRow, ParsedFileData } from '@/types/bulk-import';

interface BulkUserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'processing' | 'complete';

export function BulkUserImportDialog({ open, onOpenChange }: BulkUserImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [users, setUsers] = useState<UserImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<Array<{rowNumber: number; field: string; message: string}>>([]);

  const { parseFile, isParsing, error: parseError } = useParseUserFile();
  const validateMutation = useValidateBulkUsers();
  const importMutation = useBulkImportUsers();

  const handleFileSelect = async (file: File) => {
    const data = await parseFile(file);
    if (data) {
      setParsedData(data);
      setUsers(data.data);

      // Validar localmente
      const validation = validateImportData(data.data);
      setValidationErrors(validation.errors);

      setStep('preview');
      toast.success(`${data.rowCount} usuários carregados`);
    }
  };

  const handleValidateOnServer = async () => {
    try {
      const result = await validateMutation.mutateAsync(users);

      if (result.existingUsers.length > 0) {
        toast.warning(`${result.existingUsers.length} emails já existem no sistema`);
      }

      if (result.duplicatesInFile.length > 0) {
        toast.error(`${result.duplicatesInFile.length} emails duplicados na planilha`);
        return;
      }

      toast.success('Validação concluída! Pronto para importar.');
    } catch {
      toast.error('Erro ao validar usuários no servidor');
    }
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error('Corrija os erros antes de importar');
      return;
    }

    setStep('processing');

    try {
      const result = await importMutation.mutateAsync(users);

      setStep('complete');
      toast.success(`${result.succeeded} usuários criados com sucesso!`);

      if (result.failed > 0) {
        toast.error(`${result.failed} falharam. Verifique o relatório.`);
      }
    } catch {
      toast.error('Erro ao importar usuários');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setParsedData(null);
    setUsers([]);
    setValidationErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Usuários em Massa</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha com nome e email dos usuários para criar convites em lote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'upload' && (
            <FileUploadZone
              onFileSelect={handleFileSelect}
              isProcessing={isParsing}
              error={parseError}
            />
          )}

          {step === 'preview' && parsedData && (
            <>
              <ImportDataPreview
                data={users}
                errors={validationErrors}
                onDataChange={setUsers}
              />

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Voltar
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleValidateOnServer}
                  disabled={validateMutation.isPending}
                >
                  Validar no Servidor
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validationErrors.length > 0 || importMutation.isPending}
                >
                  Importar {users.length} Usuários
                </Button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Processando importação...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Isso pode levar alguns minutos
              </p>
            </div>
          )}

          {step === 'complete' && importMutation.data && (
            <div className="text-center py-12">
              <div className="rounded-full bg-success-500/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check className="h-8 w-8 text-success-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Importação Concluída!</h3>
              <div className="space-y-2 text-sm">
                <p>✅ {importMutation.data.succeeded} usuários criados</p>
                {importMutation.data.failed > 0 && (
                  <p className="text-destructive">❌ {importMutation.data.failed} falharam</p>
                )}
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
