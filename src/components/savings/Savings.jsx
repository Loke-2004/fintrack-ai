import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, isCurrentMonth } from '../../utils/helpers';
import { generateId } from '../../utils/helpers';
import { useToast } from '../ui/Toast';

const GOAL_PRESETS = [
  { icon: '🏖️', name: 'Vacation Fund', target: 2000 },
  { icon: '🏠', name: 'Home Down Payment', target: 20000 },
  { icon: '🚗', name: 'New Car', target: 8000 },
  { icon: '💊', name: 'Emergency Fund', target: 5000 },
  { icon: '💻', name: 'Tech Upgrade', target: 1500 },
  { icon: '📚', name: 'Education', target: 3000 },
];

export default function Savings() {
  const { state, dispatch } = useApp();
  const { transactions, currency } = state;
  const { addToast } = useToast();
  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savingsGoals') || '[]'); } catch { return []; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ icon: '🎯', name: '', target: '', current: '' });
  const [addingTo, setAddingTo] = useState(null);
  const [addAmt, setAddAmt] = useState('');

  const saveGoals = (updated) => {
    setGoals(updated);
    localStorage.setItem('savingsGoals', JSON.stringify(updated));
  };

  const createGoal = () => {
    if (!form.name || !form.target) { addToast({ type:'error', title:'Missing fields' }); return; }
    const goal = { id:generateId(), icon:form.icon, name:form.name, target:parseFloat(form.target), current:parseFloat(form.current)||0, created:new Date().toISOString() };
    const updated = [...goals, goal];
    saveGoals(updated);
    addToast({ type:'success', title:'Goal created!', message:`"${goal.name}" goal of ${formatCurrency(goal.target, currency)}` });
    setShowAdd(false); setForm({ icon:'🎯', name:'', target:'', current:'' });
  };

  const addToGoal = (id) => {
    const amt = parseFloat(addAmt);
    if (isNaN(amt) || amt <= 0) return;
    const updated = goals.map(g => g.id===id ? { ...g, current: Math.min(g.target, g.current+amt) } : g);
    saveGoals(updated);
    addToast({ type:'success', title:'Added to goal!', message:`${formatCurrency(amt, currency)} added.` });
    setAddingTo(null); setAddAmt('');
  };

  const deleteGoal = (id) => {
    saveGoals(goals.filter(g => g.id !== id));
    addToast({ type:'info', title:'Goal removed' });
  };

  // Investment tracker derived from transactions
  const investments = useMemo(() => {
    return transactions.filter(t => t.category === 'investment');
  }, [transactions]);
  const totalInvested = investments.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0);

  const thisMonth = transactions.filter(t => isCurrentMonth(t.date));
  const income  = thisMonth.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = thisMonth.filter(t => t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const monthlySavings = Math.max(0, income - expense);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Stats */}
      <div className="grid-3">
        {[
          { icon:'💰', label:'Monthly Savings', value:formatCurrency(monthlySavings, currency), color:'var(--accent-green)', sub:'This month' },
          { icon:'📈', label:'Total Invested', value:formatCurrency(totalInvested, currency), color:'var(--accent-primary)', sub:'All time' },
          { icon:'🎯', label:'Active Goals', value:goals.length, color:'var(--accent-yellow)', sub:'Savings goals' },
        ].map((card,i) => (
          <div key={i} className="stat-card animate-in" style={{ '--card-gradient':'var(--gradient-primary)', animationDelay:`${i*80}ms`, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>{card.icon}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{card.label}</div>
            <div style={{ fontSize:26, fontFamily:'Outfit,sans-serif', fontWeight:800, color:card.color, margin:'6px 0' }}>{card.value}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Savings Goals */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">🎯 Savings Goals</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ New Goal</button>
        </div>

        {showAdd && (
          <div className="animate-in" style={{ background:'var(--bg-input)', borderRadius:'var(--radius-md)', padding:20, marginBottom:20 }}>
            <div style={{ marginBottom:14, fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>New Savings Goal</div>
            {/* Presets */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {GOAL_PRESETS.map(p => (
                <button key={p.name} className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, icon:p.icon, name:p.name, target:p.target.toString() }))}>
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', gap:10 }}>
                <input className="input" style={{ width:70 }} placeholder="Icon" value={form.icon} onChange={e => setForm(f=>({...f, icon:e.target.value}))} />
                <input className="input" placeholder="Goal name" value={form.name} onChange={e => setForm(f=>({...f, name:e.target.value}))} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <input className="input" type="number" placeholder="Target amount" value={form.target} onChange={e => setForm(f=>({...f, target:e.target.value}))} />
                <input className="input" type="number" placeholder="Current savings" value={form.current} onChange={e => setForm(f=>({...f, current:e.target.value}))} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:2 }} onClick={createGoal}>Create Goal</button>
              </div>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="empty-state" style={{ padding:'30px 0' }}>
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">No savings goals</div>
            <div className="empty-state-desc">Set a goal and track your progress towards it.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {goals.map(goal => {
              const pct = Math.min(100, Math.round((goal.current/goal.target)*100));
              const remaining = Math.max(0, goal.target - goal.current);
              const monthsToComplete = monthlySavings > 0 ? Math.ceil(remaining/monthlySavings) : null;
              return (
                <div key={goal.id} className="animate-in">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <span style={{ fontSize:28 }}>{goal.icon}</span>
                      <div>
                        <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{goal.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                          {formatCurrency(goal.current, currency)} of {formatCurrency(goal.target, currency)}
                          {monthsToComplete && remaining>0 && ` · ~${monthsToComplete} months to go`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18, fontWeight:800, color: pct>=100?'var(--accent-green)':'var(--text-primary)', fontFamily:'Outfit,sans-serif' }}>{pct}%</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => setAddingTo(goal.id)}>+ Add</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteGoal(goal.id)}>🗑️</button>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${pct}%`, background: pct>=100 ? 'var(--accent-green)' : 'var(--gradient-primary)' }}/>
                  </div>
                  {pct >= 100 && <div style={{ fontSize:13, color:'var(--accent-green)', fontWeight:700, marginTop:6 }}>🎉 Goal achieved!</div>}
                  {addingTo === goal.id && (
                    <div className="animate-in" style={{ display:'flex', gap:8, marginTop:10 }}>
                      <input className="input" type="number" placeholder="Amount to add" value={addAmt} onChange={e => setAddAmt(e.target.value)} style={{ flex:1 }} />
                      <button className="btn btn-success" onClick={() => addToGoal(goal.id)}>Deposit</button>
                      <button className="btn btn-ghost" onClick={() => setAddingTo(null)}>✕</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Investment Log */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">📈 Investment Tracker</div>
        </div>
        {investments.length === 0 ? (
          <div className="empty-state" style={{ padding:'20px 0' }}>
            <div className="empty-state-icon">📈</div>
            <div className="empty-state-title">No investment income recorded</div>
            <div className="empty-state-desc">Add transactions with the "Investment" income category to track here.</div>
          </div>
        ) : (
          <div>
            {investments.slice(0,8).map((tx,i) => (
              <div key={tx.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom: i<investments.length-1?'1px solid var(--border-light)':'none' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{tx.description}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</div>
                </div>
                <div style={{ fontSize:15, fontWeight:800, color: tx.type==='income'?'var(--accent-green)':'var(--accent-red)', fontFamily:'Outfit,sans-serif' }}>
                  {tx.type==='income'?'+':'-'}{formatCurrency(tx.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
