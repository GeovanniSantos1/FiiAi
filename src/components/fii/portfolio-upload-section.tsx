"use client"

import React, { useState } from "react";
import { PortfolioUploader } from "./portfolio-uploader";
import { usePortfolioUpload } from "@/hooks/use-portfolio-upload";
import { usePortfolioAnalysis } from "@/hooks/use-portfolio-analysis";
import { PortfolioAnalysisSection } from "./portfolio-analysis-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, TrendingUp, PieChart, Target, Brain } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function PortfolioUploadSection() {
  const { uploading, uploadResult, uploadPortfolio, clearResult } = usePortfolioUpload();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { analyzePortfolio, isAnalyzing } = usePortfolioAnalysis(uploadResult?.id);

  const handleUpload = async (file: File) => {
    try {
      await uploadPortfolio(file);
      setShowAnalysis(false); // Reset analysis view when new upload
    } catch (error) {
      // Error is already handled in the hook
      console.error("Upload failed:", error);
    }
  };

  const handleAnalyzePortfolio = () => {
    if (uploadResult?.id) {
      analyzePortfolio(uploadResult.id);
      setShowAnalysis(true);
    }
  };

  const handleViewRecommendations = () => {
    setShowAnalysis(true);
  };

  if (uploadResult) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <CardTitle>Carteira Carregada com Sucesso!</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearResult}
              >
                Carregar Nova Carteira
              </Button>
            </div>
            <CardDescription>
              Sua carteira foi processada e está pronta para análise pelos agentes de IA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="bg-background border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(uploadResult.totalValue)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">FIIs na Carteira</p>
                    <p className="text-lg font-semibold">{uploadResult.positionsCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Linhas Processadas</p>
                    <p className="text-lg font-semibold">
                      {uploadResult.positionsCount + uploadResult.skippedRows}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {uploadResult.positions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Posições Principais (Preview)</h4>
                <div className="space-y-2">
                  {uploadResult.positions.map((position, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {position.fiiCode}
                        </Badge>
                        {position.fiiName && (
                          <span className="text-sm text-muted-foreground">
                            {position.fiiName}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(position.currentValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {position.quantity.toLocaleString()} cotas
                          {position.percentage && ` • ${position.percentage.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {uploadResult.positionsCount > 5 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    E mais {uploadResult.positionsCount - 5} posições...
                  </p>
                )}
              </div>
            )}

            {uploadResult.skippedRows > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ {uploadResult.skippedRows} linha(s) foram ignoradas devido a dados inválidos ou incompletos.
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button 
                className="flex-1" 
                onClick={handleAnalyzePortfolio}
                disabled={isAnalyzing || !uploadResult?.id}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analisar Carteira
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleViewRecommendations}
                disabled={!uploadResult?.id}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Ver Recomendações
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Show analysis section when requested */}
        {showAnalysis && uploadResult?.id && (
          <PortfolioAnalysisSection 
            portfolioId={uploadResult.id}
            portfolioName={"Sua Carteira"}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Upload da Sua Carteira
          </CardTitle>
          <CardDescription>
            Envie um arquivo Excel ou CSV com suas posições atuais em FIIs para análise personalizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PortfolioUploader onUpload={handleUpload} />
          
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Formato do Arquivo</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Colunas obrigatórias:</strong> Código do FII, Quantidade de Cotas, Preço Médio
              </p>
              <p>
                <strong>Colunas opcionais:</strong> Nome do FII, Preço Atual, Valor Total, Setor
              </p>
              <p>
                <strong>Formatos aceitos:</strong> .xlsx, .xls, .csv (máximo 10MB)
              </p>
              <p>
                <strong>Exemplo de cabeçalhos:</strong> "Código", "Quantidade", "Preço Médio", "Valor Total"
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> O sistema reconhece automaticamente colunas em português e inglês. 
                Não precisa se preocupar com o formato exato dos cabeçalhos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}