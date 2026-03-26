export function Sidebar({ canLogout, onLogout, status, subscriptionStatus, userLabel }) {
  return (
    <aside className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_24px_60px_rgba(12,45,87,0.12)] backdrop-blur lg:sticky lg:top-6 lg:h-fit">
      <div className="inline-flex rounded-full bg-senac-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-senac-800">
        Senac + Stripe
      </div>

      <h1 className="mt-5 text-4xl font-bold leading-none text-slate-950">
        Projeto base da Aula 1
      </h1>

      <p className="mt-4 text-base leading-7 text-slate-600">
        Exemplo minimo para demonstrar login, catalogo local, Payment Links, webhook e
        protecao de rota premium.
      </p>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-linear-to-b from-white to-senac-50 p-5">
        <span className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">
          Sessao atual
        </span>
        <strong className="mt-2 block text-xl font-bold text-slate-950">{status}</strong>
        <p className="mt-3 text-sm leading-6 text-slate-600">{userLabel}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{subscriptionStatus}</p>
      </div>

      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={!canLogout}
        onClick={onLogout}
        type="button"
      >
        Sair
      </button>
    </aside>
  );
}
