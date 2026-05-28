import { Link } from 'react-router-dom';

export default function RelatedTools({ title = 'Related Tools', tools = [] }) {
  if (!tools || tools.length === 0) return null;

  return (
    <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-4 mt-8">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((t) => (
          <Link
            key={t.href}
            to={t.href}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 hover:shadow-sm hover:bg-slate-50 transition"
            aria-label={`Open ${t.name}`}
          >
            <div className="flex flex-col">
              <span>{t.name}</span>
              {t.description ? <span className="text-xs text-slate-500 mt-1">{t.description}</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
