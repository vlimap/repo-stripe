# Manual de Implementacao

Este manual organiza o projeto em uma ordem de implementacao que reduz confusao.

Importante: para estudar a demonstracao, voce pode abrir o frontend primeiro. Para implementar do zero, a melhor ordem e o contrario: configuracao, banco, backend, Stripe e so depois frontend.

## 1. Entenda a arquitetura antes de codar

O sistema tem 2 lados:

- `back/`: autentica o usuario, lista planos, monta o Payment Link, processa webhook e decide se o acesso premium esta liberado.
- `front/`: faz login, mostra os planos e chama as rotas da API.

O fluxo completo e este:

1. usuario entra com e-mail
2. frontend pega token JWT
3. frontend lista planos
4. usuario escolhe um plano
5. backend monta a URL final do Payment Link
6. Stripe recebe o pagamento
7. Stripe chama o webhook
8. backend atualiza a assinatura no banco
9. rota premium passa a responder

## 2. Primeiro passo: base do projeto e scripts

Comece pelos arquivos:

- `package.json`
- `back/package.json`
- `front/package.json`

Objetivo desta etapa:

- separar backend e frontend
- garantir scripts de execucao
- definir dependencias minimas

No projeto atual, o atalho principal da raiz esta em `package.json`:

- `npm run dev:back`
- `npm run dev:front`
- `npm run db:setup`
- `npm run build:front`

So avance quando voce souber responder:

- como subir o backend?
- como subir o frontend?
- como preparar o banco?

## 3. Segundo passo: configuracao e `.env`

Aqui esta o ponto certo para comecar a implementacao de verdade.

Arquivos principais:

- `back/.env.example`
- `front/.env.example`
- `back/src/config/sequelize.js`
- `back/src/config/stripe.js`

Objetivo desta etapa:

- configurar porta
- configurar CORS
- configurar PostgreSQL
- configurar chaves da Stripe
- configurar URLs e IDs dos Payment Links

No backend, as variaveis mais importantes sao:

- `PORT`
- `APP_URL`
- `CORS_ORIGIN`
- `JWT_SECRET`
- `DATABASE_URL`
- `DB_SSL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BASIC_PAYMENT_LINK_URL`
- `STRIPE_BASIC_PAYMENT_LINK_ID`
- `STRIPE_PRO_PAYMENT_LINK_URL`
- `STRIPE_PRO_PAYMENT_LINK_ID`
- `STRIPE_PRO_YEARLY_PAYMENT_LINK_URL`
- `STRIPE_PRO_YEARLY_PAYMENT_LINK_ID`

No frontend, a variavel principal e:

- `VITE_API_URL`

O que conferir aqui:

- `sequelize.js` falha cedo se `DATABASE_URL` nao existir
- `stripe.js` cria um client unico da Stripe
- o frontend aponta para a URL correta da API

So avance quando:

- voce tiver criado `back/.env`
- voce tiver criado `front/.env`
- voce souber de onde vem cada valor

## 4. Terceiro passo: inicializacao do backend

Arquivos principais:

- `back/src/server.js`
- `back/src/app.js`

Objetivo desta etapa:

- carregar `dotenv`
- autenticar no banco
- sincronizar configuracao de planos via ambiente
- subir o servidor Express
- registrar middlewares e rotas

`server.js` e o ponto de entrada real:

1. carrega `.env`
2. autentica no banco
3. chama `PlanService.syncPlansFromEnv()`
4. sobe a API

`app.js` organiza a aplicacao HTTP:

1. configura CORS
2. registra o webhook antes do `express.json()`
3. registra `express.json()`
4. expõe `/health`
5. monta as rotas

Regra importante:

Nao coloque `express.json()` antes da rota do webhook. O webhook precisa do corpo bruto para a Stripe validar a assinatura.

So avance quando:

- `/health` responder
- o servidor iniciar sem erro de ambiente

## 5. Quarto passo: banco, models, associacoes, migrations e seeders

Arquivos principais:

- `back/src/database/sequelize-cli.config.js`
- `back/src/database/init-models.js`
- `back/src/modules/usuario/model/user.model.js`
- `back/src/modules/plano/model/plan.model.js`
- `back/src/modules/assinatura/model/subscription.model.js`
- `back/src/modules/stripe/model/stripe-event.model.js`
- `back/src/database/migrations/*`
- `back/src/database/seeders/20260323223000-seed-plans.js`

