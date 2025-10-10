import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];

/**
 * PATCH /api/admin/precos-teto/[fundoId]
 * Atualiza o preço teto de um fundo específico
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ fundoId: string }> }
) {
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

    const { fundoId } = await params;
    const body = await request.json();
    const { ceilingPrice } = body;

    if (typeof ceilingPrice !== "number" || ceilingPrice < 0) {
      return NextResponse.json(
        { error: "Preço teto inválido" },
        { status: 400 }
      );
    }

    // Verificar se o fundo existe
    const fundoExists = await db.recommendedFund.findUnique({
      where: { id: fundoId },
    });

    if (!fundoExists) {
      return NextResponse.json({ error: "Fundo não encontrado" }, { status: 404 });
    }

    // Atualizar preço teto
    const updatedFundo = await db.recommendedFund.update({
      where: { id: fundoId },
      data: { ceilingPrice },
    });

    return NextResponse.json(updatedFundo);
  } catch (error) {
    console.error("Error updating preço teto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar preço teto" },
      { status: 500 }
    );
  }
}
