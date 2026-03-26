function badgeClasses(configured) {
  return configured
    ? 'bg-senac-100 text-senac-800'
    : 'bg-amber-100 text-amber-800';
}

export function PlanCard({ authenticated, checkoutPlanCode, onCheckout, plan }) {
  const loading = checkoutPlanCode === plan.code;
  const disabled = !authenticated || !plan.configured || loading;

  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-senac-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">{plan.code}</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-950">{plan.name}</h3>
        </div>

        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClasses(plan.configured)}`}>
          {plan.configured ? 'configurado' : 'pendente'}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>

      <div className="mt-5 flex items-center justify-between gap-4">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          {plan.accessKey}
        </span>

        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-linear-to-r from-senac-700 to-senac-900 px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,86,164,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={disabled}
          onClick={() => onCheckout(plan.code)}
          type="button"
        >
          {loading ? 'Abrindo...' : plan.configured ? 'Abrir checkout' : 'Configurar no .env'}
        </button>
      </div>
    </article>
  );
}
