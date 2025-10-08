'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  FileSpreadsheet,
  Plus,
  Upload,
  Download,
  CheckCircle2,
} from 'lucide-react';
import {
  useRecommendationRules,
  useActivateRecommendationRules,
} from '@/hooks/admin/use-recommendation-rules';
import { RecommendationRulesTable } from '@/components/admin/regras/recommendation-rules-table';
import { CreateRulesDialog } from '@/components/admin/regras/create-rules-dialog';
import { UploadExcelDialog } from '@/components/admin/regras/upload-excel-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RegrasRecomendacaoPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: rulesets, isLoading } = useRecommendationRules();
  const activateMutation = useActivateRecommendationRules();

  const rulesetsArray = Array.isArray(rulesets) ? rulesets : [];
  const activeRuleset = rulesetsArray.find((r: any) => r.isActive);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/recommendation-rules/download-template');
      if (!response.ok) throw new Error('Failed to download template');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-regras-recomendacao.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regras de Recomendação FII</h1>
          <p className="text-muted-foreground mt-1">
            Configure e gerencie as regras utilizadas pela IA para análise de portfólios
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template Excel
          </Button>
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Excel
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra Manual
          </Button>
        </div>
      </div>

      {/* Active Ruleset Card */}
      {activeRuleset && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Regra Ativa Atualmente</CardTitle>
              </div>
              <Badge variant="default" className="bg-primary">
                v{activeRuleset.version}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{activeRuleset.name}</span>
                <span className="text-sm text-muted-foreground">
                  Atualizado em {format(new Date(activeRuleset.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeRuleset.metadata?.description || 'Sem descrição'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!activeRuleset && !isLoading && rulesetsArray.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-600">Nenhuma Regra Ativa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Você tem regras configuradas, mas nenhuma está ativa. Ative uma regra para que o sistema possa gerar recomendações.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <Settings className="h-4 w-4 mr-2" />
            Todas as Regras
          </TabsTrigger>
          <TabsTrigger value="about">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Sobre as Regras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <RecommendationRulesTable
            data={rulesetsArray}
            isLoading={isLoading}
            onActivate={(id) => activateMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Como Funcionam as Regras</CardTitle>
              <CardDescription>
                Entenda o sistema de regras configuráveis para recomendação de FIIs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">📊 Tipos de Regras</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Número de Fundos por Capital:</strong> Define quantos FIIs incluir baseado no capital disponível</li>
                  <li><strong>Segmentos Obrigatórios:</strong> Garante diversificação entre setores principais</li>
                  <li><strong>Quantidade por Segmento:</strong> Controla distribuição de fundos em cada setor</li>
                  <li><strong>Alocação Percentual:</strong> Define limites de % do capital por segmento</li>
                  <li><strong>Balanceamento Tijolo vs Papel:</strong> Equilibra FIIs de imóveis físicos vs títulos</li>
                  <li><strong>Fundos Alternativos:</strong> Limita exposição a categorias de maior risco</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">📝 Formas de Configurar</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Manual (JSON):</strong> Edite diretamente a estrutura JSON das regras</li>
                  <li><strong>Upload Excel:</strong> Use o template fornecido para configurar via planilha</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">🔄 Versionamento</h3>
                <p className="text-sm text-muted-foreground">
                  Cada modificação cria uma nova versão, permitindo auditar mudanças e fazer rollback se necessário.
                  O sistema rastreia qual conjunto de regras foi usado em cada análise gerada.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">✅ Ativação</h3>
                <p className="text-sm text-muted-foreground">
                  Apenas uma regra pode estar ativa por vez. Ao ativar uma nova regra, a anterior é desativada automaticamente.
                  Todas as novas análises usarão a regra ativa no momento da execução.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateRulesDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <UploadExcelDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}