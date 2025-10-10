import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FundoForm } from '@/components/admin/carteiras/FundoForm';

interface NovoFundoPageProps {
  params: Promise<{ id: string }>;
}

export default async function NovoFundoPage({ params }: NovoFundoPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/carteiras/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Adicionar Fundo</h1>
          <p className="text-muted-foreground">
            Adicione um novo fundo à carteira recomendada
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <FundoForm portfolioId={id} />
      </div>
    </div>
  );
}