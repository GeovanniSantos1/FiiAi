# 🧪 Guia de Testes - Sistema de Regras de Recomendação FII

## 🎯 Objetivo
Este guia fornece um roteiro completo para testar todas as funcionalidades do sistema de regras configuráveis.

## 📋 Pré-requisitos

1. ✅ Servidor de desenvolvimento rodando: `npm run dev`
2. ✅ Banco de dados sincronizado: `npx prisma db push`
3. ✅ Usuário admin autenticado no sistema
4. ✅ Acesso à URL: `http://localhost:3000/admin/regras-recomendacao`

---

## 🚀 Roteiro de Testes

### TESTE 1: Verificar Acesso ao Menu Admin

**Objetivo**: Confirmar que o menu está visível e acessível

**Passos**:
1. Acesse `http://localhost:3000/admin`
2. Verifique na sidebar lateral a seção **"Configurações"**
3. Procure o item **"Regras de Recomendação"** com ícone de engrenagem

**Resultado Esperado**:
- ✅ Menu "Regras de Recomendação" visível
- ✅ Ícone Settings (engrenagem) ao lado do nome

**Screenshot Esperado**:
```
📋 Configurações
   ⚙️ Regras de Recomendação
```

---

### TESTE 2: Acessar Página de Regras

**Objetivo**: Verificar carregamento inicial da página

**Passos**:
1. Clique em "Regras de Recomendação" no menu
2. Aguarde o carregamento da página

**Resultado Esperado**:
- ✅ URL: `/admin/regras-recomendacao`
- ✅ Título: "Regras de Recomendação FII"
- ✅ Descrição visível
- ✅ Três botões no topo:
  - "Template Excel"
  - "Upload Excel"
  - "Nova Regra Manual"
- ✅ Mensagem "Nenhuma regra encontrada" (se primeira vez)
- ✅ Duas abas: "Todas as Regras" e "Sobre as Regras"

---

### TESTE 3: Download do Template Excel

**Objetivo**: Baixar e verificar template

**Passos**:
1. Clique no botão **"Template Excel"**
2. Aguarde o download do arquivo

**Resultado Esperado**:
- ✅ Arquivo baixado: `template-regras-recomendacao.xlsx`
- ✅ Arquivo abre no Excel/LibreOffice
- ✅ Contém 9 abas:
  1. Fundos por Capital
  2. Segmentos Obrigatórios
  3. Fundos por Segmento - Capital < 30K
  4. Fundos por Segmento - Capital 30K-100K
  5. Fundos por Segmento - Capital > 100K
  6. Alocação Percentual
  7. Tijolo vs Papel
  8. Alternativos
  9. Configurações Gerais
- ✅ Cada aba contém dados de exemplo

**Verificação no Excel**:
```
Aba 1 - Fundos por Capital:
Min Capital | Max Capital | Min Fundos | Max Fundos | Recomendado
0           | 30000       | 1          | 10         | 8
30000       | 100000      | 10         | 15         | 12
100000      |             | 15         | 20         | 18
```

---

### TESTE 4: Criar Regra Manualmente (JSON)

**Objetivo**: Criar primeira regra via editor JSON

**Passos**:
1. Clique no botão **"Nova Regra Manual"**
2. Preencha o formulário:
   - **Nome**: "Regras Teste Manual"
   - **Descrição**: "Primeira regra criada para teste"
   - **JSON**: Deixe o padrão ou modifique se desejar
3. Clique em **"Criar"**

**Resultado Esperado**:
- ✅ Dialog fecha automaticamente
- ✅ Toast de sucesso: "Regras criadas com sucesso!"
- ✅ Tabela atualiza e mostra a nova regra
- ✅ Nova regra aparece com:
  - Status: Badge "Inativa" (cinza)
  - Nome: "Regras Teste Manual"
  - Versão: v1
  - Origem: Badge "Manual"
  - Criado por: Seu nome de usuário
  - Data de atualização

**Validações**:
- ✅ Se JSON inválido → Erro exibido em vermelho
- ✅ Se nome vazio → Botão "Criar" desabilitado

---

### TESTE 5: Ativar Regra

**Objetivo**: Ativar a regra criada

