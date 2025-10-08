'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, CheckCircle2, Circle, Eye, Edit, Trash2, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDeleteRecommendationRules } from '@/hooks/admin/use-recommendation-rules';

interface RecommendationRulesTableProps {
  data: any[];
  isLoading: boolean;
  onActivate: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onViewHistory?: (id: string) => void;
}

export function RecommendationRulesTable({
  data,
  isLoading,
  onActivate,
  onView,
  onEdit,
  onViewHistory,
}: RecommendationRulesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deleteMutation = useDeleteRecommendationRules();

  const handleDelete = async () => {
    if (!selectedId) return;
    await deleteMutation.mutateAsync(selectedId);
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Nenhuma regra encontrada. Crie sua primeira regra para começar.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Criado por</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((ruleset) => (
              <TableRow key={ruleset.id}>
                <TableCell>
                  {ruleset.isActive ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Circle className="h-3 w-3 mr-1" />
                      Inativa
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium">{ruleset.name}</TableCell>
                <TableCell>v{ruleset.version}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ruleset.metadata.source === 'manual' && 'Manual'}
                    {ruleset.metadata.source === 'excel_upload' && 'Excel'}
                    {ruleset.metadata.source === 'api_import' && 'API'}
                  </Badge>
                </TableCell>
                <TableCell>{ruleset.creator?.name || 'N/A'}</TableCell>
                <TableCell>
                  {format(new Date(ruleset.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(ruleset.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                      )}
                      {!ruleset.isActive && (
                        <DropdownMenuItem onClick={() => onActivate(ruleset.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Ativar
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(ruleset.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onViewHistory && (
                        <DropdownMenuItem onClick={() => onViewHistory(ruleset.id)}>
                          <History className="h-4 w-4 mr-2" />
                          Histórico
                        </DropdownMenuItem>
                      )}
                      {!ruleset.isActive && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedId(ruleset.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}