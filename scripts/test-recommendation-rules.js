/**
 * Script de teste rápido para o sistema de regras de recomendação
 *
 * Execute com: node scripts/test-recommendation-rules.js
 *
 * Pré-requisitos:
 * - Servidor rodando em http://localhost:3000
 * - Usuário admin autenticado (copie o cookie de sessão)
 */

const BASE_URL = 'http://localhost:3000';

// Cole aqui o valor do cookie __session do Clerk após fazer login
const SESSION_COOKIE = 'SEU_COOKIE_AQUI'; // Ex: __session=xxx

const headers = {
  'Content-Type': 'application/json',
  'Cookie': SESSION_COOKIE
};

async function testAPI(endpoint, method = 'GET', body = null) {
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n🧪 ${method} ${endpoint}`);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      return data;
    } else {
      console.log(`❌ Status: ${response.status}`);
      console.log('Error:', data);
      return null;
    }
  } catch (error) {
    console.log(`❌ Network error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes do sistema de regras de recomendação\n');
  console.log('=' .repeat(60));

  // TESTE 1: Listar todas as regras
  console.log('\n📋 TESTE 1: Listar todas as regras');
  const allRules = await testAPI('/api/admin/recommendation-rules');
  if (allRules) {
    console.log(`   Encontradas: ${allRules.length} regra(s)`);
    if (allRules.length > 0) {
      console.log(`   Primeira regra: ${allRules[0].name} (v${allRules[0].version})`);
    }
  }

  // TESTE 2: Buscar regra ativa
  console.log('\n📋 TESTE 2: Buscar regra ativa');
  const activeRule = await testAPI('/api/admin/recommendation-rules/active');
  if (activeRule) {
    console.log(`   Nome: ${activeRule.name}`);
    console.log(`   Versão: v${activeRule.version}`);
    console.log(`   Ativa: ${activeRule.isActive}`);
  } else {
    console.log('   ⚠️  Nenhuma regra ativa encontrada');
  }

  // TESTE 3: Criar nova regra
  console.log('\n📋 TESTE 3: Criar nova regra');
  const newRule = {
    name: `Regras Teste API ${Date.now()}`,
    rules: {
      fundCountByCapital: {
        ranges: [
          { minCapital: 0, maxCapital: 30000, minFunds: 1, maxFunds: 10, recommended: 8 }
        ]
      },
      mandatorySegments: {
        segments: ['LAJES', 'LOGISTICA'],
        alertOnMissing: true
      },
      fundsPerSegment: {
        byCapitalRange: [
          {
            minCapital: 0,
            maxCapital: 30000,
            segmentRules: {
              LAJES: { min: 1, max: 1, recommended: 1 },
              LOGISTICA: { min: 2, max: 2, recommended: 2 }
            }
          }
        ]
      },
      allocationPercentage: {
        segments: {
          LAJES: { min: 10, max: 20, recommended: 15 },
          LOGISTICA: { min: 20, max: 30, recommended: 25 }
        },
        alertOnOutOfRange: true
      },
      tijoloPapelBalance: {
        tijolo: {
          segments: ['LAJES', 'LOGISTICA'],
          minPercentage: 60,
          maxPercentage: 80,
          recommendedPercentage: 70
        },
        papel: {
          segments: ['PAPEL'],
          minPercentage: 20,
          maxPercentage: 40,
          recommendedPercentage: 30
        },
        alertOnImbalance: true
      },
      alternativeFunds: {
        categories: ['AGRO', 'INFRA'],
        maxPercentage: 15,
        idealMaxPercentage: 10,
        alertThreshold: 12
      },
      intraSegmentBalance: {
        enabled: true,
        maxDeviationPercentage: 10,
        alertOnImbalance: true
      },
      general: {
        enforceStrictCompliance: false,
        allowOverrides: true,
        confidenceThreshold: 0.7
      }
    },
    metadata: {
      source: 'manual',
      description: 'Regra criada via script de teste',
      tags: ['teste', 'api']
    }
  };

  const created = await testAPI('/api/admin/recommendation-rules', 'POST', newRule);
  let createdRuleId = null;
  if (created) {
    createdRuleId = created.id;
    console.log(`   ID: ${created.id}`);
    console.log(`   Nome: ${created.name}`);
    console.log(`   Versão: v${created.version}`);
  }

  if (!createdRuleId) {
    console.log('\n❌ Testes subsequentes cancelados (regra não foi criada)');
    return;
  }

  // TESTE 4: Buscar regra específica
  console.log('\n📋 TESTE 4: Buscar regra específica');
  const specificRule = await testAPI(`/api/admin/recommendation-rules/${createdRuleId}`);
  if (specificRule) {
    console.log(`   Nome: ${specificRule.name}`);
    console.log(`   Possui rules: ${!!specificRule.rules}`);
    console.log(`   Possui metadata: ${!!specificRule.metadata}`);
  }

  // TESTE 5: Atualizar regra
  console.log('\n📋 TESTE 5: Atualizar regra');
  const updated = await testAPI(
    `/api/admin/recommendation-rules/${createdRuleId}`,
    'PUT',
    {
      name: `${newRule.name} - Atualizado`,
      changesSummary: 'Teste de atualização via script'
    }
  );
  if (updated) {
    console.log(`   Nova versão: v${updated.version}`);
    console.log(`   Nome atualizado: ${updated.name}`);
  }

  // TESTE 6: Ver histórico de versões
  console.log('\n📋 TESTE 6: Ver histórico de versões');
  const versions = await testAPI(`/api/admin/recommendation-rules/${createdRuleId}/versions`);
  if (versions) {
    console.log(`   Total de versões: ${versions.length}`);
    versions.forEach(v => {
      console.log(`   - v${v.version}: ${v.changesSummary}`);
    });
  }

  // TESTE 7: Ativar regra
  console.log('\n📋 TESTE 7: Ativar regra');
  const activated = await testAPI(
    `/api/admin/recommendation-rules/${createdRuleId}/activate`,
    'POST'
  );
  if (activated) {
    console.log(`   ✅ Regra ativada com sucesso`);
  }

  // TESTE 8: Verificar se está ativa
  console.log('\n📋 TESTE 8: Verificar regra ativa novamente');
  const newActiveRule = await testAPI('/api/admin/recommendation-rules/active');
  if (newActiveRule && newActiveRule.id === createdRuleId) {
    console.log(`   ✅ Regra criada agora é a ativa!`);
    console.log(`   ID: ${newActiveRule.id}`);
    console.log(`   Nome: ${newActiveRule.name}`);
  }

  // TESTE 9: Rollback (se tiver mais de 1 versão)
  if (versions && versions.length > 1) {
    console.log('\n📋 TESTE 9: Fazer rollback para versão 1');
    const rolledBack = await testAPI(
      `/api/admin/recommendation-rules/${createdRuleId}/rollback`,
      'POST',
      { version: 1 }
    );
    if (rolledBack) {
      console.log(`   Nova versão após rollback: v${rolledBack.version}`);
    }
  }

  // TESTE 10: Download de template
  console.log('\n📋 TESTE 10: Download de template Excel');
  console.log('   ⚠️  Para testar, acesse:');
  console.log(`   ${BASE_URL}/api/admin/recommendation-rules/download-template`);

  // TESTE 11: Tentar excluir regra ativa (deve falhar)
  console.log('\n📋 TESTE 11: Tentar excluir regra ativa (deve falhar)');
  const deleted = await testAPI(
    `/api/admin/recommendation-rules/${createdRuleId}`,
    'DELETE'
  );
  if (!deleted) {
    console.log(`   ✅ Proteção funcionando! Regra ativa não pode ser excluída.`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testes concluídos!\n');
  console.log('📊 Resumo:');
  console.log(`   - Regra criada: ${createdRuleId}`);
  console.log(`   - Nome: ${newRule.name}`);
  console.log(`   - Status: ${newActiveRule ? 'Ativa' : 'Inativa'}`);
  console.log('\n💡 Para excluir a regra de teste:');
  console.log('   1. Ative outra regra no admin panel');
  console.log('   2. Delete a regra criada');
}

// Executar testes
runTests().catch(console.error);
