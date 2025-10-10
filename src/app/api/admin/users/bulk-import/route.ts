import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { UserImportRow } from '@/types/bulk-import';

const BATCH_SIZE = 10; // Processar 10 por vez
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo

const UserRowSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  rowNumber: z.number(),
});

const BulkImportSchema = z.object({
  users: z.array(UserRowSchema),
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function inviteUserWithRetry(
  client: Awaited<ReturnType<typeof clerkClient>>,
  email: string,
  nome: string,
  attempts = RETRY_ATTEMPTS
): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < attempts; i++) {
    try {
      // Primeiro, verificar se usuário já existe
      const existingUsers = await client.users.getUserList({
        emailAddress: [email],
      });

      if (existingUsers.data && existingUsers.data.length > 0) {
        return {
          success: false,
          error: 'Usuário já existe no sistema',
        };
      }

      // Verificar se já existe convite pendente
      const existingInvitations = await client.invitations.getInvitationList();
      const pendingInvite = existingInvitations.data.find(
        (inv) => inv.emailAddress === email && inv.status === 'pending'
      );

      if (pendingInvite) {
        // Reenviar convite existente
        await client.invitations.revokeInvitation(pendingInvite.id);
      }

      // Criar convite por email
      await client.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up'}`,
        publicMetadata: {
          name: nome,
          importedVia: 'bulk-import',
          importedAt: new Date().toISOString(),
        },
      });

      return { success: true };
    } catch (error) {
      // Capturar detalhes do erro do Clerk
      const clerkError = error as {
        status?: number;
        message?: string;
        errors?: Array<{ message: string; longMessage?: string }>;
        clerkError?: boolean;
      };

      // Extrair mensagem de erro detalhada
      let errorMessage = clerkError.message || 'Erro ao enviar convite';
      if (clerkError.errors && clerkError.errors.length > 0) {
        errorMessage = clerkError.errors[0].longMessage || clerkError.errors[0].message || errorMessage;
      }

      console.error(`Tentativa ${i + 1} falhou para ${email}:`, {
        status: clerkError.status,
        message: errorMessage,
        errors: clerkError.errors,
      });

      // Se for erro 422, não tentar novamente (erro de validação)
      if (clerkError.status === 422) {
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Se for erro de rate limit, aguardar mais tempo
      if (clerkError.status === 429 && i < attempts - 1) {
        await sleep(RETRY_DELAY * (i + 1) * 2); // Backoff exponencial
        continue;
      }

      // Se for último retry, retornar erro
      if (i === attempts - 1) {
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Aguardar antes do próximo retry
      await sleep(RETRY_DELAY * (i + 1));
    }
  }

  return { success: false, error: 'Falha após múltiplas tentativas' };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Sem permissão de admin' }, { status: 403 });
    }

    // 2. Validar payload
    const body = await request.json();
    const validation = BulkImportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { users } = validation.data;

    // 3. Processar em lotes
    const results: Array<{ rowNumber: number; email: string; error: string }> = [];
    let succeeded = 0;
    let failed = 0;

    // Dividir em chunks
    const chunks: UserImportRow[][] = [];
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      chunks.push(users.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processando ${users.length} usuários em ${chunks.length} lotes...`);

    for (let batchIndex = 0; batchIndex < chunks.length; batchIndex++) {
      const chunk = chunks[batchIndex];
      console.log(`Processando lote ${batchIndex + 1}/${chunks.length}...`);

      // Processar chunk em paralelo
      await Promise.all(
        chunk.map(async (user) => {
          const result = await inviteUserWithRetry(client, user.email, user.nome);

          if (result.success) {
            succeeded++;
          } else {
            failed++;
            results.push({
              rowNumber: user.rowNumber,
              email: user.email,
              error: result.error || 'Erro desconhecido',
            });
          }

          return result;
        })
      );

      // Aguardar entre lotes para não sobrecarregar API
      if (batchIndex < chunks.length - 1) {
        await sleep(500);
      }
    }

    const duration = Date.now() - startTime;

    // 4. Retornar resultado
    return NextResponse.json({
      total: users.length,
      succeeded,
      failed,
      errors: results,
      duration,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Erro na importação em massa:', error);
    return NextResponse.json(
      { error: 'Erro ao importar usuários', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
