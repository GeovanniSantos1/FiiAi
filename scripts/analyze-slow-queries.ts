import { prisma } from '../src/lib/db';

/**
 * Script para analisar queries lentas
 * Execução: npx tsx scripts/analyze-slow-queries.ts
 */
async function analyzeSlowQueries() {
  console.log('🔍 Analisando queries lentas...\n');

  try {
    // Verificar se pg_stat_statements está habilitado
    const extension = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_stat_statements';
    `;

    if (extension.length === 0) {
      console.warn('⚠️  pg_stat_statements não está habilitado.');
      console.log('Execute no banco: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\n');
      return;
    }

    // Queries mais lentas (média > 100ms)
    const slowQueries = await prisma.$queryRaw<
      Array<{
        query: string;
        calls: number;
        total_time: number;
        mean_time: number;
        max_time: number;
      }>
    >`
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        max_time
      FROM pg_stat_statements
      WHERE mean_time > 100
        AND query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC
      LIMIT 10;
    `;

    console.log('📊 Top 10 Queries Mais Lentas:\n');
    slowQueries.forEach((q, i) => {
      console.log(`${i + 1}. Query: ${q.query.substring(0, 80)}...`);
      console.log(
        `   Calls: ${q.calls}, Avg: ${Math.round(q.mean_time)}ms, Max: ${Math.round(q.max_time)}ms\n`
      );
    });

    // Queries mais chamadas
    const mostCalled = await prisma.$queryRaw<
      Array<{
        query: string;
        calls: number;
        mean_time: number;
      }>
    >`
      SELECT
        query,
        calls,
        mean_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY calls DESC
      LIMIT 10;
    `;

    console.log('🔥 Top 10 Queries Mais Chamadas:\n');
    mostCalled.forEach((q, i) => {
      console.log(`${i + 1}. Calls: ${q.calls}, Avg: ${Math.round(q.mean_time)}ms`);
      console.log(`   Query: ${q.query.substring(0, 80)}...\n`);
    });
  } catch (error) {
    console.error('❌ Erro ao analisar queries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSlowQueries();
