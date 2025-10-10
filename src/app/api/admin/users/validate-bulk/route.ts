import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ValidationWarning } from '@/types/bulk-import';

const UserRowSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  rowNumber: z.number(),
});

const BulkValidateSchema = z.object({
  users: z.array(UserRowSchema),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação admin
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
    const validation = BulkValidateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { users } = validation.data;

    // 3. Validar duplicatas na própria lista
    const emailMap = new Map<string, number[]>();
    users.forEach((user) => {
      const rows = emailMap.get(user.email.toLowerCase()) || [];
      rows.push(user.rowNumber);
      emailMap.set(user.email.toLowerCase(), rows);
    });

    const duplicatesInFile = Array.from(emailMap.entries())
      .filter(([, rows]) => rows.length > 1)
      .flatMap(([email, rows]) =>
        rows.map((rowNumber) => ({ email, rowNumber }))
      );

    // 4. Verificar emails já existentes no Clerk
    const existingUsers: Array<{ email: string; rowNumber: number }> = [];

    for (const user of users) {
      try {
        const clerkUsers = await client.users.getUserList({
          emailAddress: [user.email],
        });

        if (clerkUsers.data.length > 0) {
          existingUsers.push({
            email: user.email,
            rowNumber: user.rowNumber,
          });
        }
      } catch (error) {
        console.error(`Erro ao verificar email ${user.email}:`, error);
      }
    }

    // 5. Validações adicionais
    const warnings: ValidationWarning[] = [];

    // Avisar sobre emails de domínios gratuitos (opcional)
    const freeDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
    users.forEach((user) => {
      const domain = user.email.split('@')[1]?.toLowerCase();
      if (domain && freeDomains.includes(domain)) {
        warnings.push({
          rowNumber: user.rowNumber,
          message: `Email de domínio gratuito (${domain}). Verificar se é corporativo.`,
        });
      }
    });

    // 6. Retornar resultado
    return NextResponse.json({
      valid: users.filter(
        (u) =>
          !duplicatesInFile.some((d) => d.rowNumber === u.rowNumber) &&
          !existingUsers.some((e) => e.rowNumber === u.rowNumber)
      ),
      duplicatesInFile,
      existingUsers,
      warnings,
      errors: [],
      summary: {
        total: users.length,
        valid: users.length - duplicatesInFile.length - existingUsers.length,
        duplicates: duplicatesInFile.length,
        existing: existingUsers.length,
      },
    });
  } catch (error) {
    console.error('Erro na validação em massa:', error);
    return NextResponse.json(
      { error: 'Erro ao validar usuários', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
