function ActionButton({ children, disabled, loading, onClick }) {
  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-senac-800 shadow-sm transition hover:-translate-y-0.5 hover:border-senac-300 hover:text-senac-950 disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled || loading}
      onClick={onClick}
      type="button"
    >
      {loading ? 'Carregando...' : children}
    </button>
  );
}

export function ActionPanel({
  disabled,
  loadingPortal,
  loadingPremium,
  loadingSubscription,
  onOpenPortal,
  onRefreshSubscription,
  onTestPremium
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(12,45,87,0.12)] backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">Acoes</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">Testes rapidos</h3>
        </div>
      </div>

      <div className="grid gap-3">
        <ActionButton
          disabled={disabled}
          loading={loadingSubscription}
          onClick={onRefreshSubscription}
        >
          Recarregar assinatura local
        </ActionButton>
        <ActionButton disabled={disabled} loading={loadingPremium} onClick={onTestPremium}>
          Testar rota premium
        </ActionButton>
        <ActionButton disabled={disabled} loading={loadingPortal} onClick={onOpenPortal}>
          Abrir Customer Portal
        </ActionButton>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-900">Use este fluxo durante a aula:</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li>Entrar com e-mail.</li>
          <li>Escolher um plano.</li>
          <li>Concluir o checkout na Stripe.</li>
          <li>Voltar aqui e recarregar a assinatura.</li>
          <li>Testar a rota premium.</li>
        </ol>
      </div>
    </article>
  );
}
