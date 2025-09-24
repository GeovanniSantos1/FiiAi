"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Building2,
  TrendingUp,
  Percent,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAdminRecommendedPortfolio,
  useCreateRecommendedPortfolio,
  useUpdateRecommendedPortfolio,
  useDeleteRecommendedPortfolio,
  type RecommendedPortfolio,
  type CreatePortfolioData,
  type UpdatePortfolioData,
} from "@/hooks/admin/use-admin-recommended-portfolio";
import { FiiSector } from "@prisma/client";

const SECTOR_LABELS = {
  LOGISTICO: "Logístico",
  SHOPPING: "Shopping",
  CORPORATIVO: "Corporativo",
  RESIDENCIAL: "Residencial",
  TIJOLO: "Tijolo",
  PAPEL: "Papel",
  FUNDOS: "Fundos",
  HIBRIDO: "Híbrido",
  OUTROS: "Outros",
} as const;

const SECTOR_COLORS = {
  LOGISTICO: "bg-blue-100 text-blue-800",
  SHOPPING: "bg-purple-100 text-purple-800",
  CORPORATIVO: "bg-green-100 text-green-800",
  RESIDENCIAL: "bg-yellow-100 text-yellow-800",
  TIJOLO: "bg-orange-100 text-orange-800",
  PAPEL: "bg-pink-100 text-pink-800",
  FUNDOS: "bg-indigo-100 text-indigo-800",
  HIBRIDO: "bg-cyan-100 text-cyan-800",
  OUTROS: "bg-gray-100 text-gray-800",
} as const;

export default function CarteiraRecomendadaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  
  // Create/Edit Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState<CreatePortfolioData>({
    fiiCode: "",
    fiiName: "",
    sector: FiiSector.LOGISTICO,
    percentage: 0,
    reasoning: "",
    isActive: true,
  });

  // Hooks
  const { data, loading, refetch } = useAdminRecommendedPortfolio(
    page,
    50,
    searchTerm,
    selectedSector || undefined,
    activeFilter === "all" ? undefined : activeFilter
  );
  
  const { createPortfolio, loading: createLoading } = useCreateRecommendedPortfolio();
  const { updatePortfolio, loading: updateLoading } = useUpdateRecommendedPortfolio();
  const { deletePortfolio, loading: deleteLoading } = useDeleteRecommendedPortfolio();

  // Form handlers
  const resetForm = () => {
    setFormData({
      fiiCode: "",
      fiiName: "",
      sector: FiiSector.LOGISTICO,
      percentage: 0,
      reasoning: "",
      isActive: true,
    });
  };

  const handleCreate = async () => {
    const success = await createPortfolio(formData);
    if (success) {
      setCreateOpen(false);
      resetForm();
      refetch();
    }
  };

  const handleEdit = (portfolio: RecommendedPortfolio) => {
    setEditId(portfolio.id);
    setFormData({
      fiiCode: portfolio.fiiCode,
      fiiName: portfolio.fiiName,
      sector: portfolio.sector,
      percentage: portfolio.percentage,
      reasoning: portfolio.reasoning || "",
      isActive: portfolio.isActive,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    const success = await updatePortfolio(editId, formData);
    if (success) {
      setEditOpen(false);
      setEditId(null);
      resetForm();
      refetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await deletePortfolio(deleteId);
    if (success) {
      setDeleteOpen(false);
      setDeleteId(null);
      refetch();
    }
  };

  // Table columns
  const columns = [
    {
      header: "Código FII",
      accessorKey: "fiiCode",
      cell: ({ row }: { row: { original: RecommendedPortfolio } }) => (
        <div className="font-mono font-semibold text-primary">
          {row.original.fiiCode}
        </div>
      ),
    },
    {
      header: "Nome",
      accessorKey: "fiiName",
      cell: ({ row }: { row: { original: RecommendedPortfolio } }) => (
        <div className="font-medium">{row.original.fiiName}</div>
      ),
    },
    {
      header: "Setor",
      accessorKey: "sector",
      cell: ({ row }: { row: { original: RecommendedPortfolio } }) => (
        <Badge 
          variant="secondary" 
          className={`${SECTOR_COLORS[row.original.sector]} border-0`}
        >
          {SECTOR_LABELS[row.original.sector]}
        </Badge>
      ),
    },
    {
      header: "Percentual",
      accessorKey: "percentage",
      cell: ({ row }: { row: { original: RecommendedPortfolio } }) => (
        <div className="flex items-center gap-1 font-medium">
          <Percent className="h-3 w-3" />
          {row.original.percentage.toFixed(2)}%
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }: { row: { original: RecommendedPortfolio } }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }: { row: { original: RecommendedPortfolio } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => {
                setDeleteId(row.original.id);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Carteira Recomendada
          </h1>
          <p className="text-muted-foreground">
            Gerencie os FIIs recomendados para usuários da plataforma FiiAI
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar FII
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar FII à Carteira Recomendada</DialogTitle>
              <DialogDescription>
                Configure os dados do fundo imobiliário a ser adicionado
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fiiCode">Código FII *</Label>
                  <Input
                    id="fiiCode"
                    placeholder="HGLG11"
                    value={formData.fiiCode}
                    onChange={(e) => setFormData({ ...formData, fiiCode: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentual (%) *</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiiName">Nome do FII *</Label>
                <Input
                  id="fiiName"
                  placeholder="Nome completo do fundo"
                  value={formData.fiiName}
                  onChange={(e) => setFormData({ ...formData, fiiName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Setor *</Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) => setFormData({ ...formData, sector: value as FiiSector })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reasoning">Justificativa</Label>
                <Textarea
                  id="reasoning"
                  placeholder="Por que este FII está sendo recomendado?"
                  rows={3}
                  value={formData.reasoning}
                  onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Ativo na carteira recomendada</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
                disabled={createLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createLoading}>
                {createLoading ? "Adicionando..." : "Adicionar FII"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total FIIs</p>
                <p className="text-xl font-semibold">{data.pagination.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-xl font-semibold">
                  {data.portfolios.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Alocado</p>
                <p className="text-xl font-semibold">{data.totalPercentage.toFixed(2)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Restante</p>
                <p className="text-xl font-semibold">
                  {Math.max(0, 100 - data.totalPercentage).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome do FII..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os setores</SelectItem>
            {Object.entries(SECTOR_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={data?.portfolios || []} 
        loading={loading}
      />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar FII</DialogTitle>
            <DialogDescription>
              Atualize as informações do fundo imobiliário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fiiCode">Código FII *</Label>
                <Input
                  id="edit-fiiCode"
                  value={formData.fiiCode}
                  onChange={(e) => setFormData({ ...formData, fiiCode: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-percentage">Percentual (%) *</Label>
                <Input
                  id="edit-percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fiiName">Nome do FII *</Label>
              <Input
                id="edit-fiiName"
                value={formData.fiiName}
                onChange={(e) => setFormData({ ...formData, fiiName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sector">Setor *</Label>
              <Select
                value={formData.sector}
                onValueChange={(value) => setFormData({ ...formData, sector: value as FiiSector })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reasoning">Justificativa</Label>
              <Textarea
                id="edit-reasoning"
                rows={3}
                value={formData.reasoning}
                onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Ativo na carteira recomendada</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditOpen(false);
                setEditId(null);
                resetForm();
              }}
              disabled={updateLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateLoading}>
              {updateLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este FII da carteira recomendada? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteOpen(false);
                setDeleteId(null);
              }}
              disabled={deleteLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}