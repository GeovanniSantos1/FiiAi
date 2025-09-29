import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CarteiraForm } from '@/components/admin/carteiras/CarteiraForm';

export default function NovaCarteiraPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/carteiras">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Carteira Recomendada</h1>
          <p className="text-muted-foreground">
            Crie uma nova carteira de FIIs recomendados para os usuários
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CarteiraForm />
      </div>
    </div>
  );
}