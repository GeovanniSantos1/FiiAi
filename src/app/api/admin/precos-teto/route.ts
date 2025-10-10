import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];

/**
 * GET /api/admin/precos-teto
 * Lista todos os fundos de todas as carteiras com seus preços teto
 */
export async function GET() {
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

    // Buscar todos os fundos de todas as carteiras recomendadas
    const fundos = await db.recommendedFund.findMany({
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { portfolio: { name: "asc" } },
        { ticker: "asc" },
      ],
    });

    console.log(`[Preços Teto] Found ${fundos.length} funds`);

    // Calcular desconto para cada fundo
    const fundosComDesconto = fundos.map((fundo) => {
      // Converter Decimal para Number
      const currentPrice = Number(fundo.currentPrice);
      const ceilingPrice = Number(fundo.ceilingPrice);

      let desconto = null;
      if (ceilingPrice && currentPrice) {
        desconto = ((ceilingPrice - currentPrice) / ceilingPrice) * 100;
      }

      return {
        id: fundo.id,
        ticker: fundo.ticker,
        name: fundo.name,
        segment: fundo.segment,
        currentPrice,
        ceilingPrice,
        portfolioId: fundo.portfolioId,
        portfolioName: fundo.portfolio.name,
        desconto,
      };
    });

    console.log(`[Preços Teto] Returning ${fundosComDesconto.length} funds with prices converted`);

    return NextResponse.json(fundosComDesconto);
  } catch (error) {
    console.error("Error fetching precos teto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar preços teto" },
      { status: 500 }
    );
  }
}
