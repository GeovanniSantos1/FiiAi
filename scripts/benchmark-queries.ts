import { performance } from 'perf_hooks';
import { prisma } from '../src/lib/db';
import {
  getDashboardData,
  getCreditUsageStats,
  getRecentPortfolios,
  getRecentAnalysesWithRecommendations,
} from '../src/lib/db-helpers';

/**
 * Script de benchmark para testar performance das queries
 * PLAN-006 - Testes de Performance
 *
 * Execução: npx tsx scripts/benchmark-queries.ts
 */

interface BenchmarkResult {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
}

const results: BenchmarkResult[] = [];

async function benchmark(name: string, fn: () => Promise<any>): Promise<void> {
  console.log(`\n🔄 Running: ${name}...`);
  const start = performance.now();

  try {
    await fn();
    const end = performance.now();
    const duration = end - start;

    results.push({ name, duration, success: true });
    console.log(`✅ ${name}: ${duration.toFixed(2)}ms`);
  } catch (error) {
    const end = performance.now();
    const duration = end - start;

    results.push({
      name,
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ ${name}: Failed after ${duration.toFixed(2)}ms`);
    console.error(error);
  }
}

async function runBenchmarks() {
  console.log('🚀 Iniciando benchmarks de queries...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Primeiro, vamos buscar um usuário de teste
  const testUser = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true, clerkId: true },
  });

  if (!testUser) {
    console.error('❌ Nenhum usuário encontrado no banco de dados!');
    console.log('Por favor, crie um usuário antes de executar o benchmark.');
    return;
  }

  console.log(`📌 Usando usuário de teste: ${testUser.id}\n`);

  // Benchmark 1: Query simples de usuários ativos
  await benchmark('1. Buscar usuários ativos (100 registros)', async () => {
    await prisma.user.findMany({
      where: { isActive: true },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });
  });

  // Benchmark 2: Query de portfolios recentes
  await benchmark('2. Buscar portfolios recentes (helper otimizado)', async () => {
    await getRecentPortfolios(testUser.id, 10);
  });

  // Benchmark 3: Dashboard paralelo otimizado
  await benchmark('3. Dashboard com queries paralelas', async () => {
    await getDashboardData(testUser.id, testUser.clerkId);
  });

  // Benchmark 4: Analysis reports com join
  await benchmark('4. Analysis reports com recomendações', async () => {
    await getRecentAnalysesWithRecommendations(testUser.id, 10);
  });

  // Benchmark 5: Aggregation de uso de créditos
  await benchmark('5. Aggregação de créditos por tipo', async () => {
    await getCreditUsageStats(testUser.id, 30);
  });

  // Benchmark 6: Query complexa com múltiplos joins
  await benchmark('6. Query complexa (usuário + relações)', async () => {
    await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        creditBalance: true,
        userPortfolios: {
          take: 5,
          orderBy: { uploadedAt: 'desc' },
        },
        analysisReports: {
          take: 5,
          orderBy: { generatedAt: 'desc' },
          include: {
            investmentRecommendations: {
              take: 3,
            },
          },
        },
      },
    });
  });

  // Benchmark 7: Count de notificações
  await benchmark('7. Count de notificações não lidas', async () => {
    await prisma.notification.count({
      where: {
        userId: testUser.id,
        read: false,
      },
    });
  });

  // Benchmark 8: Buscar fundos recomendados
  await benchmark('8. Buscar fundos recomendados', async () => {
    const portfolio = await prisma.recommendedPortfolio.findFirst({
      where: { isActive: true },
    });

    if (portfolio) {
      await prisma.recommendedFund.findMany({
        where: { portfolioId: portfolio.id },
        orderBy: { allocation: 'desc' },
      });
    }
  });

  // Benchmark 9: Query com filtro JSON (se houver dados)
  await benchmark('9. Query com operador JSONB', async () => {
    await prisma.userPortfolio.findMany({
      where: { userId: testUser.id },
      take: 5,
    });
  });

  // Benchmark 10: Queries múltiplas em paralelo
  await benchmark('10. Múltiplas queries em paralelo', async () => {
    await Promise.all([
      prisma.user.findUnique({ where: { id: testUser.id } }),
      prisma.creditBalance.findFirst({ where: { userId: testUser.id } }),
      prisma.userPortfolio.count({ where: { userId: testUser.id } }),
      prisma.analysisReport.count({ where: { userId: testUser.id } }),
      prisma.notification.count({
        where: { userId: testUser.id, read: false },
      }),
    ]);
  });

  // Resultados finais
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 RESULTADOS DO BENCHMARK\n');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Sucesso: ${successful.length}/${results.length}`);
  console.log(`❌ Falhas: ${failed.length}/${results.length}\n`);

  if (successful.length > 0) {
    const avgDuration =
      successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const maxDuration = Math.max(...successful.map((r) => r.duration));
    const minDuration = Math.min(...successful.map((r) => r.duration));

    console.log('📈 Estatísticas (queries bem-sucedidas):');
    console.log(`   Média: ${avgDuration.toFixed(2)}ms`);
    console.log(`   Mais rápida: ${minDuration.toFixed(2)}ms`);
    console.log(`   Mais lenta: ${maxDuration.toFixed(2)}ms\n`);

    console.log('🎯 Queries ordenadas por performance:\n');
    successful
      .sort((a, b) => a.duration - b.duration)
      .forEach((r, i) => {
        const emoji = r.duration < 100 ? '🚀' : r.duration < 500 ? '⚡' : '🐌';
        console.log(`${i + 1}. ${emoji} ${r.name}: ${r.duration.toFixed(2)}ms`);
      });
  }

  if (failed.length > 0) {
    console.log('\n❌ Queries com falhas:\n');
    failed.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name}`);
      console.log(`   Erro: ${r.error}\n`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✨ Benchmark concluído!\n');

  // Análise de performance
  console.log('📋 ANÁLISE DE PERFORMANCE:\n');

  const slowQueries = successful.filter((r) => r.duration > 500);
  if (slowQueries.length > 0) {
    console.log(`⚠️  ${slowQueries.length} queries lentas (> 500ms):`);
    slowQueries.forEach((r) => {
      console.log(`   • ${r.name}: ${r.duration.toFixed(2)}ms`);
    });
    console.log();
  } else {
    console.log('✅ Todas as queries estão performando bem (< 500ms)\n');
  }

  const verySlowQueries = successful.filter((r) => r.duration > 1000);
  if (verySlowQueries.length > 0) {
    console.log(`🚨 ${verySlowQueries.length} queries MUITO lentas (> 1s):`);
    verySlowQueries.forEach((r) => {
      console.log(`   • ${r.name}: ${r.duration.toFixed(2)}ms`);
    });
    console.log('\n   Considere adicionar índices ou otimizar estas queries.\n');
  }

  await prisma.$disconnect();
}

// Executar
runBenchmarks().catch((error) => {
  console.error('❌ Erro fatal no benchmark:', error);
  prisma.$disconnect();
  process.exit(1);
});
