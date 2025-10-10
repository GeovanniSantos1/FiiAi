import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];

/**
 * POST /api/admin/precos-teto/bulk
 * Atualiza preços teto de múltiplos fundos de uma vez
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário é admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: "Sem permissão de admin" }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Lista de atualizações inválida" },
        { status: 400 }
      );
    }

    // Validar cada atualização
    for (const update of updates) {
      if (!update.fundoId || typeof update.ceilingPrice !== "number" || update.ceilingPrice < 0) {
        return NextResponse.json(
          { error: "Dados de atualização inválidos" },
          { status: 400 }
        );
      }
    }

    // Atualizar todos os fundos em uma transação
    const results = await db.$transaction(
      updates.map((update) =>
        db.recommendedFund.update({
          where: { id: update.fundoId },
          data: { ceilingPrice: update.ceilingPrice },
        })
      )
    );

    return NextResponse.json({ updated: results.length });
  } catch (error) {
    console.error("Error bulk updating preços teto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar preços teto em massa" },
      { status: 500 }
    );
  }
}