Objetivo desta etapa:

- definir a estrutura persistida do sistema
- ligar os relacionamentos entre tabelas
- preparar o banco para receber o fluxo Stripe

As tabelas sao:

- `usuarios`
- `planos`
- `assinaturas`
- `stripe_events`

Papel de cada uma:

- `usuarios`: guarda identidade local e `stripeCustomerId`
- `planos`: guarda catalogo local, access key, Payment Link URL e Payment Link ID
- `assinaturas`: guarda status da assinatura e IDs da Stripe
- `stripe_events`: guarda eventos processados para evitar duplicidade

O `init-models.js` liga tudo:

- `User.hasMany(Subscription)`
- `Plan.hasMany(Subscription)`
- `Subscription.belongsTo(User)`
- `Subscription.belongsTo(Plan)`

Os seeders criam o catalogo inicial com:

- `BASIC`
- `PRO`
- `PRO_YEARLY`

Detalhe importante deste projeto:

O seeder cria os planos e o `PlanService.syncPlansFromEnv()` atualiza os links e IDs reais vindos do `.env`.

So avance quando:

- `npm run db:setup` funcionar
- as tabelas existirem
- os planos aparecerem no banco

## 6. Quinto passo: usuarios e autenticacao

Arquivos principais:

- `back/src/modules/usuario/service/user.service.js`
- `back/src/modules/usuario/controller/user.controller.js`
- `back/src/modules/usuario/route/user.route.js`
- `back/src/middlewares/auth.middleware.js`

Objetivo desta etapa:

- permitir login simples por e-mail
- emitir JWT
- restaurar o usuario autenticado em cada requisicao protegida

Fluxo:

1. `POST /usuarios/login`
2. backend localiza ou cria usuario por e-mail
3. backend gera JWT com `subject = user.id`
4. frontend guarda token
5. rotas protegidas usam `Authorization: Bearer ...`
6. `auth.middleware.js` valida token e coloca `req.user`

Por que isso vem antes da Stripe:

Porque o `client_reference_id` do checkout depende do usuario local ja existir.

So avance quando:

- login funcionar
- `GET /usuarios/me` responder com o usuario

## 7. Sexto passo: catalogo de planos

Arquivos principais:

- `back/src/modules/plano/service/plan.service.js`
- `back/src/modules/plano/controller/plan.controller.js`
- `back/src/modules/plano/route/plan.route.js`

Objetivo desta etapa:

- expor um catalogo local
- separar plano configurado de plano ainda nao configurado
- manter o frontend simples

O `PlanService` faz 3 coisas importantes:

1. define o catalogo padrao esperado pelo sistema
2. le as variaveis de ambiente com os Payment Links
3. faz `upsert` no banco ao subir a API

Esse ponto e muito bom pedagogicamente, porque mostra que:

- a aplicacao nao depende da dashboard da Stripe em tempo de leitura
- o backend conhece o plano mesmo sem chamar a API da Stripe

So avance quando:

- `GET /planos` listar os 3 planos
- `configured` refletir se o `.env` foi preenchido ou nao

## 8. Setimo passo: assinatura local

Arquivos principais:

- `back/src/modules/assinatura/service/subscription.service.js`
- `back/src/modules/assinatura/controller/subscription.controller.js`
- `back/src/modules/assinatura/route/subscription.route.js`
- `back/src/middlewares/require-active-subscription.middleware.js`

Objetivo desta etapa:

- criar a camada que representa a assinatura no sistema
- oferecer rota para pegar o Payment Link
- oferecer rota para ler a assinatura atual
- proteger a rota premium

As funcoes mais importantes do `SubscriptionService` sao:

- serializar assinatura para a API
- buscar ultima assinatura do usuario
- verificar acesso premium
- criar ou atualizar assinatura a partir do checkout
- sincronizar assinatura a partir de eventos da Stripe

As rotas principais sao:

- `POST /assinaturas/payment-link`
- `GET /assinaturas/me`
- `GET /assinaturas/recurso-premium`

Aqui aparece a regra mais importante do projeto:

Quem libera o acesso nao e a tela de sucesso da Stripe. Quem libera o acesso e o backend, olhando para a tabela `assinaturas`.

