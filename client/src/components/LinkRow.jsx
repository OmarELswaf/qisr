import { useState } from 'react';
import { api } from '../api.js';

export default function LinkRow({ link, active, onStats }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function toggleQr() {
    if (qr) return setQr(null);
    setLoadingQr(true);
    try {
      const d = await api(`/api/links/${link.slug}/qr`);
      setQr(d.qr);
    } finally {
      setLoadingQr(false);
    }
  }

  return (
    <div className={`card py-4 ${active ? 'ring-1 ring-accent/50' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <a href={link.shortUrl} target="_blank" rel="noreferrer" className="text-accent font-medium hover:underline truncate block">
            {link.shortUrl.replace(/^https?:\/\//, '')}
          </a>
          <div className="text-xs text-slate-500 truncate">{link.longUrl}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 tabular-nums">{link.clicks} clicks</span>
          <button className="btn-ghost" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
          <button className="btn-ghost" onClick={toggleQr}>{loadingQr ? '...' : qr ? 'Hide QR' : 'QR'}</button>
          <button className="btn-ghost" onClick={onStats}>{active ? 'Hide stats' : 'Stats'}</button>
        </div>
      </div>
      {qr && (
        <div className="mt-3 flex justify-center">
          <img src={qr} alt={`QR code for ${link.shortUrl}`} className="rounded-lg bg-white p-2 w-40 h-40" />
        </div>
      )}
    </div>
  );
}
