/**
 * Script para popular preços teto iniciais dos FIIs
 * Execute com: npx ts-node scripts/seed-precos-teto.ts
 */

import { db } from '../src/lib/db';

const precosTeto = [
  { fiiCode: 'HGRE11', valorTeto: 150.99 },
  { fiiCode: 'BTLG11', valorTeto: 106.95 },
  { fiiCode: 'LVBI11', valorTeto: 105.63 },
  { fiiCode: 'TRXF11', valorTeto: 110.63 },
  { fiiCode: 'XPML11', valorTeto: 115.14 },
  { fiiCode: 'HSML11', valorTeto: 83.85 },
  { fiiCode: 'HGRU11', valorTeto: 125.44 },
  { fiiCode: 'CVBI11', valorTeto: 92.73 },
  { fiiCode: 'VGIP11', valorTeto: 88.54 },
  { fiiCode: 'WHGR11', valorTeto: 10.00 },
  { fiiCode: 'RBRY11', valorTeto: 97.56 },
  { fiiCode: 'PVBI11', valorTeto: 100.00 },
];

async function main() {
  console.log('🌱 Populando preços teto iniciais...');

  for (const preco of precosTeto) {
    await db.fiiPrecoTeto.upsert({
      where: { fiiCode: preco.fiiCode },
      update: {
        valorTeto: preco.valorTeto,
        fonte: 'sistema',
      },
      create: {
        fiiCode: preco.fiiCode,
        valorTeto: preco.valorTeto,
        fonte: 'sistema',
      },
    });
    console.log(`✅ ${preco.fiiCode}: R$ ${preco.valorTeto.toFixed(2)}`);
  }

  console.log('\\n✨ Preços teto populados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
