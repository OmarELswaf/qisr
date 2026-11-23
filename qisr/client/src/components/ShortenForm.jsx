import { useState } from 'react';
import { api } from '../api.js';

export default function ShortenForm({ onCreated }) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const body = { url: url.trim() };
      if (slug.trim()) body.slug = slug.trim();
      const { link } = await api('/api/links', { method: 'POST', body: JSON.stringify(body) });
      setCreated(link);
      setUrl('');
      setSlug('');
      onCreated();
    } catch (err) {
      setError(err.body?.fields?.[0]?.message || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="card space-y-4">
      <h1 className="text-lg font-semibold text-white">Shorten a URL</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          type="url"
          placeholder="https://example.com/a/very/long/link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <input
            className="input w-44"
            placeholder="custom slug (optional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            pattern="[a-zA-Z0-9\-_]{3,32}"
            title="3-32 chars: letters, numbers, dash, underscore"
          />
          <button className="btn-primary flex-1" disabled={busy}>
            {busy ? 'Shortening...' : 'Shorten'}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {created && (
        <div className="flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
          <div className="min-w-0">
            <div className="text-accent font-medium truncate">{created.shortUrl}</div>
            <div className="text-xs text-slate-500 truncate">{created.longUrl}</div>
          </div>
          <button className="btn-ghost shrink-0" onClick={() => copy(created.shortUrl)}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
