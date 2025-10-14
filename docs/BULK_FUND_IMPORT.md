# 📊 Importação em Lote de Fundos - Guia de Uso

## 🎯 Visão Geral

Sistema completo de importação em massa de fundos (FIIs) para carteiras recomendadas através de upload de planilhas Excel ou CSV.

**Implementado conforme:** [Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas](../plans/plan-008-upload-lote-fundos-carteira.md)

---

## 🚀 Funcionalidades

### ✅ O que foi implementado:

1. **Upload de Arquivos**
   - Suporte para `.xlsx`, `.xls` e `.csv`
   - Drag & drop interface
   - Validação de tamanho (max 2MB)
   - Limite de 100 fundos por importação

2. **Validação Completa**
   - **Local**: Validação de formato de ticker, preços, alocações
   - **Servidor**: Validação de segmentos, fundos existentes, alocação total
   - **Negócio**: Soma de alocações = 100%

3. **Dois Modos de Importação**
   - **Merge**: Adiciona novos fundos e atualiza existentes
   - **Replace**: Remove todos e importa novos

4. **Transação com Rollback**
   - Todas operações em transação única
   - Rollback automático em caso de erro
   - Garantia de consistência dos dados

5. **Feedback Visual**
   - Preview detalhado dos dados
   - Identificação de ações (NOVO/ATUALIZAR/ERRO)
   - Totalizador de alocação em tempo real
   - Relatório final de importação

---

## 📥 Como Usar

### Passo 1: Acessar a Carteira

1. Navegue até `/admin/carteiras`
2. Clique na carteira desejada
3. Clique no botão **"Upload Planilha"**

### Passo 2: Preparar a Planilha

#### Template CSV (Baixável no sistema):

```csv
Ticker,Nome,Segmento,Preço Atual,Preço Médio,Preço Teto,Alocação,Recomendação
HGLG11,Hedge General Logistics,Logística,156.78,140.50,180.00,6.0,Comprar
BTLG11,BTG Pactual Logística,Logística,101.89,101.82,102.80,7.0,Comprar
CVBI11,VBI CRI,Papel,83.20,89.34,96.73,6.0,Aguardar
```

#### Colunas Obrigatórias:

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| **Ticker** | String | Código do FII (4 letras + 2 dígitos) | HGLG11 |
| **Nome** | String | Nome completo do fundo | Hedge General Logistics |
| **Segmento** | String | Segmento do FII (veja lista abaixo) | Logística |
| **Preço Atual** | Número | Preço atual em R$ | 156.78 |
| **Preço Médio** | Número | Preço médio em R$ | 140.50 |
| **Preço Teto** | Número | Preço teto em R$ | 180.00 |
| **Alocação** | Número | Percentual da carteira (0-100) | 6.0 |
| **Recomendação** | String | Comprar/Vender/Aguardar | Comprar |

#### Segmentos Válidos:

- Agronegócio
- Educacional
- Híbrido
- Hospital
- Hotel
- Industrial
- Lajes Corporativas
- Logística
- Papel (CRI/CRA)
- Residencial
- Shopping
- Outros

#### Recomendações Aceitas:

- `Comprar`, `BUY`
- `Vender`, `SELL`
- `Aguardar`, `Manter`, `HOLD`

### Passo 3: Upload e Validação

1. **Arraste e solte** o arquivo ou clique para selecionar
2. Aguarde o **parse automático** do arquivo
3. Revise o **preview dos dados**:
   - ✅ Fundos válidos
   - 🔄 Fundos que serão atualizados
   - ➕ Fundos novos
   - ❌ Erros encontrados

4. Verifique a **alocação total**:
   - Deve somar exatamente 100%
   - Diferenças são destacadas em vermelho

### Passo 4: Escolher Modo de Importação

#### Modo Merge (Padrão):
- Adiciona novos fundos
- Atualiza fundos existentes (por ticker)
- **Use quando:** Quer adicionar/atualizar sem perder dados existentes

#### Modo Replace:
- Remove TODOS os fundos da carteira
- Importa apenas os fundos da planilha
- **Use quando:** Quer substituir completamente a carteira

### Passo 5: Importar

1. Clique em **"Importar X Fundos"**
2. Aguarde o processamento
3. Veja o relatório final:
   - ✅ Fundos criados
   - 🔄 Fundos atualizados
   - ❌ Falhas (se houver)
   - Alocação final
   - Tempo de processamento

---

## 🧪 Testes

### Cenários de Teste:

#### ✅ Teste 1: Importação Bem-Sucedida (Merge)
1. Crie planilha com 5 fundos novos (alocação total = 100%)
2. Upload no modo Merge
3. **Resultado esperado**: 5 fundos criados, alocação = 100%

#### ✅ Teste 2: Atualização de Fundos Existentes
1. Importe 3 fundos
2. Altere preços na planilha
3. Reimporte no modo Merge
4. **Resultado esperado**: 3 fundos atualizados

#### ✅ Teste 3: Substituição Completa (Replace)
1. Carteira com 5 fundos
2. Planilha com 3 fundos diferentes
3. Import no modo Replace
4. **Resultado esperado**: 3 fundos novos, 5 antigos removidos

#### ❌ Teste 4: Erro de Alocação
1. Planilha com alocação total = 95%
2. Tentar importar
3. **Resultado esperado**: Erro, importação bloqueada

#### ❌ Teste 5: Ticker Duplicado
1. Planilha com ticker HGLG11 repetido
2. Tentar importar
3. **Resultado esperado**: Erro identificado no preview

#### ❌ Teste 6: Segmento Inválido
1. Planilha com segmento "XYZ"
2. Tentar importar
3. **Resultado esperado**: Erro de validação

