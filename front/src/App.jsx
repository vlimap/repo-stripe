import { startTransition, useEffect, useState } from 'react';

import { ActionPanel } from './components/ActionPanel';
import { LoginHero } from './components/LoginHero';
import { LogsPanel } from './components/LogsPanel';
import { PlansPanel } from './components/PlansPanel';
import { Sidebar } from './components/Sidebar';
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
  message: 'A API deve estar rodando em paralelo para este painel funcionar.'
};

function createLogEntry(title, payload) {
  return {
    id: crypto.randomUUID(),
    title,
    payload,
    at: new Date().toLocaleTimeString('pt-BR')
  };
}

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

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [logs, setLogs] = useState([]);
  const [notice, setNotice] = useState(INITIAL_NOTICE);
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

  function pushLog(title, payload) {
    startTransition(() => {
      setLogs((current) => [createLogEntry(title, payload), ...current].slice(0, 12));
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

      startTransition(() => {
        setPlans(payload.plans);
      });

      if (!silent) {
        pushLog('Planos carregados', payload);
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

    startTransition(() => {
      setUser(mePayload.user);
      setSubscription(subscriptionPayload.subscription);
    });

    if (!silent) {
      pushLog('Sessao restaurada', {
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
          pushLog('Sessao restaurada', { source: 'localStorage' });
        }

        updateNotice('Painel pronto para a demonstracao.', 'success');
      } catch (error) {
        updateNotice(error.message, 'error');
        pushLog('Erro no bootstrap', { message: error.message });
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
      startTransition(() => {
        setToken(payload.token);
        setUser(payload.user);
      });

      pushLog('Login didatico', payload);
      await restoreSession(payload.token, { silent: true });
      updateNotice('Login realizado. Agora escolha um plano.', 'success');
    } catch (error) {
      updateNotice(error.message, 'error');
      pushLog('Erro ao fazer login', { message: error.message });
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
      pushLog('Erro ao recarregar planos', { message: error.message });
    }
  }

  async function handleCheckout(planCode) {
    setLoading((current) => ({ ...current, checkoutPlanCode: planCode }));

    try {
      const payload = await getPaymentLink(token, planCode);
      pushLog(`Payment Link ${planCode}`, payload);
      updateNotice(`Checkout do plano ${planCode} aberto em nova aba.`, 'success');
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      updateNotice(error.message, 'error');
      pushLog(`Erro no plano ${planCode}`, { message: error.message });
    } finally {
      setLoading((current) => ({ ...current, checkoutPlanCode: null }));
    }
  }

  async function handleRefreshSubscription() {
    setLoading((current) => ({ ...current, subscription: true }));

    try {
      const payload = await getSubscription(token);
      startTransition(() => {
        setSubscription(payload.subscription);
      });
      pushLog('Assinatura recarregada', payload);
      updateNotice('Assinatura recarregada a partir do banco local.', 'success');
    } catch (error) {
      updateNotice(error.message, 'error');
      pushLog('Erro ao recarregar assinatura', { message: error.message });
    } finally {
      setLoading((current) => ({ ...current, subscription: false }));
    }
  }

  async function handlePremiumCheck() {
    setLoading((current) => ({ ...current, premium: true }));

    try {
      const payload = await getPremiumResource(token);
      pushLog('Rota premium liberada', payload);
      updateNotice('A rota premium respondeu com sucesso.', 'success');
    } catch (error) {
      updateNotice(error.message, 'error');
      pushLog('Rota premium bloqueada', { message: error.message });
    } finally {
      setLoading((current) => ({ ...current, premium: false }));
    }
  }

  async function handleOpenPortal() {
    setLoading((current) => ({ ...current, portal: true }));

    try {
      const payload = await createCustomerPortalSession(token);
      pushLog('Customer Portal', payload);
      updateNotice('Customer Portal aberto em nova aba.', 'success');
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      updateNotice(error.message, 'error');
      pushLog('Erro no Customer Portal', { message: error.message });
    } finally {
      setLoading((current) => ({ ...current, portal: false }));
    }
  }

  function handleLogout() {
    resetSession();
    updateNotice('Sessao encerrada no navegador.');
    pushLog('Logout', { ok: true });
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(240,180,41,0.24),transparent_24rem),radial-gradient(circle_at_top_right,rgba(0,86,164,0.18),transparent_26rem),linear-gradient(135deg,#f4f7fb,#ffffff_48%,#dce8f7)]" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Sidebar
          canLogout={isAuthenticated}
          onLogout={handleLogout}
          status={isAuthenticated ? 'Autenticado' : 'Nao autenticado'}
          subscriptionStatus={formatSubscription(subscription)}
          userLabel={
            user ? `${user.email} • id ${user.id}` : 'Entre com um e-mail para iniciar.'
          }
        />

        <main className="grid gap-5">
          <LoginHero
            email={email}
            loading={loading.login || loading.boot}
            notice={notice}
            onEmailChange={setEmail}
            onSubmit={handleLogin}
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <PlansPanel
              authenticated={isAuthenticated}
              checkoutPlanCode={loading.checkoutPlanCode}
              loading={loading.plans}
              onCheckout={handleCheckout}
              onRefresh={handleRefreshPlans}
              plans={plans}
            />

            <ActionPanel
              disabled={!isAuthenticated}
              loadingPortal={loading.portal}
              loadingPremium={loading.premium}
              loadingSubscription={loading.subscription}
              onOpenPortal={handleOpenPortal}
              onRefreshSubscription={handleRefreshSubscription}
              onTestPremium={handlePremiumCheck}
            />
          </section>

          <LogsPanel logs={logs} />
        </main>
      </div>
    </div>
  );
}

export default App;
