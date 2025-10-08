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
import { Textarea } from '@/components/ui/textarea';
import { useCreateRecommendationRules } from '@/hooks/admin/use-recommendation-rules';

interface CreateRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Default rule template
const defaultRules = {
  fundCountByCapital: {
    ranges: [
      { minCapital: 0, maxCapital: 30000, minFunds: 1, maxFunds: 10, recommended: 8 },
      { minCapital: 30000, maxCapital: 100000, minFunds: 10, maxFunds: 15, recommended: 12 },
      { minCapital: 100000, maxCapital: null, minFunds: 15, maxFunds: 20, recommended: 18 },
    ],
  },
  mandatorySegments: {
    segments: ['LAJES', 'LOGISTICA', 'SHOPPING', 'VAREJO_RENDA_URBANA', 'PAPEL'],
    alertOnMissing: true,
  },
  fundsPerSegment: {
    byCapitalRange: [
      {
        minCapital: 0,
        maxCapital: 30000,
        segmentRules: {
          LAJES: { min: 1, max: 1, recommended: 1 },
          LOGISTICA: { min: 2, max: 2, recommended: 2 },
          SHOPPING: { min: 2, max: 2, recommended: 2 },
          VAREJO_RENDA_URBANA: { min: 1, max: 2, recommended: 1 },
          PAPEL: { min: 3, max: 3, recommended: 3 },
          ALTERNATIVOS: { min: 0, max: 2, recommended: 1 },
        },
      },
      {
        minCapital: 30000,
        maxCapital: 100000,
        segmentRules: {
          LAJES: { min: 2, max: 2, recommended: 2 },
          LOGISTICA: { min: 2, max: 3, recommended: 2 },
          SHOPPING: { min: 2, max: 3, recommended: 3 },
          VAREJO_RENDA_URBANA: { min: 2, max: 2, recommended: 2 },
          PAPEL: { min: 3, max: 5, recommended: 4 },
          ALTERNATIVOS: { min: 0, max: 3, recommended: 2 },
        },
      },
      {
        minCapital: 100000,
        maxCapital: null,
        segmentRules: {
          LAJES: { min: 2, max: 2, recommended: 2 },
          LOGISTICA: { min: 2, max: 3, recommended: 3 },
          SHOPPING: { min: 2, max: 3, recommended: 3 },
          VAREJO_RENDA_URBANA: { min: 2, max: 2, recommended: 2 },
          PAPEL: { min: 5, max: 6, recommended: 5 },
          ALTERNATIVOS: { min: 0, max: 4, recommended: 3 },
        },
      },
    ],
  },
  allocationPercentage: {
    segments: {
      LAJES: { min: 5, max: 10, recommended: 7 },
      LOGISTICA: { min: 15, max: 20, recommended: 18 },
      SHOPPING: { min: 15, max: 20, recommended: 18 },
      VAREJO_RENDA_URBANA: { min: 10, max: 15, recommended: 12 },
      PAPEL: { min: 30, max: 40, recommended: 35 },
      ALTERNATIVOS: { min: 0, max: 10, recommended: 5 },
    },
    alertOnOutOfRange: true,
  },
  tijoloPapelBalance: {
    tijolo: {
      segments: ['LAJES', 'LOGISTICA', 'SHOPPING', 'VAREJO_RENDA_URBANA'],
      minPercentage: 50,
      maxPercentage: 70,
      recommendedPercentage: 60,
    },
    papel: {
      segments: ['PAPEL'],
      minPercentage: 30,
      maxPercentage: 40,
      recommendedPercentage: 35,
    },
    alertOnImbalance: true,
  },
  alternativeFunds: {
    categories: ['AGRO', 'INFRA', 'HIBRIDOS', 'FOFS', 'EDUCACIONAL', 'DESENVOLVIMENTO'],
    maxPercentage: 15,
    idealMaxPercentage: 10,
    alertThreshold: 12,
  },
  intraSegmentBalance: {
    enabled: true,
    maxDeviationPercentage: 10,
    alertOnImbalance: true,
  },
  general: {
    enforceStrictCompliance: false,
    allowOverrides: true,
    confidenceThreshold: 0.7,
  },
};

export function CreateRulesDialog({ open, onOpenChange }: CreateRulesDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rulesJson, setRulesJson] = useState(JSON.stringify(defaultRules, null, 2));
  const [error, setError] = useState('');

  const createMutation = useCreateRecommendationRules();

  const handleCreate = async () => {
    try {
      setError('');

      // Validate JSON
      const rules = JSON.parse(rulesJson);

      const data = {
        name,
        rules,
        metadata: {
          source: 'manual',
          description,
        },
      };

      await createMutation.mutateAsync(data);
      onOpenChange(false);
      // Reset form
      setName('');
      setDescription('');
      setRulesJson(JSON.stringify(defaultRules, null, 2));
    } catch (err: any) {
      setError(err.message || 'JSON inválido');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Regras Manualmente</DialogTitle>
          <DialogDescription>
            Configure as regras de recomendação editando o JSON abaixo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Conjunto de Regras</Label>
            <Input
              id="name"
              placeholder="Ex: Regras Conservadoras"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito dessas regras..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Regras (JSON)</Label>
            <Textarea
              id="rules"
              value={rulesJson}
              onChange={(e) => setRulesJson(e.target.value)}
              className="font-mono text-xs"
              rows={20}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name || createMutation.isPending}
          >
            {createMutation.isPending ? 'Criando...' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}