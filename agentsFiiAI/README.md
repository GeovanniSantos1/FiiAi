# 🤖 Agentes de IA - Time de Desenvolvimento FiiAI

## 📋 Visão Geral

Esta pasta contém agentes de IA especializados para diferentes funções de desenvolvimento do projeto FiiAI. Cada agente possui conhecimento específico da stack tecnológica e das práticas do projeto.

## 👥 Time de Agentes

### 🎨 **Frontend Development**
**Arquivo:** [frontend-agent.md](./frontend-agent.md)

**Especialização:**
- React 19 + Next.js 15 + TypeScript
- Tailwind CSS v4 + Radix UI
- TanStack Query para estado
- Componentes responsivos e acessíveis

**Quando usar:**
- Implementar interfaces de usuário
- Criar componentes reutilizáveis
- Integrar APIs com frontend
- Otimizar performance frontend
- Implementar funcionalidades de portfólio e análises

---

### ⚙️ **Backend Development**
**Arquivo:** [backend-agent.md](./backend-agent.md)

**Especialização:**
- Node.js + Next.js API Routes
- Sistema de autenticação Clerk
- Integração com IA (OpenAI/Anthropic)
- APIs RESTful e validação Zod

**Quando usar:**
- Desenvolver APIs e endpoints
- Implementar lógica de negócio
- Integrar serviços externos
- Configurar autenticação e autorização
- Desenvolver análises de IA para FIIs

---

### 🗄️ **Database Development**
**Arquivo:** [database-agent.md](./database-agent.md)

**Especialização:**
- PostgreSQL + Prisma ORM
- Modelagem de dados FII
- Migrações e performance
- Queries otimizadas

**Quando usar:**
- Modelar schema do banco
- Criar migrações Prisma
- Otimizar queries e índices
- Implementar relacionamentos complexos
- Estruturar dados de portfólios e análises

---

### 🚀 **DevOps & Deploy**
**Arquivo:** [devops-agent.md](./devops-agent.md)

**Especialização:**
- Deploy Vercel
- CI/CD com GitHub Actions
- Docker e containerização
- Monitoramento e observabilidade

**Quando usar:**
- Configurar pipelines CI/CD
- Deploy em produção
- Configurar monitoramento
- Otimizar infraestrutura
- Resolver problemas de deploy

---

### 🧪 **QA & Testing**
**Arquivo:** [qa-agent.md](./qa-agent.md)

**Especialização:**
- Jest + Testing Library
- Playwright E2E
- Testes de integração
- Quality assurance

**Quando usar:**
- Criar estratégias de teste
- Implementar testes unitários e E2E
- Revisar qualidade de código
- Validar funcionalidades
- Automatizar testes de regressão

---

### 🔒 **Security**
**Arquivo:** [security-agent.md](./security-agent.md)

**Especialização:**
- Segurança de APIs
- Proteção de dados
- Auditoria de código
- Compliance e LGPD

**Quando usar:**
- Revisar segurança do código
- Implementar controles de acesso
- Validar entrada de dados
- Configurar CSP e headers
- Auditar vulnerabilidades

---

### 📊 **Product Management**
**Arquivo:** [product-agent.md](./product-agent.md)

**Especialização:**
- Domínio FII e investimentos
- Análise de requisitos
- UX/UI para fintech
- Métricas de produto

**Quando usar:**
- Definir funcionalidades
- Analisar requisitos de negócio
- Validar fluxos de usuário
- Especificar análises de IA
- Planejar roadmap de features

---

### 📚 **Documentation**
**Arquivo:** [documentation-agent.md](./documentation-agent.md)

**Especialização:**
- Documentação técnica
- Guias de API
- Arquitetura de sistema
- Onboarding de desenvolvedores

**Quando usar:**
- Criar documentação técnica
- Documentar APIs e fluxos
- Manter guias atualizados
- Criar tutoriais
- Documentar mudanças de arquitetura

---

## 🎯 **Como Escolher o Agente Certo**

### **Por Tipo de Tarefa:**

**🛠️ Desenvolvimento de Features:**
1. **Product Agent** → Definir requisitos
2. **Frontend/Backend Agent** → Implementar
3. **Database Agent** → Modelar dados
4. **QA Agent** → Testar funcionalidade

**🐛 Correção de Bugs:**
1. **QA Agent** → Reproduzir e analisar
2. **Frontend/Backend Agent** → Corrigir
3. **Security Agent** → Se relacionado à segurança

**🚀 Deploy e Produção:**
1. **DevOps Agent** → Pipeline e deploy
2. **Security Agent** → Validar segurança
3. **Documentation Agent** → Atualizar docs

**📈 Otimização:**
1. **Database Agent** → Performance de queries
2. **Frontend Agent** → Performance UI
3. **DevOps Agent** → Infraestrutura

### **Por Área do Sistema:**

**🎨 Interface do Usuário:**
- Frontend Agent
- Product Agent (UX)

**📊 Dashboard e Analytics:**
- Frontend Agent (visualização)
- Backend Agent (APIs)
- Database Agent (queries)

**💰 Sistema de Créditos:**
- Backend Agent (lógica)
- Database Agent (transações)
- Security Agent (validação)

**🤖 Análises de IA:**
- Backend Agent (integração)
- Product Agent (requisitos)
- QA Agent (validação)

**👑 Painel Admin:**
- Frontend Agent (interface)
- Backend Agent (APIs admin)
- Security Agent (autorização)

## 🔄 **Fluxo de Trabalho Colaborativo**

### **Ciclo de Desenvolvimento:**
```
1. Product Agent → Define requisitos e especificações
2. Database Agent → Modela dados necessários
3. Backend Agent → Implementa APIs e lógica
4. Frontend Agent → Desenvolve interface
5. QA Agent → Testa funcionalidade
6. Security Agent → Revisa segurança
7. DevOps Agent → Deploy em produção
8. Documentation Agent → Atualiza documentação
```

### **Revisão de Código:**
```
1. Desenvolvedor → Implementa feature
2. QA Agent → Testa automaticamente
3. Security Agent → Revisa segurança
4. Agente especialista → Revisa código específico
5. Documentation Agent → Atualiza docs se necessário
```

## 📚 **Contexto Compartilhado**

Todos os agentes têm conhecimento sobre:

- **Stack:** Next.js 15, React 19, TypeScript, Prisma, PostgreSQL
- **Autenticação:** Clerk + middleware de proteção
- **Estado:** TanStack Query pattern
- **Estilo:** Tailwind CSS + Radix UI + glass morphism
- **Domínio:** Fundos imobiliários (FIIs) e análises
- **Monetização:** Sistema de créditos
- **Deploy:** Vercel como plataforma principal

## 🚀 **Comandos Úteis para Agentes**

```bash
# Desenvolvimento
npm run dev              # Iniciar desenvolvimento
npm run build           # Build para produção
npm run typecheck       # Verificar tipos
npm run lint            # Linting

# Banco de dados
npm run db:push         # Aplicar schema
npm run db:studio       # Visualizar dados
npm run db:reset        # Reset banco

# Testes
npm run test            # Testes unitários
npm run test:e2e        # Testes E2E
```

---

**💡 Dica:** Para tarefas complexas que envolvem múltiplas áreas, considere usar vários agentes em sequência ou consultar o agente Product para coordenação geral.