**Passos**:
1. Na tabela, localize a regra "Regras Teste Manual"
2. Clique nos **três pontos (...)** no final da linha
3. Selecione **"Ativar"**

**Resultado Esperado**:
- ✅ Toast: "Regras ativadas com sucesso!"
- ✅ Badge da regra muda para **"Ativa"** (verde com ✓)
- ✅ Card destacado aparece acima da tabela:
  - Título: "Regra Ativa Atualmente"
  - Nome da regra
  - Versão
  - Data de atualização
- ✅ Opção "Ativar" some do menu da regra ativa
- ✅ Opção "Excluir" some do menu da regra ativa

---

### TESTE 6: Criar Regra via Upload Excel

**Objetivo**: Testar upload e processamento de Excel

**Passos**:
1. Clique no botão **"Upload Excel"**
2. No dialog que abre:
   - **Nome**: "Regras Excel Teste"
   - **Arquivo**: Selecione o template que baixou (pode modificá-lo antes)
3. Clique em **"Upload e Criar"**

**Resultado Esperado**:
- ✅ Botão muda para "Processando..."
- ✅ Toast: "Excel processado e regras criadas!"
- ✅ Nova regra aparece na tabela:
  - Status: Inativa
  - Origem: Badge "Excel"
  - Nome: "Regras Excel Teste"
  - Versão: v1

**Possíveis Erros**:
- ❌ "Failed to process Excel file" → Verifique se todas as abas existem
- ❌ "Validation error" → Verifique se os valores estão corretos (números, percentuais)

---

### TESTE 7: Visualizar Detalhes da Regra

**Objetivo**: Inspecionar conteúdo da regra (via DevTools)

**Passos**:
1. Abra DevTools (F12)
2. Vá para aba **Network**
3. Clique em uma regra na tabela
4. Veja a requisição GET para `/api/admin/recommendation-rules/[id]`

**Resultado Esperado**:
- ✅ Status 200
- ✅ Response JSON contém:
  ```json
  {
    "id": "...",
    "name": "...",
    "version": 1,
    "isActive": true/false,
    "rules": { ... },
    "metadata": { ... },
    "creator": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```

---

### TESTE 8: Editar Regra (Criar Nova Versão)

**Objetivo**: Modificar uma regra e criar nova versão

**Passos**:
1. Abra DevTools Console
2. Execute o seguinte código para editar via API:

```javascript
// Substitua 'RULE_ID' pelo ID da sua regra
const ruleId = 'RULE_ID'; // Copie da tabela ou DevTools

fetch(`/api/admin/recommendation-rules/${ruleId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Regras Teste Manual v2',
    changesSummary: 'Teste de atualização via console'
  })
})
.then(r => r.json())
.then(data => console.log('Atualizado:', data));
```

**Resultado Esperado**:
- ✅ Console mostra objeto atualizado
- ✅ Versão incrementa: v1 → v2
- ✅ Nome atualizado na tabela
- ✅ Data de atualização mudou

---

### TESTE 9: Ver Histórico de Versões

**Objetivo**: Verificar versionamento

**Passos**:
1. Abra DevTools Console
2. Execute (substitua RULE_ID):

```javascript
const ruleId = 'RULE_ID';

fetch(`/api/admin/recommendation-rules/${ruleId}/versions`)
  .then(r => r.json())
  .then(versions => {
    console.log('Histórico de Versões:', versions);
    console.table(versions.map(v => ({
      versão: v.version,
      data: new Date(v.createdAt).toLocaleString(),
      resumo: v.changesSummary
    })));
  });
```

**Resultado Esperado**:
- ✅ Array com todas as versões
- ✅ Versão mais recente primeiro
- ✅ Cada versão tem:
  - version (número)
  - changesSummary (texto)
  - createdAt (data)
  - creator (usuário)

---

### TESTE 10: Rollback para Versão Anterior

**Objetivo**: Reverter para versão antiga

**Passos**:
1. Execute no Console:

```javascript
const ruleId = 'RULE_ID';
const targetVersion = 1; // Versão para voltar

