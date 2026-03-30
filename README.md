# Stripe Aula 1

Projeto didatico para ensinar assinatura com Stripe usando:

- `back/`: API Express + Sequelize + PostgreSQL + Stripe
- `front/`: painel React bem direto para demonstrar o fluxo

## Objetivo da aula

O aluno precisa entender 4 ideias:

1. fazer login com e-mail
2. abrir um Payment Link
3. receber o webhook da Stripe
4. liberar acesso premium pelo backend

## O que foi simplificado

- o frontend ficou concentrado em `front/src/App.jsx`
- os componentes visuais extras foram removidos
- o backend ganhou um script `db:setup`
- agora existe um `package.json` na raiz com atalhos para os comandos principais

## Arquivos para estudar primeiro

Se a turma estiver vendo o projeto pela primeira vez, siga esta ordem:

1. `front/src/App.jsx`
2. `front/src/lib/api.js`
3. `back/src/server.js`
4. `back/src/modules/assinatura/controller/subscription.controller.js`
5. `back/src/modules/stripe/service/stripe.service.js`

## Configuracao rapida

1. Copie `back/.env.example` para `back/.env`.
2. Copie `front/.env.example` para `front/.env`.
3. Preencha o `DATABASE_URL`, `JWT_SECRET` e as chaves da Stripe no `back/.env`.
4. Instale as dependencias:
   - `npm --prefix back install`
   - `npm --prefix front install`
5. Prepare o banco:
   - `npm run db:setup`
6. Suba o backend:
   - `npm run dev:back`
7. Em outro terminal, suba o frontend:
   - `npm run dev:front`
8. Encaminhe os eventos da Stripe para o webhook local:
   - `stripe listen --forward-to localhost:3333/stripe/webhook`
9. Copie o `whsec_...` mostrado pela Stripe CLI para `STRIPE_WEBHOOK_SECRET`.

## Variaveis importantes no backend

- `APP_URL=http://localhost:5173`
- `CORS_ORIGIN=http://localhost:5173`
- `DATABASE_URL=postgres://...`
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`

Cada plano precisa de 2 valores no `back/.env`:

- a URL do Payment Link
- o ID do Payment Link (`plink_...`)

## Fluxo da demonstracao

1. O aluno entra com um e-mail.
2. O frontend busca os planos salvos no banco local.
3. O backend monta a URL final do Payment Link com `client_reference_id`.
4. O checkout acontece na Stripe.
5. A Stripe envia o evento para `POST /stripe/webhook`.
6. O backend atualiza a tabela `assinaturas`.
7. A rota `GET /assinaturas/recurso-premium` so libera acesso para assinatura ativa.

## Rotas principais

- `POST /usuarios/login`
- `GET /usuarios/me`
- `GET /planos`
- `POST /assinaturas/payment-link`
- `GET /assinaturas/me`
- `GET /assinaturas/recurso-premium`
- `POST /stripe/customer-portal`
- `POST /stripe/webhook`

## Dica de aula

Nao tente explicar tudo ao mesmo tempo. Primeiro mostre o login e o checkout. Depois volte no backend para mostrar:

- como o Payment Link e montado
- por que o webhook precisa usar `express.raw`
- como a assinatura local protege a rota premium
