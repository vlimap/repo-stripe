import { PlanCard } from './PlanCard';

export function PlansPanel({
  authenticated,
  checkoutPlanCode,
  loading,
  onCheckout,
  onRefresh,
  plans
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(12,45,87,0.12)] backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">
            Catalogo local
          </p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">Planos</h3>
        </div>

        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-senac-300 hover:text-senac-900 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={loading}
          onClick={onRefresh}
          type="button"
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="grid gap-4">
        {plans.length ? (
          plans.map((plan) => (
            <PlanCard
              authenticated={authenticated}
              checkoutPlanCode={checkoutPlanCode}
              key={plan.code}
              onCheckout={onCheckout}
              plan={plan}
            />
          ))
        ) : (
          <p className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Nenhum plano encontrado na API.
          </p>
        )}
      </div>
    </article>
  );
}