fetch(`/api/admin/recommendation-rules/${ruleId}/rollback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ version: targetVersion })
})
.then(r => r.json())
.then(data => console.log('Rollback concluído:', data));
```

**Resultado Esperado**:
- ✅ Nova versão criada (v3 se estava em v2)
- ✅ Conteúdo voltou para versão 1
- ✅ changesSummary: "Rollback para versão 1"

---

### TESTE 11: Tentar Excluir Regra Ativa

**Objetivo**: Verificar proteção contra exclusão

**Passos**:
1. Localize a regra ATIVA na tabela
2. Clique nos três pontos (...)
3. Observe que **"Excluir"** NÃO aparece no menu

**Resultado Esperado**:
- ✅ Opção "Excluir" não está disponível
- ✅ Apenas regras inativas podem ser excluídas

---

### TESTE 12: Excluir Regra Inativa

**Objetivo**: Remover regra do sistema

**Passos**:
1. Crie uma nova regra qualquer (será criada como inativa)
2. Clique nos três pontos da nova regra
3. Selecione **"Excluir"**
4. Confirme no dialog de alerta

**Resultado Esperado**:
- ✅ Dialog de confirmação aparece
- ✅ Toast: "Regras excluídas com sucesso!"
- ✅ Regra desaparece da tabela

---

### TESTE 13: Verificar Regra Ativa via API

**Objetivo**: Confirmar que API retorna regra ativa

**Passos**:
1. Execute no Console:

```javascript
fetch('/api/admin/recommendation-rules/active')
  .then(r => r.json())
  .then(data => {
    console.log('Regra Ativa:', data);
    console.log('Nome:', data.name);
    console.log('Versão:', data.version);
    console.log('Regras:', data.rules);
  });
```

**Resultado Esperado**:
- ✅ Status 200
- ✅ Retorna a regra com `isActive: true`
- ✅ Objeto `rules` contém todas as configurações

---

### TESTE 14: Verificar Integração com Análise

**Objetivo**: Confirmar que regras são usadas nas análises

**Passos**:
1. Execute no Console:

```javascript
// Simular chamada de análise (se já tiver portfolios)
fetch('/api/admin/recommendation-rules/active')
  .then(r => r.json())
  .then(activeRules => {
    console.log('🎯 REGRAS ATIVAS PARA ANÁLISE:');
    console.log('ID:', activeRules.id);
    console.log('Nome:', activeRules.name);
    console.log('Versão:', activeRules.version);

    // Verificar campos principais
    console.log('\n📊 REGRAS CONFIGURADAS:');
    console.log('- Número de fundos por capital:',
      activeRules.rules.fundCountByCapital.ranges.length, 'ranges');
    console.log('- Segmentos obrigatórios:',
      activeRules.rules.mandatorySegments.segments.join(', '));
    console.log('- Confiança mínima IA:',
      activeRules.rules.general.confidenceThreshold);
  });
```

**Resultado Esperado**:
- ✅ Console mostra detalhes da regra ativa
- ✅ Todas as seções de regras estão presentes

---

### TESTE 15: Aba "Sobre as Regras"

**Objetivo**: Verificar documentação in-app

**Passos**:
1. Clique na aba **"Sobre as Regras"**
2. Leia o conteúdo

**Resultado Esperado**:
- ✅ Card informativo com seções:
  - 📊 Tipos de Regras
  - 📝 Formas de Configurar
  - 🔄 Versionamento
  - ✅ Ativação
- ✅ Explicações claras e em português

---

### TESTE 16: Responsividade Mobile

**Objetivo**: Verificar layout em telas pequenas

**Passos**:
1. Abra DevTools (F12)
2. Ative modo responsivo (Ctrl+Shift+M)
3. Teste resoluções:
   - 375px (Mobile)
   - 768px (Tablet)
   - 1024px (Desktop)

**Resultado Esperado**:
- ✅ Sidebar colapsa em mobile
- ✅ Botões se reorganizam
- ✅ Tabela tem scroll horizontal se necessário
- ✅ Dialogs se ajustam ao tamanho da tela

---

### TESTE 17: Performance e Cache

**Objetivo**: Verificar otimizações

**Passos**:
1. Abra DevTools → Network
2. Recarregue a página
3. Clique em "Todas as Regras" várias vezes

**Resultado Esperado**:
- ✅ Primeira requisição: Status 200
- ✅ Requisições seguintes: Dados vêm do cache do React Query
- ✅ Sem requisições duplicadas
- ✅ Stale time: 5 minutos

---

### TESTE 18: Tratamento de Erros

**Objetivo**: Verificar mensagens de erro

**Passos para testar diferentes erros**:

**18.1 - JSON Inválido**:
1. Clique em "Nova Regra Manual"
2. Apague uma vírgula do JSON
3. Tente criar

**Resultado**: ❌ Mensagem de erro em vermelho

**18.2 - Upload sem arquivo**:
1. Clique em "Upload Excel"
2. Deixe nome em branco
3. Observe botão desabilitado

**Resultado**: ✅ Botão "Upload e Criar" desabilitado

**18.3 - Tentativa de exclusão de regra ativa via API**:
```javascript
const activeRuleId = 'ID_DA_REGRA_ATIVA';

fetch(`/api/admin/recommendation-rules/${activeRuleId}`, {
  method: 'DELETE'
})
.then(r => r.json())
.then(data => console.error('Erro esperado:', data));
```

**Resultado**: ❌ Error: "Cannot delete the active ruleset..."

---

## 📊 Checklist Final

Marque cada item conforme completa os testes:

### Interface
- [ ] Menu visível no sidebar
- [ ] Página carrega sem erros
- [ ] Botões funcionam
- [ ] Tabela exibe dados corretamente
- [ ] Dialogs abrem e fecham
- [ ] Toasts aparecem nas ações

### CRUD Básico
- [ ] Criar regra manual (JSON)
- [ ] Criar regra via Excel
- [ ] Listar todas as regras
- [ ] Ativar/desativar regras
- [ ] Excluir regras inativas
- [ ] Proteção contra exclusão de ativa

### Excel
- [ ] Download de template funciona
- [ ] Upload processa corretamente
- [ ] Validação de estrutura
- [ ] Parsing correto dos dados

### Versionamento
- [ ] Versão incrementa ao editar
- [ ] Histórico mantém todas as versões
- [ ] Rollback funciona
- [ ] changesSummary registrado

### API
- [ ] GET /api/admin/recommendation-rules
- [ ] GET /api/admin/recommendation-rules/active
- [ ] POST /api/admin/recommendation-rules
- [ ] PUT /api/admin/recommendation-rules/[id]
- [ ] DELETE /api/admin/recommendation-rules/[id]
- [ ] POST /api/admin/recommendation-rules/[id]/activate

### Banco de Dados
- [ ] Tabela RecommendationRuleSet criada
- [ ] Tabela RecommendationRuleVersion criada
- [ ] Relacionamentos funcionam
- [ ] Dados persistem corretamente

---

## 🐛 Problemas Comuns e Soluções

### 1. Erro: "No active ruleset found"
**Causa**: Nenhuma regra ativa no sistema
**Solução**: Crie e ative uma regra primeiro

### 2. Página não carrega
**Causa**: Servidor não está rodando ou erro de compilação
**Solução**:
```bash
npm run dev
```

### 3. Excel não processa
**Causa**: Formato incorreto ou colunas faltando
**Solução**: Use o template oficial baixado do sistema

### 4. Erro de autenticação
**Causa**: Usuário não é admin
**Solução**: Verifique permissões no banco de dados

### 5. TypeScript errors
**Causa**: Prisma client não atualizado
**Solução**:
```bash
npx prisma generate
```

---

## 🎉 Resultado Esperado Final

Ao completar todos os testes, você deve ter:

✅ Sistema totalmente funcional
✅ Pelo menos 2-3 regras criadas
✅ 1 regra ativa no sistema
✅ Histórico de versões funcionando
✅ Interface responsiva e intuitiva
✅ Todos os toasts aparecendo corretamente
✅ Dados persistindo no banco

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Verifique logs do servidor
3. Confirme que o banco está sincronizado
4. Revise a documentação: `docs/RECOMMENDATION_RULES_SYSTEM.md`

---

**Tempo estimado para completar todos os testes**: 30-45 minutos

**Data do documento**: 2025-09-29
**Versão**: 1.0