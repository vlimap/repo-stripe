import { useEffect, useState } from 'react';
import {
  TOKEN_STORAGE_KEY,
  createCustomerPortalSession,
  getPaymentLink,
  getPremiumResource,
  getSubscription,
  getUser,
  listPlans,
  login
} from './lib/api';

const INITIAL_NOTICE = {
  type: 'default',
  message: 'Inicie o backend em http://localhost:3333 para comecar a demonstracao.'
};

function formatSubscription(subscription) {
  if (!subscription) {
    return 'Nenhuma assinatura local encontrada.';
  }

  const period = subscription.currentPeriodEnd
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(subscription.currentPeriodEnd))
    : 'sem periodo salvo';

  return `${subscription.plan?.name || 'Plano'} • ${subscription.status} • ate ${period}`;
}

function formatJson(payload) {
  return JSON.stringify(payload, null, 2);
}

function noticeClasses(type) {
  if (type === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  if (type === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }

  return 'border-sky-200 bg-sky-50 text-sky-900';
}

function StepCard({ number, title, description }) {
  return (
    <article className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-300/20 text-sm font-bold text-sky-100">
        {number}
      </span>
      <h2 className="mt-3 text-base font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </article>
  );
}

function ActionButton({ children, disabled, loading, onClick }) {
  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled || loading}
      onClick={onClick}
      type="button"
    >
      {loading ? 'Carregando...' : children}
    </button>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [notice, setNotice] = useState(INITIAL_NOTICE);
  const [lastResponse, setLastResponse] = useState(null);
  const [loading, setLoading] = useState({
    boot: true,
    login: false,
    plans: false,
    subscription: false,
    premium: false,
    portal: false,
    checkoutPlanCode: null
  });

  const isAuthenticated = Boolean(token && user);

  function storeLastResponse(title, payload) {
    setLastResponse({
      title,
      payload,
      at: new Date().toLocaleTimeString('pt-BR')
    });
  }

  function updateNotice(message, type = 'default') {
    setNotice({ message, type });
  }

  function resetSession() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setSubscription(null);
  }

  async function loadPlans({ silent = false } = {}) {
    setLoading((current) => ({ ...current, plans: true }));

    try {
      const payload = await listPlans();

      setPlans(payload.plans);

      if (!silent) {
        storeLastResponse('GET /planos', payload);
      }

      return payload;
    } finally {
      setLoading((current) => ({ ...current, plans: false }));
    }
  }

  async function restoreSession(sessionToken, { silent = false } = {}) {
    const [mePayload, subscriptionPayload] = await Promise.all([
      getUser(sessionToken),
      getSubscription(sessionToken)
    ]);

    setUser(mePayload.user);
    setSubscription(subscriptionPayload.subscription);

    if (!silent) {
      storeLastResponse('Sessao restaurada', {
        user: mePayload.user.email,
        subscription: subscriptionPayload.subscription
      });
    }

    return { mePayload, subscriptionPayload };
  }

  useEffect(() => {
    async function bootstrap() {
      updateNotice('Carregando planos e restaurando sessao...');

      try {
        await loadPlans({ silent: true });

        if (token) {
          await restoreSession(token, { silent: true });
          storeLastResponse('Sessao restaurada', { source: 'localStorage' });
        }

        updateNotice('Painel pronto para a demonstracao.', 'success');
      } catch (error) {
        updateNotice(error.message, 'error');
        resetSession();
      } finally {
        setLoading((current) => ({ ...current, boot: false }));
      }
    }

    bootstrap();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    if (!email.trim()) {
      updateNotice('Informe um e-mail valido para o login didatico.', 'error');
      return;
    }

    setLoading((current) => ({ ...current, login: true }));

    try {
      const payload = await login(email.trim());

      localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
      setToken(payload.token);
      setUser(payload.user);
      setEmail(payload.user.email);

      storeLastResponse('POST /usuarios/login', payload);
      await restoreSession(payload.token, { silent: true });
      updateNotice('Login realizado. Agora escolha um plano.', 'success');
    } catch (error) {
      updateNotice(error.message, 'error');
    } finally {
      setLoading((current) => ({ ...current, login: false }));
    }
  }

  async function handleRefreshPlans() {
    try {
      await loadPlans();
      updateNotice('Catalogo local recarregado.', 'success');
    } catch (error) {
      updateNotice(error.message, 'error');
    }
  }

  async function handleCheckout(planCode) {
    setLoading((current) => ({ ...current, checkoutPlanCode: planCode }));

    try {
      const payload = await getPaymentLink(token, planCode);
      storeLastResponse('POST /assinaturas/payment-link', payload);
      updateNotice(`Checkout do plano ${planCode} aberto em nova aba.`, 'success');
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      updateNotice(error.message, 'error');
    } finally {
      setLoading((current) => ({ ...current, checkoutPlanCode: null }));
    }
  }

  async function handleRefreshSubscription() {
    setLoading((current) => ({ ...current, subscription: true }));

    try {
      const payload = await getSubscription(token);
      setSubscription(payload.subscription);
      storeLastResponse('GET /assinaturas/me', payload);
      updateNotice('Assinatura recarregada a partir do banco local.', 'success');
    } catch (error) {
      updateNotice(error.message, 'error');
    } finally {
      setLoading((current) => ({ ...current, subscription: false }));
    }
  }

  async function handlePremiumCheck() {
    setLoading((current) => ({ ...current, premium: true }));

    try {
      const payload = await getPremiumResource(token);
      storeLastResponse('GET /assinaturas/recurso-premium', payload);
      updateNotice('A rota premium respondeu com sucesso.', 'success');
    } catch (error) {
      updateNotice(error.message, 'error');
    } finally {
      setLoading((current) => ({ ...current, premium: false }));
    }
  }

  async function handleOpenPortal() {
    setLoading((current) => ({ ...current, portal: true }));

    try {
      const payload = await createCustomerPortalSession(token);
      storeLastResponse('POST /stripe/customer-portal', payload);
      updateNotice('Customer Portal aberto em nova aba.', 'success');
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      updateNotice(error.message, 'error');
    } finally {
      setLoading((current) => ({ ...current, portal: false }));
    }
  }

  function handleLogout() {
    resetSession();
    updateNotice('Sessao encerrada no navegador.');
    storeLastResponse('Logout local', { ok: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-sky-200">Stripe Aula 1</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
                Fluxo simplificado para o aluno entender login, checkout, webhook e acesso premium.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                O frontend agora serve como um roteiro visual da aula. O foco fica no que mais
                importa: autenticar, abrir o Payment Link, receber o webhook e validar o acesso no
                backend.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-200">
                  Sessao
                </p>
                <strong className="mt-2 block text-2xl font-bold text-white">
                  {isAuthenticated ? 'Autenticado' : 'Nao autenticado'}
                </strong>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                {user ? `${user.email} • id ${user.id}` : 'Use qualquer e-mail valido para entrar.'}
              </p>
              <p className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm leading-6 text-slate-200">
                {formatSubscription(subscription)}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <StepCard
              description="O login didatico so cria ou localiza o usuario pelo e-mail."
              number="1"
              title="Entrar"
            />
            <StepCard
              description="Cada plano aponta para um Payment Link salvo no .env do backend."
              number="2"
              title="Escolher plano"
            />
            <StepCard
              description="A Stripe confirma a compra pelo webhook e atualiza a assinatura local."
              number="3"
              title="Receber webhook"
            />
            <StepCard
              description="A rota premium so libera acesso quando o banco diz que a assinatura esta ativa."
              number="4"
              title="Testar acesso"
            />
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="space-y-6">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">
                    Passo 1
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">
                    Login simplificado por e-mail
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Esse login existe so para a turma conseguir navegar no fluxo sem cadastro e
                    senha.
                  </p>
                </div>

                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={!isAuthenticated}
                  onClick={handleLogout}
                  type="button"
                >
                  Sair
                </button>
              </div>

              <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleLogin}>
                <input
                  className="min-h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-senac-400 focus:bg-white"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="aluno@senac.br"
                  type="email"
                  value={email}
                />
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={loading.login || loading.boot}
                  type="submit"
                >
                  {loading.login ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${noticeClasses(notice.type)}`}>
                {notice.message}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">
                    Passo 2
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">Escolher um plano</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    O aluno so precisa visualizar o catalogo local e abrir o checkout certo.
                  </p>
                </div>

                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={loading.plans}
                  onClick={handleRefreshPlans}
                  type="button"
                >
                  {loading.plans ? 'Atualizando...' : 'Atualizar planos'}
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {plans.length ? (
                  plans.map((plan) => {
                    const configured = Boolean(plan.configured);
                    const loadingCheckout = loading.checkoutPlanCode === plan.code;

                    return (
                      <article
                        className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5"
                        key={plan.code}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-senac-700">
                              {plan.code}
                            </p>
                            <h3 className="mt-1 text-xl font-bold text-slate-950">{plan.name}</h3>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              configured
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {configured ? 'configurado' : 'pendente'}
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                            acesso: {plan.accessKey}
                          </span>
                          {!isAuthenticated ? (
                            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              faca login para continuar
                            </span>
                          ) : null}
                        </div>

                        <button
                          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55"
                          disabled={!isAuthenticated || !configured || loadingCheckout}
                          onClick={() => handleCheckout(plan.code)}
                          type="button"
                        >
                          {loadingCheckout
                            ? 'Abrindo checkout...'
                            : configured
                              ? 'Abrir checkout'
                              : 'Configurar no .env'}
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <p className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Nenhum plano foi carregado da API.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">Passo 3</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">Validar no backend</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Depois do checkout, use estes botoes para provar que o banco local virou a fonte
                de verdade.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ActionButton
                  disabled={!isAuthenticated}
                  loading={loading.subscription}
                  onClick={handleRefreshSubscription}
                >
                  Recarregar assinatura
                </ActionButton>
                <ActionButton
                  disabled={!isAuthenticated}
                  loading={loading.premium}
                  onClick={handlePremiumCheck}
                >
                  Testar rota premium
                </ActionButton>
                <ActionButton
                  disabled={!isAuthenticated}
                  loading={loading.portal}
                  onClick={handleOpenPortal}
                >
                  Abrir Customer Portal
                </ActionButton>
              </div>
            </article>
          </section>

          <aside className="space-y-6">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">
                O que explicar
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">Pontos da aula</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>O frontend nao cria assinatura, ele apenas dispara o checkout.</li>
                <li>O webhook e quem confirma a compra e atualiza a tabela `assinaturas`.</li>
                <li>A rota premium depende do banco local, nao apenas da resposta visual da Stripe.</li>
                <li>O Customer Portal so funciona depois que a Stripe cria um customer real.</li>
              </ul>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">
                Ultima resposta
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">API</h2>

              {lastResponse ? (
                <>
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <strong className="text-slate-900">{lastResponse.title}</strong>
                    <time className="text-slate-500">{lastResponse.at}</time>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-[1.4rem] bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">
                    {formatJson(lastResponse.payload)}
                  </pre>
                </>
              ) : (
                <p className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Assim que voce chamar alguma rota, a resposta vai aparecer aqui.
                </p>
              )}
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">
                Arquivos para estudar
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li><code>front/src/App.jsx</code>: fluxo visual completo da aula.</li>
                <li><code>front/src/lib/api.js</code>: chamadas HTTP para a API.</li>
                <li><code>back/src/modules/assinatura/controller/subscription.controller.js</code>: checkout e rota premium.</li>
                <li><code>back/src/modules/stripe/service/stripe.service.js</code>: webhook e Customer Portal.</li>
              </ul>
            </article>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;
