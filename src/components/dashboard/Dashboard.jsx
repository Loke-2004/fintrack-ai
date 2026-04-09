import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, computeMoneyHealthScore, predictNextMonthExpenses, isCurrentMonth, isCurrentWeek, getCategoryInfo } from '../../utils/helpers';
import { format } from 'date-fns';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { CATEGORIES } from '../../data/sampleData';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4','#FF6B6B','#4ECDC4','#FFE66D'];

export default function Dashboard({ onAddTransaction }) {
  const { state } = useApp();
  const { transactions, currency } = state;

  const thisMonth = useMemo(() => transactions.filter(t => isCurrentMonth(t.date)), [transactions]);
  const thisWeek  = useMemo(() => transactions.filter(t => isCurrentWeek(t.date)), [transactions]);

  const loggedIncome = useMemo(() => thisMonth.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0), [thisMonth]);
  const totalIncome  = state.monthlyIncome > 0 ? state.monthlyIncome : loggedIncome;
  const totalExpense = useMemo(() => thisMonth.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0), [thisMonth]);
  const balance      = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? Math.round(((totalIncome-totalExpense)/totalIncome)*100) : 0;
  const healthScore  = computeMoneyHealthScore(transactions);
  const predicted    = predictNextMonthExpenses(transactions);

  // Spend by category (pie)
  const pieData = useMemo(() => {
    const groups = {};
    thisMonth.filter(t => t.type === 'expense').forEach(t => {
      if (!groups[t.category]) groups[t.category] = 0;
      groups[t.category] += t.amount;
    });
    return Object.entries(groups).map(([cat, val]) => {
      const info = getCategoryInfo(cat, 'expense');
      return { name: info.name, value: val, icon: info.icon, color: info.color };
    }).sort((a,b) => b.value - a.value).slice(0,7);
  }, [thisMonth]);

  // Last 6 months trend
  const trendData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5-i), 1);
      const label = month.toLocaleDateString('en-US', { month: 'short' });
      const monthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });
      const income  = monthTxs.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
      return { month: label, income, expense, savings: income - expense };
    });
  }, [transactions]);

  // Recent transactions
  const recent = useMemo(() => [...transactions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,6), [transactions]);

  // Health score ring
  const radius = 50, stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (healthScore / 100) * circumference;
  const scoreColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</p>
        {payload.map((p,i) => (
          <p key={i} style={{ color: p.color, fontSize: 13 }}>{p.name}: {formatCurrency(p.value, currency)}</p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stat Cards */}
      <div className="grid-4">
        {[
          { label: 'Total Balance', value: formatCurrency(balance, currency), sub: `${savingsRate}% savings rate`, gradient: 'var(--gradient-primary)', icon: '💼', cardGradient: 'var(--gradient-primary)' },
          { label: 'Monthly Income', value: formatCurrency(totalIncome, currency), sub: state.monthlyIncome > 0 ? 'Budget setting' : 'This month (Logged)', gradient: 'var(--gradient-green)', icon: '📈', cardGradient: 'var(--gradient-green)' },
          { label: 'Monthly Expense', value: formatCurrency(totalExpense, currency), sub: 'This month', gradient: 'var(--gradient-red)', icon: '📉', cardGradient: 'var(--gradient-red)' },
          { label: 'Predicted Next', value: formatCurrency(predicted, currency), sub: 'Based on last 3 months', gradient: 'var(--gradient-gold)', icon: '🔮', cardGradient: 'var(--gradient-gold)' },
        ].map((card, i) => (
          <div key={i} className="stat-card animate-in" style={{ '--card-gradient': card.cardGradient, animationDelay: `${i*80}ms` }}>
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-value" style={{ color: i === 0 && balance < 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
              {card.value}
            </div>
            <div className="stat-card-sub">{card.sub}</div>
            <div className="stat-card-icon" style={{ background: `${card.cardGradient}33` }}>
              <span style={{ fontSize: 22 }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2-3" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Health Score + Pie */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div className="section-title">💚 Money Health</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="health-ring">
              <svg width={130} height={130} viewBox="0 0 130 130">
                <circle cx={65} cy={65} r={radius} fill="none" stroke="var(--border-light)" strokeWidth={stroke}/>
                <circle cx={65} cy={65} r={radius} fill="none" stroke={scoreColor} strokeWidth={stroke}
                  strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
              </svg>
              <div className="health-ring-text">
                <span className="health-ring-score" style={{ color: scoreColor }}>{healthScore}</span>
                <span className="health-ring-label">Score</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: scoreColor }}>
                {healthScore >= 70 ? '🏆 Excellent' : healthScore >= 50 ? '👍 Good' : healthScore >= 30 ? '⚠️ Fair' : '🚨 Poor'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {healthScore >= 70 ? 'Keeping up great savings habits' : healthScore >= 50 ? 'Some room for improvement' : 'Focus on reducing expenses'}
              </div>
            </div>
          </div>
          {/* Mini stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label:'This Week Spent', value: formatCurrency(thisWeek.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0), currency), icon:'📆' },
              { label:'This Week Earned', value: formatCurrency(thisWeek.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0), currency), icon:'💰' },
              { label:'Total Transactions', value: transactions.length, icon:'📋' },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'var(--bg-input)', borderRadius:'var(--radius-md)' }}>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{item.icon} {item.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Area Chart */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">📊 6-Month Trend</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${currency.symbol}${v>=1000?Math.round(v/1000)+'k':v}`}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#incGrad)"/>
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#expGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Spending by Category Pie */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">🍩 Spending Breakdown</div>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>This Month</span>
          </div>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">🍩</div>
              <div className="empty-state-title">No expense data</div>
            </div>
          ) : (
            <div style={{ display:'flex', gap:20, alignItems:'center' }}>
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                    dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                {pieData.map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background: item.color || COLORS[i%COLORS.length], flexShrink:0 }}/>
                      <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.icon} {item.name}</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{formatCurrency(item.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">⚡ Recent Activity</div>
            <button className="btn btn-ghost btn-sm" onClick={() => {}}>View All</button>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state" style={{ padding:'30px 0' }}>
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-title">No transactions yet</div>
              <button className="btn btn-primary" style={{ marginTop:12 }} onClick={onAddTransaction}>+ Add First Transaction</button>
            </div>
          ) : (
            <div>
              {recent.map((tx, i) => {
                const cat = getCategoryInfo(tx.category, tx.type);
                return (
                  <div key={tx.id} className="tx-item" style={{ animationDelay:`${i*50}ms`, borderBottom: i < recent.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div className="tx-icon" style={{ background:`${cat.color}22`, fontSize:18 }}>{cat.icon}</div>
                    <div className="tx-info">
                      <div className="tx-name" style={{ fontSize:13 }}>{tx.description}</div>
                      <div className="tx-meta">{format(new Date(tx.date), 'MMM d, yyyy')}</div>
                    </div>
                    <div className={`tx-amount ${tx.type}`} style={{ fontSize:14 }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
