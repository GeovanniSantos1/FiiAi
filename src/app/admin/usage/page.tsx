"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Activity, 
  Search, 
  Calendar, 
  User, 
  CreditCard,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAdminUsage } from "@/hooks/use-admin-usage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const OPERATION_TYPES = {
  all: "Todos os tipos",
  AI_TEXT_CHAT: "Chat com IA",
  AI_IMAGE_GENERATION: "Geração de Imagem",
  FII_PORTFOLIO_ANALYSIS: "Análise de Carteira",
  FII_INVESTMENT_RECOMMENDATION: "Recomendação de Investimento"
};

const RANGE_OPTIONS = {
  "24hours": "Últimas 24 horas",
  "7days": "Últimos 7 dias",
  "30days": "Últimos 30 dias",
  "all": "Todo o período"
};

const OPERATION_TYPE_COLORS = {
  AI_TEXT_CHAT: "bg-blue-100 text-blue-800 border-blue-200",
  AI_IMAGE_GENERATION: "bg-purple-100 text-purple-800 border-purple-200",
  FII_PORTFOLIO_ANALYSIS: "bg-green-100 text-green-800 border-green-200",
  FII_INVESTMENT_RECOMMENDATION: "bg-orange-100 text-orange-800 border-orange-200"
};

export default function AdminUsagePage() {
  const [filters, setFilters] = useState({
    type: "all",
    range: "7days",
    q: "",
    page: 1,
    pageSize: 25
  });

  const { data, isLoading, error } = useAdminUsage(filters);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when changing other filters
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      q: searchTerm,
      page: 1
    }));
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getOperationTypeBadge = (type: string) => {
    const colorClass = OPERATION_TYPE_COLORS[type as keyof typeof OPERATION_TYPE_COLORS] || 
                      "bg-gray-100 text-gray-800 border-gray-200";
    
    return (
      <Badge variant="outline" className={colorClass}>
        {OPERATION_TYPES[type as keyof typeof OPERATION_TYPES] || type}
      </Badge>
    );
  };

  const totalPages = data ? Math.ceil(data.total / filters.pageSize) : 0;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Uso</h1>
          <p className="text-muted-foreground mt-2">Monitore o uso das funcionalidades do sistema</p>
        </div>
        <Card className="p-6">
          <div className="text-center text-destructive">
            <p>Erro ao carregar dados de uso</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Histórico de Uso</h1>
        <p className="text-muted-foreground mt-2">Monitore o uso das funcionalidades do sistema</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os dados de uso por tipo, período e usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Operação</label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OPERATION_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select 
                value={filters.range} 
                onValueChange={(value) => handleFilterChange('range', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RANGE_OPTIONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Usuário</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou email..."
                  value={filters.q}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Itens por página</label>
              <Select 
                value={filters.pageSize.toString()} 
                onValueChange={(value) => handleFilterChange('pageSize', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Uso
            </div>
            {data && (
              <div className="text-sm text-muted-foreground">
                {data.total} registro{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Operação</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {item.user.name || 'Usuário sem nome'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getOperationTypeBadge(item.operationType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono">{item.creditsUsed}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(item.timestamp)}
                        </TableCell>
                        <TableCell>
                          {item.details && typeof item.details === 'object' ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {JSON.stringify(item.details).substring(0, 50)}...
                            </code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {filters.page} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      disabled={filters.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      disabled={filters.page >= totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro de uso encontrado</p>
              <p className="text-sm">Tente ajustar os filtros para ver mais resultados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
