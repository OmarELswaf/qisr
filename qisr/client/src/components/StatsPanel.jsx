import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { api } from '../api.js';

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6'];

export default function StatsPanel({ slug, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    api(`/api/links/${slug}/stats`)
      .then((d) => setData(d.link))
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="card text-rose-300 text-sm">{error}</div>;
  if (!data) return <div className="card text-slate-500 text-sm animate-pulse">Loading stats...</div>;

  const { stats } = data;
  const last30 = stats.byDay.slice(-30);
  const devices = Object.entries(stats.byDevice).map(([name, value]) => ({ name, value }));

  return (
    <section className="card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">/r/{data.slug}</h2>
          <div className="text-xs text-slate-500">{data.clicks} total clicks</div>
        </div>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Clicks, last 30 days</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last30}>
              <CartesianGrid stroke="#22304f" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(d) => d.slice(5)} stroke="#22304f" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#22304f" width={28} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#121b30', border: '1px solid #22304f', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="count" fill="#38bdf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Top referrers</h3>
          <table className="w-full text-sm">
            <tbody>
              {stats.byReferrer.slice(0, 6).map((r) => (
                <tr key={r.source} className="border-t border-line">
                  <td className="py-2 text-slate-400 truncate max-w-[180px]">{r.source}</td>
                  <td className="py-2 text-right text-slate-200 tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Devices</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={devices} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3}>
                  {devices.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#121b30', border: '1px solid #22304f', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center text-xs text-slate-400">
            {devices.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
