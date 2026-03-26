export function LogsPanel({ logs }) {
  return (
    <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(12,45,87,0.12)] backdrop-blur">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-senac-700">
          Observabilidade
        </p>
        <h3 className="mt-1 text-2xl font-bold text-slate-900">Log da tela</h3>
      </div>

      <div className="grid gap-3">
        {logs.length ? (
          logs.map((entry) => (
            <article
              className="rounded-[1.25rem] border border-slate-800/70 bg-slate-950 p-4 font-mono text-sm text-slate-100"
              key={entry.id}
            >
              <strong className="block text-sm text-white">{entry.title}</strong>
              <time className="mt-1 block text-xs text-slate-400">{entry.at}</time>
              <pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-slate-200">
                {JSON.stringify(entry.payload, null, 2)}
              </pre>
            </article>
          ))
        ) : (
          <p className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            As respostas da API vao aparecer aqui.
          </p>
        )}
      </div>
    </article>
  );
}
