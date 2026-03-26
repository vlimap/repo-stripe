function noticeClasses(type) {
  if (type === 'success') {
    return 'border-emerald-200 bg-emerald-50/90 text-emerald-700';
  }

  if (type === 'error') {
    return 'border-rose-200 bg-rose-50/90 text-rose-700';
  }

  return 'border-amber-200 bg-amber-50/90 text-senac-900';
}

export function LoginHero({ email, loading, notice, onEmailChange, onSubmit }) {
  return (
    <section className="rounded-[1.9rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(12,45,87,0.12)] backdrop-blur md:p-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-senac-700">
            Fluxo didatico
          </p>
          <h2 className="mt-3 max-w-xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
            Escolha o plano, abra o checkout e confirme o acesso pelo backend.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Esta interface existe para apoiar a demonstracao da aula. O foco continua no backend,
            no webhook e na reconciliacao segura da assinatura.
          </p>
        </div>

        <form className="grid gap-3 rounded-[1.4rem] border border-slate-200 bg-white/90 p-5" onSubmit={onSubmit}>
          <label className="text-sm font-medium text-slate-600" htmlFor="email">
            Login simplificado por e-mail
          </label>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="min-h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-senac-400 focus:bg-white"
              id="email"
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="aluno@senac.br"
              type="email"
              value={email}
            />
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-linear-to-r from-senac-700 to-senac-900 px-6 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,86,164,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>

      <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-medium ${noticeClasses(notice.type)}`}>
        {notice.message}
      </div>
    </section>
  );
}
