# Exemplo Base - Stripe Aula 1

Projeto didatico com `back/` e `front/` para apoiar a aula de assinatura com Stripe Payment Links.

## O que este projeto cobre

- login simplificado por e-mail
- catalogo local de planos
- endpoint para montar a URL final do Payment Link
- webhook Stripe com validacao de assinatura
- atualizacao de assinatura local no PostgreSQL
- rota premium protegida no backend
- atalho para abrir o Customer Portal

## Estrutura

- `back/`: API Express + Sequelize + Stripe
- `front/`: interface simples em React + Vite + Tailwind CSS

## Fluxo demonstrado

1. O aluno faz login com e-mail.
2. O frontend lista os planos salvos no banco local.
3. O backend devolve a URL do Payment Link com `client_reference_id` e `locked_prefilled_email`.
4. O checkout acontece na Stripe.
5. A Stripe envia o evento para `/stripe/webhook`.
6. O backend atualiza a tabela `assinaturas`.
7. A rota premium passa a responder apenas para quem tem acesso `premium`.

## Pre-requisitos

- Node.js 20+
- PostgreSQL
- Conta Stripe em modo de teste
- Stripe CLI (recomendado para testar webhook local)

## Configuracao rapida

1. Crie um banco PostgreSQL.
2. Copie `back/.env.example` para `back/.env` e preencha os valores.
3. Copie `front/.env.example` para `front/.env`.
4. Instale as dependencias:
   - `cd back && npm install`
   - `cd ../front && npm install`
5. Execute as migrations e o seeder inicial:
   - `cd ../back`
   - `npm run db:migrate`
   - `npm run db:seed`
6. Suba a API:
   - `npm run dev`
7. Suba o frontend:
   - `cd ../front && npm run dev`
8. Encaminhe os eventos Stripe para o webhook local:
   - `stripe listen --forward-to localhost:3333/stripe/webhook`
9. Copie o `whsec_...` gerado pela Stripe CLI para `STRIPE_WEBHOOK_SECRET`.

## O que precisa ser configurado na Stripe

Crie tres planos recorrentes na Dashboard:

- `BASIC`
- `PRO`
- `PRO_YEARLY`

Para cada um deles, salve no `.env`:

- a URL do Payment Link
- o ID do Payment Link (`plink_...`)

O ID e usado no webhook para reconciliar a compra com o plano local.

## Observacoes didaticas

- O backend agora usa `sequelize-cli` com migrations e seeders, como na aula.
- A aplicacao trata o banco local como fonte de verdade para liberar acesso.
- A rota premium so libera acesso para planos com `accessKey = premium`.
