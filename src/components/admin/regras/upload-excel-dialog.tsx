'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUploadRecommendationRulesExcel } from '@/hooks/admin/use-recommendation-rules';
import { Upload } from 'lucide-react';

interface UploadExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadExcelDialog({ open, onOpenChange }: UploadExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');

  const uploadMutation = useUploadRecommendationRulesExcel();

  const handleUpload = async () => {
    if (!file || !name) return;

    await uploadMutation.mutateAsync({ file, name });
    onOpenChange(false);
    setFile(null);
    setName('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload de Regras via Excel</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel com as regras configuradas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Conjunto de Regras</Label>
            <Input
              id="name"
              placeholder="Ex: Regras Q4 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo Excel</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Clique para selecionar arquivo</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apenas arquivos .xlsx ou .xls
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !name || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Processando...' : 'Upload e Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}