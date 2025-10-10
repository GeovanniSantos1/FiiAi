import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';

const UpdateRegrasSchema = z.object({
  descontoMinimoAceitavel: z.number().min(0).max(100).optional(),
  permitirSemDesconto: z.boolean().optional(),
  toleranciaDesbalanceamento: z.number().min(0).max(50).optional(),
  pesoDesbalanceamento: z.number().min(0).max(100).optional(),
  pesoDesconto: z.number().min(0).max(100).optional(),
  limiteMaximoFundos: z.number().min(1).max(20).optional(),
  alocacaoSequencial: z.boolean().optional(),
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().max(1000).optional(),
});

// GET - Buscar regras ativas
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);

    // Verificar se é admin
    if (!user.isActive) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar regras ativas
    let regras = await db.regrasAporte.findFirst({
      where: { ativo: true },
      orderBy: { atualizadoEm: 'desc' },
    });

    // Se não existir, criar regras padrão
    if (!regras) {
      regras = await db.regrasAporte.create({
        data: {
          nome: 'Regras Padrão',
          descricao: 'Configuração inicial do sistema',
          ativo: true,
          descontoMinimoAceitavel: 0.0,
          permitirSemDesconto: true,
          toleranciaDesbalanceamento: 2.0,
          pesoDesbalanceamento: 60,
          pesoDesconto: 40,
          limiteMaximoFundos: 5,
          alocacaoSequencial: true,
          criadoPor: userId,
        },
      });
    }

    return NextResponse.json(regras, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar regras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Atualizar regras
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserFromClerkId(userId);

    // Verificar se é admin
    if (!user.isActive) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const validation = UpdateRegrasSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validar que pesos somam 100
    if (data.pesoDesbalanceamento !== undefined && data.pesoDesconto !== undefined) {
      if (data.pesoDesbalanceamento + data.pesoDesconto !== 100) {
        return NextResponse.json(
          { error: 'A soma dos pesos deve ser 100%' },
          { status: 400 }
        );
      }
    }

    // Buscar regras ativas
    let regras = await db.regrasAporte.findFirst({
      where: { ativo: true },
      orderBy: { atualizadoEm: 'desc' },
    });

    if (!regras) {
      // Criar se não existir
      regras = await db.regrasAporte.create({
        data: {
          ...data,
          nome: data.nome || 'Regras Padrão',
          ativo: true,
          criadoPor: userId,
        } as any,
      });
    } else {
      // Atualizar existente
      regras = await db.regrasAporte.update({
        where: { id: regras.id },
        data: data as any,
      });
    }

    return NextResponse.json(regras, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao atualizar regras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
