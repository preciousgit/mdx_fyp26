import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  BarChart2, TrendingUp, AlertTriangle, CheckCircle, Package,
  ShieldCheck, AlertCircle, Activity, ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';

// ─── Simple SVG bar chart ──────────────────────────────────────────────────────
function BarChart({ data, maxVal, colorFn }: {
  data: { label: string; value: number }[];
  maxVal: number;
  colorFn: (v: number) => string;
}) {
  if (!data.length) return null;
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="w-full flex items-end" style={{ height: '80px' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, 2)}%` }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                className={`w-full rounded-t transition-opacity group-hover:opacity-100 opacity-80 ${colorFn(d.value)}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-600 group-hover:text-slate-400 transition-colors truncate w-full text-center">{d.label}</span>
            {/* Hover tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0D1626] border border-white/10 rounded px-2 py-0.5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {d.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'text-white', icon: Icon }: {
  label: string; value: string | number; sub?: string;
  color?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white/3 border border-white/6 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-500 text-xs uppercase tracking-wider">{label}</p>
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.portfolio()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!profile || (profile.role !== 'regulator' && profile.role !== 'producer')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldCheck className="h-12 w-12 text-slate-600" />
        <p className="text-slate-400">Analytics are available to regulators and producers.</p>
        <button onClick={() => navigate('/dashboard')} className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to Dashboard</button>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading analytics…</p>
      </div>
    </div>
  );

  if (!data) return null;

  // Event activity chart
  const eventDays = Object.entries(data.eventsByDay || {}).map(([day, count]) => ({
    label: new Date(day).toLocaleDateString('en', { weekday: 'short' }),
    value: count as number,
  }));
  const maxEvents = Math.max(...eventDays.map(d => d.value), 1);

  // Category risk chart
  const maxCatRisk = Math.max(...(data.categories || []).map((c: any) => c.avgRisk), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-violet-400" /> Supply Chain Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">Portfolio-level Business Intelligence · live data</p>
        </div>
        <button onClick={() => {
          setLoading(true);
          api.analytics.portfolio().then(setData).catch(console.error).finally(() => setLoading(false));
        }}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-all">
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={data.total} icon={Package} />
        <StatCard label="High Risk" value={data.highRisk} color="text-red-400" icon={AlertTriangle} sub={`${data.total > 0 ? Math.round((data.highRisk / data.total) * 100) : 0}% of portfolio`} />
        <StatCard label="Compliance Rate" value={`${data.complianceRate}%`} color={data.complianceRate > 80 ? 'text-emerald-400' : 'text-amber-400'} icon={CheckCircle} />
        <StatCard label="Anomalies Detected" value={data.totalAnomalies} color={data.totalAnomalies > 0 ? 'text-amber-400' : 'text-emerald-400'} icon={AlertCircle} sub="across all events" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Flagged" value={data.flagged} color="text-red-400" icon={AlertTriangle} />
        <StatCard label="In Transit" value={data.inTransit} color="text-blue-400" icon={Activity} />
        <StatCard label="Approved" value={data.approved} color="text-emerald-400" icon={CheckCircle} />
        <StatCard label="Rejected" value={data.rejected} color="text-slate-400" icon={ShieldCheck} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Event activity */}
        <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
          <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-indigo-400" /> Event Activity (Last 7 Days)
          </h3>
          <BarChart
            data={eventDays}
            maxVal={maxEvents}
            colorFn={v => v > 5 ? 'bg-indigo-500' : v > 2 ? 'bg-indigo-400' : 'bg-indigo-700'}
          />
          <p className="text-slate-600 text-[10px] mt-2 text-right">{eventDays.reduce((s, d) => s + d.value, 0)} total events this week</p>
        </div>

        {/* Category risk */}
        <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
          <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-red-400" /> Avg Risk by Category
          </h3>
          {data.categories?.length > 0 ? (
            <BarChart
              data={data.categories.map((c: any) => ({ label: c.name, value: c.avgRisk }))}
              maxVal={maxCatRisk}
              colorFn={v => v > 50 ? 'bg-red-500' : v > 25 ? 'bg-amber-500' : 'bg-emerald-500'}
            />
          ) : (
            <p className="text-slate-600 text-sm text-center py-8">No category data yet.</p>
          )}
        </div>
      </div>

      {/* Status distribution */}
      <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
        <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-5">
          <Package className="h-4 w-4 text-indigo-400" /> Product Status Distribution
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Registered', val: data.registered, color: 'bg-emerald-500', text: 'text-emerald-400' },
            { label: 'In Transit', val: data.inTransit, color: 'bg-blue-500', text: 'text-blue-400' },
            { label: 'Flagged', val: data.flagged, color: 'bg-red-500', text: 'text-red-400' },
            { label: 'Approved', val: data.approved, color: 'bg-teal-500', text: 'text-teal-400' },
            { label: 'Rejected', val: data.rejected, color: 'bg-slate-500', text: 'text-slate-400' },
          ].map(row => {
            const pct = data.total > 0 ? (row.val / data.total) * 100 : 0;
            return (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{row.label}</span>
                  <span className={`font-semibold ${row.text}`}>{row.val} <span className="text-slate-600 font-normal">({pct.toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${row.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top risk products */}
      {data.topRisk?.length > 0 && (
        <div className="bg-white/3 border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-white font-bold text-sm">Top 5 Highest Risk Products</h3>
          </div>
          <ul className="divide-y divide-white/4">
            {data.topRisk.map((p: any, i: number) => (
              <motion.li key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <button className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/2 transition-colors group" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="flex items-center gap-3 text-left">
                    <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-500 font-bold shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-white text-sm font-semibold group-hover:text-indigo-300 transition-colors">{p.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{p.id} · {p.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`text-lg font-black ${p.riskScore > 50 ? 'text-red-400' : 'text-amber-400'}`}>{p.riskScore}</p>
                      <p className="text-slate-600 text-[10px]">/ 100</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Category detail table */}
      {data.categories?.length > 0 && (
        <div className="bg-white/3 border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6">
            <h3 className="text-white font-bold text-sm">Category Risk Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/4">
                <th className="text-left px-6 py-3 text-slate-500 text-xs uppercase tracking-wider font-medium">Category</th>
                <th className="text-right px-6 py-3 text-slate-500 text-xs uppercase tracking-wider font-medium">Products</th>
                <th className="text-right px-6 py-3 text-slate-500 text-xs uppercase tracking-wider font-medium">Avg Risk</th>
                <th className="text-right px-6 py-3 text-slate-500 text-xs uppercase tracking-wider font-medium hidden sm:table-cell">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {data.categories.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-3 text-white capitalize font-medium">{c.name}</td>
                  <td className="px-6 py-3 text-slate-400 text-right">{c.count}</td>
                  <td className={`px-6 py-3 text-right font-bold ${c.avgRisk > 50 ? 'text-red-400' : c.avgRisk > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>{c.avgRisk}</td>
                  <td className="px-6 py-3 text-right hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.avgRisk > 50 ? 'bg-red-500/10 text-red-400' : c.avgRisk > 25 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {c.avgRisk > 50 ? 'High' : c.avgRisk > 25 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
