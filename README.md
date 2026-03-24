# PROATIVA — Dashboard de Análise de Pesquisas

Sistema de dashboard para leitura, armazenamento e análise de respostas vindas do Google Forms (via Google Sheets).  
Desenvolvido com **React**, **Vite**, **TypeScript** e **Lovable Cloud** (PostgreSQL, Auth, Edge Functions).

---

## 📋 Pré-requisitos

| Ferramenta | Windows | Mac |
|---|---|---|
| **Node.js** (v18+) | [Baixar instalador .msi (LTS)](https://nodejs.org/) | `brew install node` |
| **Git** | [Baixar Git for Windows](https://git-scm.com/download/win) | `brew install git` (ou já vem instalado) |

> **Mac:** Se não tem o Homebrew, instale com:  
> ```bash
> /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
> ```

---

## 🚀 Instalação Rápida

### 1. Clonar o repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd remix-of-data-insight-hub-1
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar a aplicação

```bash
npm run dev
```

Acesse no navegador: **http://localhost:8080/**

---

## 🔑 Funcionalidades

| Página | Descrição |
|---|---|
| **Dashboard** | Visão geral com KPIs, gráficos de fatores de risco e métricas consolidadas |
| **Análise da Pesquisa** | Análise detalhada por pergunta com gráficos interativos |
| **Heatmap** | Mapa de calor por fator e setor da empresa |
| **Comparativo** | Comparação entre empresas cadastradas |
| **Demografia** | Distribuição demográfica dos respondentes |
| **Planos de Ação** | Criação e acompanhamento de planos baseados nos riscos |
| **Anotações** | Notas e observações por empresa |
| **Relatórios** | Exportação de relatórios em PDF |
| **Integrações** | Configuração da sincronização com Google Sheets |
| **Configurações** | Gestão de usuários (admin) |

---

## 📊 Guia de Integração com Google Forms (Passo a Passo)

Esta seção explica como configurar a integração entre o Google Forms e o PROATIVA para importar automaticamente as respostas das pesquisas.

### Passo 1: Criar o formulário no Google Forms

1. Acesse [Google Forms](https://docs.google.com/forms)
2. Crie um novo formulário com as perguntas da pesquisa
3. O formulário deve conter as seguintes colunas demográficas (opcionais, mas recomendadas):
   - **Nome** do respondente
   - **Idade** ou faixa etária
   - **Sexo/Gênero**
   - **Setor/Departamento**
4. As demais perguntas serão tratadas como respostas da pesquisa (escala Likert: 1 a 5)

### Passo 2: Vincular a uma planilha Google Sheets

1. No Google Forms, clique na aba **Respostas**
2. Clique no ícone do Google Sheets (ícone verde) → **Criar nova planilha**
3. A planilha será criada automaticamente com as respostas

### Passo 3: Tornar a planilha acessível

A planilha precisa ser acessível pela API. Existem duas opções:

**Opção A — Planilha pública (mais simples):**
1. Abra a planilha no Google Sheets
2. Clique em **Compartilhar** (botão no canto superior direito)
3. Em "Acesso geral", altere para **Qualquer pessoa com o link**
4. Permissão: **Leitor**

**Opção B — Planilha privada com API Key restrita:**
1. No [Google Cloud Console](https://console.cloud.google.com), restrinja a API Key ao domínio da sua planilha

### Passo 4: Obter o ID da planilha

O ID da planilha está na URL:

```
https://docs.google.com/spreadsheets/d/[ID_DA_PLANILHA]/edit
```

Exemplo: se a URL é `https://docs.google.com/spreadsheets/d/1h2CrVt0qGKP6re7l9lMG3F17GJ5DtIdLvp9QNqELCTI/edit`, o ID é `1h2CrVt0qGKP6re7l9lMG3F17GJ5DtIdLvp9QNqELCTI`.

### Passo 5: Verificar o nome da aba

1. Abra a planilha no Google Sheets
2. Na parte inferior, verifique o nome da aba onde estão as respostas
3. Geralmente é **"Respostas ao formulário 1"** ou **"Form Responses 1"**
4. Copie o nome exato (incluindo acentos e espaços)

### Passo 6: Cadastrar no PROATIVA

1. Faça login no sistema como **administrador**
2. No menu lateral, acesse **Integrações**
3. Clique em **Nova Integração**
4. Preencha os campos:
   - **Nome da Empresa**: Nome que identifica a empresa pesquisada
   - **ID da Planilha**: Cole o ID obtido no Passo 4
   - **Nome da Aba**: Nome exato da aba (Passo 5)
   - **URL do Formulário** (opcional): Link direto para a planilha ou formulário
5. Clique em **Salvar**

### Passo 7: Sincronizar

1. Na lista de integrações, localize a empresa cadastrada
2. Clique no botão **Sincronizar**
3. Aguarde a conclusão — o sistema mostrará quantas respostas foram importadas
4. Acesse o **Dashboard** para visualizar os dados

### ⚠️ Observações Importantes

- A sincronização **substitui** todas as respostas anteriores da empresa (não é incremental)
- O sistema identifica automaticamente as colunas de **nome**, **idade**, **sexo** e **setor** pelo nome do cabeçalho
- Todas as demais colunas são tratadas como **perguntas da pesquisa**
- Respostas devem usar escala numérica (1 a 5) para os cálculos funcionarem corretamente
- A `GOOGLE_SHEETS_API_KEY` deve estar configurada nos segredos do backend

---

## 🔒 Autenticação e Permissões

| Papel | Permissões |
|---|---|
| **Admin** | Gerenciar integrações, criar usuários, acessar todas as funcionalidades |
| **Usuário** | Visualizar dashboards, criar planos de ação e anotações |

O primeiro usuário admin deve ser criado diretamente no backend. Após isso, o admin pode criar novos usuários pela tela de **Configurações**.

---

## 📂 Estrutura do Projeto

```
src/
├── components/       → Componentes reutilizáveis (UI, gráficos, tabelas)
├── pages/            → Páginas (Dashboard, Login, Relatórios, Configurações)
├── hooks/            → Hooks customizados (useSurveyData, useActionPlans)
├── integrations/     → Cliente backend + tipagens TypeScript
├── contexts/         → Contextos React (AuthContext)
├── lib/              → Utilitários (exportação PDF, metodologia PROART)
└── data/             → Dados mock para desenvolvimento

supabase/
├── migrations/       → Estrutura SQL do banco
└── functions/        → Funções backend serverless
    └── sync-google-sheets/  → Sincronização com Google Sheets
```

---

## 🆘 Troubleshooting

| Problema | Solução |
|---|---|
| Tela em branco / "Cannot connect" | Verifique se o servidor está rodando (`npm run dev`) |
| Porta 8080 em uso | **Windows:** `netstat -ano \| findstr :8080` → `taskkill /PID <PID> /F`. **Mac:** `lsof -i :8080` → `kill -9 <PID>` |
| Erro na sincronização "Failed to fetch" | Verifique se a `GOOGLE_SHEETS_API_KEY` está configurada nos segredos do backend |
| Erro "Erro ao acessar Google Sheets" | Verifique se a planilha está compartilhada como "Qualquer pessoa com o link" e se o ID está correto |
| "Nenhuma resposta encontrada" | Verifique se o nome da aba está correto e se há respostas na planilha |
| Dados não aparecem no dashboard | Selecione a empresa correta no filtro do dashboard após sincronizar |

---

## 📄 Licença

© 2026 PROATIVA. Todos os direitos reservados.
