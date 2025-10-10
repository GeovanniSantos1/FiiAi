import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando fundos no banco de dados...\n');

  const fundos = await prisma.recommendedFund.findMany({
    include: {
      portfolio: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log(`Total de fundos encontrados: ${fundos.length}\n`);

  if (fundos.length > 0) {
    console.log('Fundos:');
    fundos.forEach((fundo) => {
      console.log(`- ${fundo.ticker} (${fundo.name})`);
      console.log(`  Carteira: ${fundo.portfolio.name}`);
      console.log(`  Preço Atual: R$ ${fundo.currentPrice}`);
      console.log(`  Preço Teto: R$ ${fundo.ceilingPrice}`);
      console.log(`  Portfolio ID: ${fundo.portfolioId}\n`);
    });
  } else {
    console.log('Nenhum fundo encontrado no banco de dados.');
  }
}

main()
  .catch((e) => {
    console.error('Erro ao buscar fundos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
