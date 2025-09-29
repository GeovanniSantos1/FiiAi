# 📋 Documentação FiiAI - SaaS Template

## 🚀 Stack do Projeto
**Tipo:** WEB (Next.js SaaS Platform)

**Tecnologias Principais:**
- **Framework:** Next.js 15.3.5 com App Router
- **Frontend:** React 19, TypeScript, Tailwind CSS v4
- **Backend:** Node.js, PostgreSQL, Prisma ORM
- **Autenticação:** Clerk
- **Estado:** TanStack Query (React Query)
- **UI Components:** Radix UI + Tailwind CSS
- **Validação:** Zod + React Hook Form

## 📚 Índice da Documentação

### 🏗️ **Arquitetura e Conceitos**
- [**Arquitetura do Sistema**](./arquitetura.md) - Visão geral da arquitetura, fluxos principais e padrões de design
- [**Modelo de Dados**](./modelo-dados.md) - Schema do banco de dados, relacionamentos e estruturas

### 🛠️ **Desenvolvimento**
- [**Guidelines de Desenvolvimento**](./guidelines-desenvolvimento.md) - Padrões de código, convenções e boas práticas
- [**Configuração do Ambiente**](./configuracao-ambiente.md) - Setup inicial, variáveis de ambiente e dependências
- [**Estrutura de Pastas**](./estrutura-pastas.md) - Organização do projeto e responsabilidades de cada diretório

### 🔧 **APIs e Integrações**
- [**Documentação de APIs**](./apis.md) - Endpoints, parâmetros, responses e exemplos de uso
- [**Sistema de Autenticação**](./autenticacao.md) - Fluxos de auth, proteção de rotas e integração com Clerk
- [**Sistema de Créditos**](./sistema-creditos.md) - Gestão de créditos, cobrança e controle de uso

### 💰 **Domínio FII (Fundos Imobiliários)**
- [**Regras de Negócio FII**](./regras-negocio-fii.md) - Lógicas específicas do domínio de fundos imobiliários
- [**Análise de Portfólio**](./analise-portfolio.md) - Algoritmos de análise e recomendações de investimento

### 📦 **Deploy e Produção**
- [**Guia de Deploy**](./deploy.md) - Processo de deploy, CI/CD e configurações de produção
- [**Monitoramento**](./monitoramento.md) - Logs, métricas e observabilidade

### 🧪 **Testes e Qualidade**
- [**Estratégia de Testes**](./testes.md) - Testes unitários, integração e E2E
- [**Code Review**](./code-review.md) - Processo de revisão e checklist de qualidade

## 🎯 **Visão Geral do Projeto**

O FiiAI é uma plataforma SaaS especializada em análise de portfólios de Fundos de Investimento Imobiliário (FIIs) usando Inteligência Artificial. A plataforma oferece:

- **Análise Automatizada:** Upload de planilhas Excel com portfólios para análise por IA
- **Recomendações Inteligentes:** Sugestões de investimentos baseadas em análise de risco e performance
- **Sistema de Créditos:** Controle de uso através de sistema de créditos integrado ao Clerk
- **Dashboard Administrativo:** Gestão de usuários, configurações e análise de uso
- **Interface Responsiva:** Design moderno com glass morphism e experiência mobile-first

## 🔄 **Fluxo Principal de Uso**

1. **Cadastro/Login** → Usuário se autentica via Clerk
2. **Upload de Portfólio** → Usuário faz upload da planilha Excel com seus FIIs
3. **Análise por IA** → Sistema processa os dados e gera relatório detalhado
4. **Recomendações** → IA sugere ajustes e novos investimentos
5. **Gestão de Créditos** → Sistema debita créditos do usuário conforme uso

## 📋 **Comandos Rápidos**

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build           # Build para produção
npm run lint            # Executa linting
npm run typecheck       # Verificação de tipos TypeScript

# Banco de dados
npm run db:push         # Aplica mudanças no schema
npm run db:studio       # Abre Prisma Studio
npm run db:reset        # Reset completo do banco
```

## 🚨 **Pontos de Atenção**

- **Segurança:** Nunca commitar secrets ou chaves de API
- **Créditos:** Sempre verificar saldo antes de operações custosas
- **Performance:** Usar React Query para cache de dados
- **TypeScript:** Modo não-strict, mas tipagem completa recomendada
- **Autenticação:** Todas as rotas protegidas devem verificar auth

## 📞 **Suporte**

Para dúvidas sobre implementação ou arquitetura, consulte os documentos específicos ou entre em contato com a equipe de desenvolvimento.

---
**Última atualização:** 2025-09-28
**Versão:** 1.0.0