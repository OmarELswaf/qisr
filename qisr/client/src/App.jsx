import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import ShortenForm from './components/ShortenForm.jsx';
import LinkRow from './components/LinkRow.jsx';
import StatsPanel from './components/StatsPanel.jsx';

export default function App() {
  const [links, setLinks] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // slug shown in the stats panel

  const load = useCallback(() => {
    api('/api/links')
      .then((d) => setLinks(d.links))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-bold text-ink">ق</div>
            <div>
              <div className="font-semibold text-white leading-tight">Qisr</div>
              <div className="text-xs text-slate-500">URL shortener &amp; click analytics</div>
            </div>
          </div>
          <a
            href="https://github.com/OmarELswaf/qisr"
            className="btn-ghost"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <ShortenForm onCreated={() => load()} />

        {error && <div className="card text-rose-300 text-sm">{error}</div>}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">
              Links {links ? `(${links.length})` : ''}
            </h2>
            <span className="text-xs text-slate-500">sorted by clicks</span>
          </div>
          {!links && <div className="text-slate-500 text-sm animate-pulse">Loading links...</div>}
          {links?.map((l) => (
            <LinkRow
              key={l.slug}
              link={l}
              active={selected === l.slug}
              onStats={() => setSelected(selected === l.slug ? null : l.slug)}
              onChanged={load}
            />
          ))}
        </section>

        {selected && <StatsPanel slug={selected} onClose={() => setSelected(null)} />}

        <footer className="text-xs text-slate-600 pt-4 border-t border-line">
          Live demo: data is seeded and resets periodically. Redirects live under /r/slug.
          Built by Omar Elsawaf as a portfolio project.
        </footer>
      </main>
    </div>
  );
}
