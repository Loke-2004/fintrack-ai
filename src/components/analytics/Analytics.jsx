import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, getCategoryInfo, isCurrentMonth } from '../../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts';
import { CATEGORIES } from '../../data/sampleData';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4','#FF6B6B','#4ECDC4','#FFE66D'];

export default function Analytics() {
  const { state } = useApp();
  const { transactions, currency } = state;
  const [period, setPeriod] = useState('monthly');

  // Monthly income vs expense bar chart
  const barData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5-i), 1);
      const label = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const txs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });
      return {
        month: label,
        Income: txs.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0),
        Expense: txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0),
      };
    });
  }, [transactions]);

  // Weekly data
  const weeklyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - i));
      const label = day.toLocaleDateString('en-US', { weekday: 'short' });
      const txs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.toDateString() === day.toDateString();
      });
      return {
        day: label,
        Income: txs.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0),
        Expense: txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0),
      };
    });
  }, [transactions]);

  const chartData = period === 'monthly' ? barData : weeklyData;
  const xKey = period === 'monthly' ? 'month' : 'day';

  // Category pie
  const pieDataExpense = useMemo(() => {
    const groups = {};
    transactions.filter(t => t.type === 'expense' && isCurrentMonth(t.date)).forEach(t => {
      if (!groups[t.category]) groups[t.category] = 0;
      groups[t.category] += t.amount;
    });
    return Object.entries(groups).map(([cat, val]) => {
      const info = getCategoryInfo(cat, 'expense');
      return { name: info.name, value: val, icon: info.icon, color: info.color };
    }).sort((a,b) => b.value-a.value);
  }, [transactions]);

  const pieDataIncome = useMemo(() => {
    const groups = {};
    transactions.filter(t => t.type === 'income' && isCurrentMonth(t.date)).forEach(t => {
      if (!groups[t.category]) groups[t.category] = 0;
      groups[t.category] += t.amount;
    });
    return Object.entries(groups).map(([cat, val]) => {
      const info = getCategoryInfo(cat, 'income');
      return { name: info.name, value: val, icon: info.icon, color: info.color };
    }).sort((a,b) => b.value-a.value);
  }, [transactions]);

  // Savings Line
  const savingsLine = useMemo(() => barData.map(d => ({
    month: d.month,
    Savings: Math.max(0, d.Income - d.Expense),
  })), [barData]);

  // Category breakdown table
  const catBreakdown = useMemo(() => {
    const now = new Date();
    return CATEGORIES.expense.map(cat => {
      const thisM = transactions.filter(t => t.type==='expense' && t.category===cat.id && isCurrentMonth(t.date)).reduce((s,t)=>s+t.amount,0);
      const lastM = transactions.filter(t => {
        const d = new Date(t.date);
        return t.type==='expense' && t.category===cat.id && d.getMonth()===now.getMonth()-1 && d.getFullYear()===now.getFullYear();
      }).reduce((s,t)=>s+t.amount,0);
      const change = lastM > 0 ? Math.round(((thisM-lastM)/lastM)*100) : (thisM > 0 ? 100 : 0);
      return { ...cat, thisMonth: thisM, lastMonth: lastM, change };
    }).filter(c => c.thisMonth > 0 || c.lastMonth > 0).sort((a,b) => b.thisMonth - a.thisMonth);
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'10px 14px' }}>
        <p style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{label}</p>
        {payload.map((p,i) => (
          <p key={i} style={{ color:p.color, fontSize:13 }}>{p.name}: {formatCurrency(p.value, currency)}</p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Period Tabs */}
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div className="tabs" style={{ width:'auto' }}>
          {['monthly','weekly'].map(p => (
            <button key={p} className={`tab ${period===p?'active':''}`} onClick={() => setPeriod(p)}>
              {p==='monthly' ? '📅 Monthly' : '📆 Weekly'}
            </button>
          ))}
        </div>
      </div>

      {/* Income vs Expense Bar */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">📊 Income vs Expense — {period === 'monthly' ? 'Last 6 Months' : 'Last 7 Days'}</div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top:5, right:20, left:0, bottom:5 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false}/>
            <XAxis dataKey={xKey} tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${currency.symbol}${v>=1000?Math.round(v/1000)+'k':v}`}/>
            <Tooltip content={<CustomTooltip />}/>
            <Legend wrapperStyle={{ fontSize:13, color:'var(--text-secondary)' }}/>
            <Bar dataKey="Income" fill="#10b981" radius={[6,6,0,0]}/>
            <Bar dataKey="Expense" fill="#ef4444" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Trend */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">💰 Savings Trend</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={savingsLine} margin={{ top:5, right:20, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false}/>
            <XAxis dataKey="month" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${currency.symbol}${v>=1000?Math.round(v/1000)+'k':v}`}/>
            <Tooltip content={<CustomTooltip />}/>
            <Line type="monotone" dataKey="Savings" stroke="#6366f1" strokeWidth={3} dot={{ fill:'#6366f1', r:5 }} activeDot={{ r:7 }}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts */}
      <div className="grid-2">
        {[
          { title:'💸 Expense Breakdown', data: pieDataExpense },
          { title:'💰 Income Sources', data: pieDataIncome },
        ].map(({ title, data }) => (
          <div key={title} className="card">
            <div className="section-header"><div className="section-title">{title}</div></div>
            {data.length === 0 ? (
              <div className="empty-state" style={{ padding:'30px 0' }}>
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">No data this month</div>
              </div>
            ) : (
              <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="none">
                      {data.map((e,i) => <Cell key={i} fill={e.color || COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v => formatCurrency(v, currency)}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                  {data.slice(0,5).map((d,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background: d.color || COLORS[i%COLORS.length] }}/>
                        <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{d.icon} {d.name}</span>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)' }}>{formatCurrency(d.value, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Category Table */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">📋 Category Breakdown</div>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>vs last month</span>
        </div>
        {catBreakdown.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No data yet</div></div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border-light)' }}>
                  {['Category','This Month','Last Month','Change'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign: h==='Category'?'left':'right', fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catBreakdown.map((cat, i) => (
                  <tr key={cat.id} style={{ borderBottom: i<catBreakdown.length-1?'1px solid var(--border-light)':'none', transition:'background 0.2s' }}>
                    <td style={{ padding:'12px', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:20 }}>{cat.icon}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{cat.name}</span>
                    </td>
                    <td style={{ padding:'12px', textAlign:'right', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{formatCurrency(cat.thisMonth, currency)}</td>
                    <td style={{ padding:'12px', textAlign:'right', fontSize:13, color:'var(--text-secondary)' }}>{formatCurrency(cat.lastMonth, currency)}</td>
                    <td style={{ padding:'12px', textAlign:'right', fontSize:13, fontWeight:700, color: cat.change > 0 ? 'var(--accent-red)' : cat.change < 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {cat.change > 0 ? '↑' : cat.change < 0 ? '↓' : '—'} {Math.abs(cat.change)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