So avance quando:

- `POST /assinaturas/payment-link` devolver a URL final
- `GET /assinaturas/me` responder mesmo antes de pagar
- `GET /assinaturas/recurso-premium` bloquear usuarios sem assinatura ativa

## 9. Oitavo passo: integracao Stripe

Arquivos principais:

- `back/src/modules/stripe/service/stripe.service.js`
- `back/src/modules/stripe/controller/stripe.controller.js`
- `back/src/modules/stripe/route/stripe.route.js`

Objetivo desta etapa:

- montar URL final do checkout
- criar sessao do Customer Portal
- validar assinatura do webhook
- processar os eventos da Stripe

O `StripeService.buildPaymentLink()` faz o checkout carregar contexto do sistema:

- adiciona `client_reference_id`
- adiciona e-mail pre-preenchido e travado

O `handleWebhookEvent()` trata os eventos:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Ordem interna do webhook:

1. validar assinatura do evento
2. verificar se o evento ja foi processado
3. identificar usuario e plano
4. criar ou atualizar assinatura local
5. salvar o `stripe_event_id`

Esse e o coracao da integracao.

So avance quando:

- `stripe listen --forward-to localhost:3333/stripe/webhook` estiver funcionando
- `POST /stripe/webhook` responder sem erro de assinatura
- um pagamento real de teste atualizar a tabela `assinaturas`

## 10. Nono passo: frontend

Arquivos principais:

- `front/src/App.jsx`
- `front/src/lib/api.js`
- `front/src/main.jsx`

Objetivo desta etapa:

- guiar o aluno pelo fluxo
- chamar as rotas certas da API
- mostrar estado atual da sessao
- mostrar o que voltou da API

Ordem ideal de implementacao do frontend:

1. criar cliente HTTP em `lib/api.js`
2. fazer login
3. listar planos
4. abrir checkout
5. recarregar assinatura
6. testar rota premium
7. abrir Customer Portal

O frontend deste projeto foi simplificado de proposito:

- um unico `App.jsx`
- pouca fragmentacao
- foco em demonstrar a integracao

So avance quando:

- login funcionar
- planos aparecerem
- o botao de checkout abrir a Stripe
- os botoes de assinatura e premium refletirem o estado real do backend

## 11. Decimo passo: teste completo

Siga esta ordem:

1. preencher `.env`
2. instalar dependencias
3. rodar `npm run db:setup`
4. subir backend
5. subir frontend
6. fazer `stripe login`
7. rodar `stripe listen --forward-to localhost:3333/stripe/webhook`
8. copiar o `whsec_...` para o backend
9. entrar com e-mail
10. abrir checkout
11. pagar com cartao de teste
12. recarregar assinatura
13. testar a rota premium

## 12. Ordem ideal para estudar o codigo atual

Se voce quer entender o projeto que ja existe, siga esta ordem:

1. `front/src/App.jsx`
2. `front/src/lib/api.js`
3. `back/src/server.js`
4. `back/src/app.js`
5. `back/src/modules/usuario/controller/user.controller.js`
6. `back/src/middlewares/auth.middleware.js`
7. `back/src/modules/plano/service/plan.service.js`
8. `back/src/modules/assinatura/controller/subscription.controller.js`
9. `back/src/modules/assinatura/service/subscription.service.js`
10. `back/src/modules/stripe/service/stripe.service.js`
11. `back/src/database/init-models.js`
12. `back/src/database/migrations/*`

## 13. Onde normalmente as pessoas se perdem

Os erros mais comuns sao:

- tentar fazer frontend antes de o backend responder
- testar checkout antes de configurar os Payment Links no `.env`
- esquecer que o webhook precisa vir antes do `express.json()`
- confiar na `success_url` para liberar acesso
- nao guardar `stripeCustomerId`, `stripeSubscriptionId` e `stripeCheckoutSessionId`
- nao salvar eventos processados para evitar duplicidade

## 14. Regra pratica para nunca se perder

Se voce estiver implementando do zero, use sempre esta pergunta:

"Qual e a proxima camada minima que precisa existir para a seguinte funcionar?"

A resposta quase sempre sera esta:

1. config
2. banco
3. auth
4. planos
5. assinatura local
6. Stripe
7. frontend

Essa e a ordem mais segura para construir o sistema.