---

## 🔧 Arquitetura Técnica

### Stack:
- **Frontend**: React 19 + Next.js 15 + TypeScript
- **Backend**: Next.js API Routes + Prisma
- **Database**: PostgreSQL com transações
- **Parsers**: `xlsx` (Excel) + `papaparse` (CSV)
- **UI**: Radix UI + Tailwind CSS + react-dropzone

### Arquivos Criados:

```
src/
├── types/
│   └── fund-import.ts                                    # Types TypeScript
├── lib/
│   ├── parsers/
│   │   └── fund-file-parser.ts                          # Parse Excel/CSV
│   └── validators/
│       └── fund-import-validator.ts                     # Validação local
├── hooks/
│   └── admin/
│       ├── use-parse-fund-file.ts                       # Hook de parse
│       └── use-bulk-import-funds.ts                     # Hooks de API
├── components/
│   └── admin/
│       └── carteiras/
│           ├── FundFileUploadZone.tsx                   # Upload área
│           ├── FundImportPreview.tsx                    # Preview tabela
│           └── BulkFundImportDialog.tsx                 # Modal principal
├── app/
│   ├── admin/
│   │   └── carteiras/
│   │       └── [id]/
│   │           └── page.tsx                             # Integração
│   └── api/
│       └── admin/
│           └── carteiras/
│               └── [id]/
│                   └── fundos/
│                       ├── validate-bulk/
│                       │   └── route.ts                 # API validação
│                       └── bulk-import/
│                           └── route.ts                 # API importação
```

### APIs:

#### POST `/api/admin/carteiras/[id]/fundos/validate-bulk`
**Validação antes de importar**

Request:
```json
{
  "funds": [
    {
      "ticker": "HGLG11",
      "nome": "Hedge General Logistics",
      "segmento": "Logística",
      "precoAtual": 156.78,
      "precoMedio": 140.50,
      "precoTeto": 180.00,
      "alocacao": 6.0,
      "recomendacao": "BUY",
      "rowNumber": 2
    }
  ]
}
```

Response:
```json
{
  "valid": [...],
  "errors": [...],
  "warnings": [...],
  "existingFunds": [...],
  "newFunds": [...],
  "totalAllocation": 100,
  "allocationValid": true
}
```

#### POST `/api/admin/carteiras/[id]/fundos/bulk-import`
**Importação em massa**

Request:
```json
{
  "funds": [...],
  "mode": "merge" | "replace"
}
```

Response:
```json
{
  "total": 18,
  "created": 15,
  "updated": 3,
  "failed": 0,
  "errors": [],
  "finalAllocation": 100,
  "duration": 1234,
  "timestamp": "2025-10-13T..."
}
```

---

## 🔒 Segurança

### Validações Implementadas:

1. ✅ Autenticação admin obrigatória
2. ✅ Validação de tipo de arquivo
3. ✅ Validação de tamanho (max 2MB)
4. ✅ Validação de formato de ticker (regex)
5. ✅ Validação de segmentos (enum)
6. ✅ Validação de preços (positivos)
7. ✅ Validação de alocação total (100%)
8. ✅ Verificação de duplicatas
9. ✅ Transação com rollback
10. ✅ Limite de 100 fundos por importação

---

## 📈 Performance

### Métricas Esperadas:

- **Upload + Parse**: < 2s para 100 fundos
- **Validação**: < 5s para 100 fundos
- **Importação**: ~10-15s para 100 fundos
- **Total**: < 20s para processo completo

### Otimizações:

- Parse assíncrono de arquivos
- Validação em paralelo (local + servidor)
- Transação única no banco
- Cache invalidation otimizada

---

## ❓ FAQ

### P: A planilha precisa ter as colunas em ordem específica?
**R:** Não! O sistema reconhece colunas por nome, independente da ordem.

### P: Posso usar nomes de colunas em inglês?
**R:** Sim! O parser aceita variações como `Ticker/ticker`, `Nome/Name`, `Segmento/Segment`, etc.

### P: E se a soma não der exatamente 100%?
**R:** O sistema bloqueia a importação. Ajuste as alocações para somar 100%.

### P: Posso importar só alguns fundos e manter os existentes?
**R:** Sim! Use o modo **Merge**. Ele adiciona novos e mantém os que não estão na planilha.

### P: Como removo todos os fundos e importo novos?
**R:** Use o modo **Replace**. Ele apaga tudo antes de importar.

### P: Posso desfazer uma importação?
**R:** Não há "desfazer" nativo. Mas você pode importar a planilha anterior no modo Replace.

### P: O que acontece se houver erro no meio da importação?
**R:** Rollback automático! Nenhuma alteração é salva se houver erro.

---

## 🐛 Troubleshooting

### Erro: "Alocação total inválida"
**Solução:** Verifique que a soma das alocações = 100% (tolerância de 0.1%)

### Erro: "Ticker duplicado na planilha"
**Solução:** Remova linhas duplicadas. Cada ticker deve aparecer uma vez.

### Erro: "Segmento inválido"
**Solução:** Use exatamente os nomes da lista de segmentos válidos.

### Erro: "Arquivo muito grande"
**Solução:** Reduza para max 2MB ou divida em múltiplas importações.

### Erro: "Nenhum fundo válido encontrado"
**Solução:** Verifique se o arquivo tem header e se as colunas têm os nomes corretos.

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Consulte este documento
2. Revise o [Plan-008](../plans/plan-008-upload-lote-fundos-carteira.md)
3. Verifique os logs do console (F12)

---

**Última atualização:** 2025-10-13
**Versão:** 1.0.0
**Status:** ✅ Implementado e Funcional
