# Sistema de Cadastro de Participantes

Sistema web completo para **cadastrar, pesquisar e localizar no mapa participantes e empresas**, com autenticação real, controle de acesso por perfil, consulta automática de CNPJ e CEP, geolocalização com OpenStreetMap (gratuito, sem chave) e upload de imagens para a nuvem.

Projeto desenvolvido como trabalho acadêmico e de portfólio (Tecnologia em Inteligência Artificial), com arquitetura pronta para produção: banco PostgreSQL real, regras de segurança no próprio banco (RLS) e chaves de API isoladas em variáveis de ambiente.

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Tecnologias](#tecnologias)
3. [Arquitetura](#arquitetura)
4. [Estrutura do projeto](#estrutura-do-projeto)
5. [Pré-requisitos](#pré-requisitos)
6. [Instalação](#instalação)
7. [Variáveis de ambiente (.env)](#variáveis-de-ambiente-env)
8. [Configurando o banco de dados (Supabase)](#configurando-o-banco-de-dados-supabase)
9. [Mapa (OpenStreetMap)](#mapa-openstreetmap)
10. [Configurando a API de CNPJ e CEP](#configurando-a-api-de-cnpj-e-cep)
11. [Executando localmente](#executando-localmente)
12. [Dados de exemplo (somente desenvolvimento)](#dados-de-exemplo-somente-desenvolvimento)
13. [Testes e verificação](#testes-e-verificação)
14. [Deploy](#deploy)
15. [Segurança](#segurança)
16. [Solução de problemas](#solução-de-problemas)

---

## Funcionalidades

| Área | O que faz |
|---|---|
| **Login e autenticação** | Login com e-mail/senha, logout, criação de acesso, recuperação e redefinição de senha por e-mail, sessão persistente (cookies HTTP-only renovados pelo middleware), proteção de páginas privadas e mensagens de erro amigáveis. |
| **Níveis de acesso** | **Administrador**: cadastra, edita e **exclui** participantes, vê todos os usuários, gerencia acessos e a logo. **Usuário**: visualiza, cadastra e edita participantes; não acessa a área administrativa. Regras aplicadas na interface, no servidor e no banco (RLS). |
| **Criar acesso** | Nome, e-mail, senha, confirmação e tipo de acesso. O **primeiro cadastro do sistema vira administrador**; pedidos posteriores de "Administrador" ficam pendentes até um admin aprovar (evita que qualquer pessoa se autopromova). |
| **Cadastro de participante** | Pessoa física (CPF) ou jurídica (CNPJ), com validação dos dígitos verificadores, máscaras de CPF, CNPJ, CEP e telefone, validação no navegador **e** no servidor com o mesmo esquema (Zod). |
| **Consulta de CNPJ** | Botão "Consultar CNPJ" (habilitado só para CNPJ válido) que preenche razão social, nome fantasia, CEP, endereço, número, bairro, cidade, UF, e-mail e telefone via **BrasilAPI**. Mensagens: *Consultando CNPJ...*, *CNPJ encontrado com sucesso*, *CNPJ inválido*, *CNPJ não encontrado*, *Erro ao consultar serviço*. Anti-abuso: intervalo de 5 s entre consultas, não repete o mesmo CNPJ, cache de 24 h e limite por usuário no servidor. |
| **CEP** | Ao digitar um CEP completo o endereço é preenchido automaticamente (BrasilAPI). |
| **Mapa (OpenStreetMap)** | Seção **Localização** no cadastro com mapa, marcador arrastável e endereço encontrado. O endereço é convertido em latitude/longitude (Nominatim) — automaticamente ao salvar, quando não há coordenadas; se o endereço exato não existir no mapa, usa o bairro/cidade e avisa que é aproximado. A página do participante mostra mapa, marcador, endereço e link "Abrir no OpenStreetMap". |
| **Imagem do participante** | Seleção pelo computador/celular, prévia, envio ao **Supabase Storage**, substituição e remoção (o arquivo antigo é apagado). Aceita JPG, JPEG, PNG e WEBP até 5 MB; o tipo real é conferido pelos *magic bytes*. |
| **Logo do sistema** | Admin envia, visualiza, substitui e remove a logo (até 2 MB). Ela aparece no login, menu lateral, cabeçalho e dashboard. |
| **Pesquisa** | Lista com busca em tempo real (debounce de 300 ms) por nome, razão social, nome fantasia, CPF, CNPJ e cidade; filtros por tipo (PF/PJ), categoria e UF; ordenação e paginação. Tabela no desktop e cards no celular. Ações Visualizar / Editar / Excluir com confirmação. |
| **Dashboard** | Totais de participantes, empresas, pessoas físicas e usuários, cadastros recentes, distribuição por categoria e quantos estão geolocalizados. |
| **Gestão de usuários** | Lista de usuários, alteração de nível, aprovação/recusa de pedidos de administrador, criação e exclusão de acessos. O banco impede remover o último administrador. |
| **Experiência** | Loading e skeletons, toasts de sucesso/erro, estados vazios, confirmação antes de exclusões, foco automático no primeiro campo com erro, layout responsivo (menu lateral no desktop, gaveta no celular, botões de 44 px). |

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | **Next.js 15** (App Router, React Server Components) + **React 19** + **TypeScript** |
| Estilização | **Tailwind CSS 4**, ícones `lucide-react`, notificações `sonner` |
| Backend/API | Server Actions e Route Handlers do Next.js (Node.js) |
| Banco de dados | **PostgreSQL** gerenciado pelo **Supabase** (com Row Level Security) |
| Autenticação | **Supabase Auth** (hash bcrypt, sessões JWT em cookies via `@supabase/ssr`) |
| Armazenamento | **Supabase Storage** (buckets `participantes` e `branding`) |
| Mapas | **OpenStreetMap** com **Leaflet** (`react-leaflet`) + geocodificação **Nominatim** — gratuitos, sem chave |
| CNPJ / CEP | **BrasilAPI** (pública, sem chave — URL configurável) |
| Validação | **Zod** (mesmos esquemas no cliente e no servidor) + `CHECK constraints` no banco |

---

## Arquitetura

```mermaid
flowchart LR
  U[Navegador] -->|páginas + server actions| N[Next.js<br/>servidor Node]
  U -->|blocos do mapa| GM[(OpenStreetMap)]
  N -->|consultas com a sessão do usuário<br/>RLS aplicado| DB[(Supabase<br/>PostgreSQL)]
  N -->|login, cadastro, senha| AUTH[Supabase Auth]
  N -->|upload validado| ST[Supabase Storage]
  N -->|/api/cnpj e /api/cep| BR[BrasilAPI]
  N -->|/api/geocode| GEO[Nominatim]
```

Fluxo principal: **Login → Dashboard → Cadastro → CNPJ → Endereço/CEP → Maps → Upload de imagem → Banco de dados → Pesquisa → Edição/Exclusão.**

Princípios adotados:

- **Chaves no servidor.** BrasilAPI, Nominatim e a `service_role` são chamadas apenas pelo servidor (`/api/*` e server actions). No navegador só fica a chave pública do Supabase (protegida por RLS).
- **Defesa em profundidade.** Cada permissão é verificada na interface (esconde o que não pode), no servidor (actions/rotas recusam) e no banco (políticas RLS e triggers recusam mesmo que alguém chame a API diretamente).
- **Banco como fonte da verdade.** Documento único (`UNIQUE`), formatos (`CHECK`), auditoria automática (`criado_por`, `atualizado_por`, datas) e regras de perfil ficam no PostgreSQL.

---

## Estrutura do projeto

```
.
├── src/
│   ├── app/                         # Rotas (App Router)
│   │   ├── (auth)/                  # Páginas públicas: login, criar-acesso, recuperar-senha, redefinir-senha
│   │   ├── (app)/                   # Páginas privadas (com menu lateral)
│   │   │   ├── dashboard/
│   │   │   ├── participantes/       # lista, novo, [id] (detalhes), [id]/editar
│   │   │   ├── usuarios/            # gerenciamento de usuários (admin)
│   │   │   └── configuracoes/       # configurações e logo/ (admin)
│   │   ├── api/                     # APIs: cnpj/[cnpj], cep/[cep], geocode, upload
│   │   ├── auth/callback/           # retorno dos links de e-mail (confirmação/recuperação)
│   │   ├── layout.tsx · globals.css · error.tsx · not-found.tsx
│   ├── actions/                     # Server Actions: auth, participantes, usuarios, configuracoes
│   ├── components/
│   │   ├── ui/                      # Botões, campos, cards, diálogo de confirmação, skeletons...
│   │   ├── layout/                  # AppShell (menu lateral/cabeçalho), Logo, avisos
│   │   ├── auth/ · participantes/ · usuarios/ · configuracoes/ · dashboard/
│   ├── lib/
│   │   ├── supabase/                # clientes: navegador, servidor, admin (service_role), middleware
│   │   ├── auth/                    # sessão, guards (requireUsuario/requireAdmin), auth das APIs
│   │   ├── services/                # CNPJ, CEP, geocodificação, consultas, rate limit, cliente das APIs
│   │   ├── validations/             # CPF/CNPJ, Zod (auth, participante), upload
│   │   ├── utils/                   # máscaras, formatação, mensagens de erro
│   │   ├── constants.ts · env.ts
│   ├── types/database.ts            # tipos das tabelas
│   └── middleware.ts                # renova a sessão e protege rotas
├── supabase/
│   ├── migrations/…_schema_inicial.sql   # tabelas, RLS, triggers, funções, buckets (produção)
│   ├── seed.sql                          # dados de exemplo (SOMENTE desenvolvimento local)
│   ├── dados-exemplo.json                # mesma massa de dados, usada pelo script seed:dev
│   └── tests/permissoes.sql              # roteiro de teste das permissões (banco local)
├── scripts/seed-dev.mjs             # cria usuários e participantes de teste em projeto de DEV
├── tests/                           # testes unitários (validações, máscaras, esquemas)
├── .env.example                     # modelo das variáveis de ambiente
└── README.md
```

### Banco de dados

```mermaid
erDiagram
  AUTH_USERS ||--|| USUARIOS : "perfil 1:1"
  USUARIOS ||--o{ PARTICIPANTES : "criado_por / atualizado_por"
  USUARIOS ||--o{ CONFIGURACOES : "atualizado_por"
  USUARIOS {
    uuid id PK "= auth.users.id"
    text nome
    text email
    enum tipo_acesso "admin | usuario"
    enum tipo_solicitado
    timestamptz criado_em
  }
  PARTICIPANTES {
    uuid id PK
    text cpf_cnpj UK "só dígitos"
    text tipo_pessoa "PF/PJ (gerado)"
    text nome
    text razao_social
    text nome_fantasia
    text email
    text telefone
    text cep
    text endereco
    text numero
    text complemento
    text bairro
    text cidade
    text estado
    text categoria
    float latitude
    float longitude
    text imagem_url
    text imagem_path
    text observacoes
    uuid criado_por FK
    timestamptz criado_em
    timestamptz atualizado_em
  }
  CONFIGURACOES {
    smallint id PK "sempre 1"
    text nome_organizacao
    text logo_url
    text logo_path
    timestamptz atualizado_em
  }
```

> As senhas **não** ficam na tabela `usuarios`: são gerenciadas pelo Supabase Auth (`auth.users`) com hash bcrypt.

---

## Pré-requisitos

- **Node.js 20.9+** (recomendado 22 LTS) e npm
- Conta gratuita no **[Supabase](https://supabase.com)**
- Opcional: **Supabase CLI** + Docker, para rodar o banco localmente

---

## Instalação

```bash
git clone <url-do-repositorio> sistema-cadastro-participantes
cd sistema-cadastro-participantes
npm install
cp .env.example .env.local
```

Depois preencha o `.env.local` (próxima seção) e configure o banco.

---

## Variáveis de ambiente (.env)

O arquivo `.env.local` **não é versionado** (está no `.gitignore`). Use o `.env.example` como modelo.

| Variável | Obrigatória | Onde é usada | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sim | servidor | URL pública do sistema (ex.: `http://localhost:3000` ou `https://seu-app.vercel.app`). Usada nos links de e-mail. |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | navegador + servidor | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | navegador + servidor | Chave pública *anon* (ou *publishable*). Segura no navegador porque o acesso é limitado pelo RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Recomendada | **somente servidor** | Chave secreta. Necessária para o admin **criar e excluir usuários** pelo painel. **Nunca** use prefixo `NEXT_PUBLIC_`. |
| `GEOCODING_API_URL` | Não | servidor | Padrão: `https://nominatim.openstreetmap.org` (converte endereço em latitude/longitude). |
| `GEOCODING_EMAIL` | Não | servidor | E-mail de contato enviado ao Nominatim (recomendado pela política de uso). |
| `CNPJ_API_URL` | Não | servidor | Padrão: `https://brasilapi.com.br/api/cnpj/v1` |
| `CEP_API_URL` | Não | servidor | Padrão: `https://brasilapi.com.br/api/cep/v2` |
| `CNPJ_RATE_LIMIT_PER_MINUTE` | Não | servidor | Consultas de CNPJ por usuário por minuto (padrão 10). |
| `SEED_ALLOW` / `SEED_ADMIN_PASSWORD` | Só dev | script | Liberam o `npm run seed:dev` (veja abaixo). |

A página **Configurações** (admin) mostra quais integrações estão configuradas — sem exibir os valores das chaves.

---

## Configurando o banco de dados (Supabase)

### 1. Criar o projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Em **Project Settings → API** copie a **Project URL** e a chave **anon/publishable** para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, e a **service_role/secret** para `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Criar tabelas, políticas e buckets

**Opção A — SQL Editor (mais simples):** abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/migrations/20261006000000_schema_inicial.sql` e clique em **Run**. O script cria:

- tabelas `usuarios`, `participantes`, `configuracoes` e relacionamentos;
- trigger que cria o perfil em `usuarios` a cada novo cadastro no Auth;
- políticas RLS, triggers de auditoria e proteção do último administrador;
- buckets `participantes` (5 MB) e `branding` (2 MB) no Storage, com suas políticas.

**Opção B — Supabase CLI:**

```bash
npx supabase init            # cria supabase/config.toml (mantém as migrations existentes)
npx supabase login
npx supabase link --project-ref <ref-do-projeto>
npx supabase db push         # aplica supabase/migrations (NÃO aplica o seed)
```

### 3. Configurar a autenticação

Em **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (em produção, a URL do deploy)
- **Redirect URLs**: adicione `http://localhost:3000/**` e `https://SEU-DOMINIO/**`

Em **Authentication → Providers → Email**:

- **Confirm email** ligado (recomendado): o usuário confirma o e-mail antes de entrar. Desligado: o acesso é liberado na hora.
- Para e-mails em produção configure um SMTP próprio em **Authentication → Emails → SMTP Settings** (o SMTP padrão do Supabase tem limite baixo de envios).

### 4. Primeiro acesso

Rode o sistema e use **Criar acesso**. O **primeiro usuário cadastrado vira Administrador** automaticamente. Os seguintes entram como Usuário; quem pedir "Administrador" aparece como pendente em **Usuários** para aprovação.

---

## Mapa (OpenStreetMap)

O mapa e a localização de endereços usam o **OpenStreetMap**, que é **gratuito e não exige chave nem cartão**:

- **Mapa**: [Leaflet](https://leafletjs.com) com os blocos de `tile.openstreetmap.org`.
- **Endereço → latitude/longitude**: [Nominatim](https://nominatim.org), chamado pelo servidor em `/api/geocode`. O sistema tenta rua + número → rua → CEP → bairro → cidade e só aceita resultados da cidade/UF informadas.

Política de uso do Nominatim público: no máximo **1 consulta por segundo** (o servidor já respeita esse limite e guarda cache de 24 h). Para uso intenso em produção, use um provedor compatível (ex.: instância própria do Nominatim) e altere `GEOCODING_API_URL`.

---

## Configurando a API de CNPJ e CEP

A consulta usa a **[BrasilAPI](https://brasilapi.com.br)**, pública e sem chave:

- CNPJ: `GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}`
- CEP: `GET https://brasilapi.com.br/api/cep/v2/{cep}`

As chamadas passam pelo servidor do sistema (`/api/cnpj/[cnpj]` e `/api/cep/[cep]`), que exige login, valida o documento, aplica limite por usuário e guarda cache. Para usar outro provedor compatível, altere `CNPJ_API_URL` / `CEP_API_URL`; se o formato da resposta for diferente, ajuste o mapeamento em `src/lib/services/cnpj.ts` ou `cep.ts`.

> O limite em memória vale por instância do servidor. Em ambientes com muitas instâncias, troque `src/lib/services/rate-limit.ts` por um armazenamento compartilhado (ex.: Redis/Upstash).

---

## Executando localmente

```bash
npm run dev        # http://localhost:3000
```

Outros comandos:

```bash
npm run build      # build de produção
npm start          # executa o build
npm run lint       # ESLint
npm run typecheck  # verificação de tipos (TypeScript)
npm test           # testes unitários
```

---

## Dados de exemplo (somente desenvolvimento)

Os dados de exemplo **não fazem parte da migração** e nunca são aplicados em produção. Há duas formas de usá-los:

**1. Banco local com Supabase CLI** (requer Docker):

```bash
npx supabase start       # sobe Postgres/Auth/Storage locais e mostra as chaves locais
npx supabase db reset    # aplica a migração + supabase/seed.sql (10 participantes)
```

Use no `.env.local` a URL e as chaves exibidas pelo `supabase start`.

**2. Projeto Supabase de desenvolvimento** (separado do de produção):

```bash
# no .env.local do ambiente de DEV
SEED_ALLOW=true
SEED_ADMIN_PASSWORD=UmaSenhaForte123

npm run seed:dev
```

Cria `admin.dev@exemplo.com` (administrador), `usuario.dev@exemplo.com` (usuário) e os participantes de exemplo. O script **se recusa a rodar** com `NODE_ENV=production`/`VERCEL_ENV=production` ou sem `SEED_ALLOW=true`. Todos os registros têm "(Exemplo)" no nome e documentos fictícios com prefixo `9000000…`.

---

## Testes e verificação

- `npm test` — valida CPF/CNPJ, máscaras, detecção de tipo de imagem, esquemas de participante e de criação de acesso.
- `supabase/tests/permissoes.sql` — roteiro que testa no banco **local** as regras de permissão (usuário comum não exclui, não vira admin, não envia logo; admin exclui; último admin protegido; anônimo não lê participantes). Roda dentro de uma transação desfeita ao final:

  ```bash
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/permissoes.sql
  ```

### Roteiro de verificação manual (antes de apresentar)

1. **Autenticação**: criar acesso → confirmar e-mail → entrar → sair → "Esqueci minha senha" → redefinir → entrar com a nova senha. Acessar `/dashboard` deslogado deve levar ao login.
2. **Permissões**: com um Usuário comum, o menu não mostra Usuários/Configurações, `/usuarios` redireciona e não há botão Excluir.
3. **Cadastro**: CNPJ real (ex.: `19.131.243/0001-97`) → Consultar CNPJ → campos preenchidos → mapa localizado → imagem → salvar.
4. **CPF**: cadastro de pessoa física com CEP → endereço automático.
5. **Pesquisa**: buscar por parte do nome, por CNPJ com e sem máscara e por cidade; testar filtros.
6. **Edição/exclusão**: trocar e remover imagem; excluir (com confirmação) como admin.
7. **Logo**: enviar, ver no login/menu/cabeçalho/dashboard, substituir e remover.
8. **Responsividade**: DevTools nos tamanhos 390 px (celular), 820 px (tablet) e 1366 px (desktop).

---

## Deploy

### Vercel (recomendado)

1. Envie o projeto para o GitHub.
2. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório (framework **Next.js** detectado automaticamente).
3. Em **Settings → Environment Variables** cadastre as variáveis da tabela acima (Production e Preview). **Não** defina `SEED_ALLOW` em produção.
4. Faça o deploy. Depois:
   - atualize `NEXT_PUBLIC_SITE_URL` com a URL final e faça novo deploy;
   - no Supabase, ajuste **Site URL** e **Redirect URLs** (`https://SEU-DOMINIO/**`);

### Outras opções

Qualquer serviço que rode Node.js 20+ (Render, Railway, Fly.io, VPS com Docker/PM2): `npm ci && npm run build && npm start`, com as mesmas variáveis de ambiente.

### Banco de produção

Use um projeto Supabase **separado** do de desenvolvimento e aplique apenas a migração (`supabase db push` ou SQL Editor). Ative backups em **Database → Backups**.

---

## Segurança

- Senhas com hash (bcrypt) pelo Supabase Auth; política de senha forte (8+ caracteres, letras e números).
- Sessão em cookies HTTP-only; o middleware valida o token no servidor do Supabase (`getUser`) a cada requisição.
- Páginas privadas protegidas no middleware; páginas e ações administrativas checam o perfil no servidor.
- **Row Level Security** em todas as tabelas: só autenticados leem participantes; só admin exclui; usuário só vê o próprio perfil; só admin altera configurações; `criado_por` é definido pelo banco (não pode ser forjado).
- Trigger impede que usuários comuns alterem o próprio nível de acesso e que o último administrador seja removido ou rebaixado.
- O tipo "Administrador" escolhido no cadastro público vira apenas uma **solicitação**; só o primeiro usuário ou um admin (via `service_role`) concede o perfil.
- Uploads validados por tipo declarado, assinatura binária e tamanho, no servidor e nos limites do bucket; cada usuário só grava na própria pasta; logo só por admin.
- Proteção contra *open redirect* nos redirecionamentos pós-login e links de e-mail.
- Cabeçalhos de segurança (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- Chaves secretas apenas no servidor; `.env.local` fora do Git.

---

## Solução de problemas

| Sintoma | Causa provável / solução |
|---|---|
| "Supabase não configurado" | `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` ausentes no `.env.local`. Reinicie o `npm run dev` após editar. |
| "Perfil de usuário não encontrado" | A migração não foi aplicada (falta o trigger `on_auth_user_created`). Rode o SQL e crie o acesso novamente. |
| Link de e-mail volta para o login com "link inválido" | Redirect URL não cadastrada no Supabase, ou link aberto em outro navegador (o fluxo PKCE exige o mesmo navegador). |
| Mapa não carrega (área cinza) | Sem internet ou bloqueio de `tile.openstreetmap.org` pela rede/antivírus. |
| "Localização aproximada" ao localizar | A rua não existe no OpenStreetMap; o sistema usou o bairro/cidade. Arraste o marcador até o ponto certo. |
| "Serviço de mapas ocupado" | O Nominatim aceita 1 consulta por segundo; aguarde alguns segundos. |
| Não consigo criar/excluir usuários no painel | Defina `SUPABASE_SERVICE_ROLE_KEY` no servidor. |
| "Muitas consultas seguidas" no CNPJ | Limite por minuto atingido; aguarde ou ajuste `CNPJ_RATE_LIMIT_PER_MINUTE`. |

---

## Licença

Projeto acadêmico/portfólio — uso educacional livre.
