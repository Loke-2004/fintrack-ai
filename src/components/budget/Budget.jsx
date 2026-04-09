import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { formatCurrency, formatBudgetAmount, isCurrentMonth, getCategoryInfo } from '../../utils/helpers';
import { CATEGORIES } from '../../data/sampleData';

export default function Budget() {
  const { state, dispatch } = useApp();
  const { transactions, budgets, currency } = state;
  const { addToast } = useToast();
  const [editingCat, setEditingCat] = useState(null);
  const [tempAmt, setTempAmt] = useState('');
  const [quickSetMode, setQuickSetMode] = useState(false);
  const [quickAmts, setQuickAmts] = useState({});
  const [quickIncome, setQuickIncome] = useState(state.monthlyIncome || '');
  const [quickBudget, setQuickBudget] = useState(state.monthlyBudget || '');

  const [editingIncome, setEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState('');
  
  const [editingMonthlyBudget, setEditingMonthlyBudget] = useState(false);
  const [tempMonthlyBudget, setTempMonthlyBudget] = useState('');

  const calculatedOther = useMemo(() => {
    let sum = 0;
    CATEGORIES.expense.filter(c => c.id !== 'other_expense').forEach(c => {
      const existing = budgets[c.id] || 0;
      const val = quickAmts[c.id] !== undefined ? quickAmts[c.id] : existing;
      const amt = val === '' ? 0 : parseFloat(val);
      if (!isNaN(amt) && amt > 0) sum += amt;
    });
    const overall = parseFloat(quickBudget) || 0;
    return Math.max(0, overall - sum);
  }, [quickAmts, quickBudget, budgets]);

  const thisMonthExpenses = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense' && isCurrentMonth(t.date)).forEach(t => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += t.amount;
    });
    return map;
  }, [transactions]);

  const hasBudgets    = Object.keys(budgets).length > 0;
  const totalBudget   = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent    = Object.values(thisMonthExpenses).reduce((s, v) => s + v, 0);
  const totalPct      = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const totalRemaining = Math.max(0, totalBudget - totalSpent);

  const handleSave = (catId) => {
    const amount = parseFloat(tempAmt || 0);
    if (isNaN(amount) || amount < 0) {
      addToast({ type: 'error', title: 'Invalid amount', message: 'Please enter a valid amount (0 or more).' });
      return;
    }

    if (catId !== 'other_expense' && state.monthlyBudget > 0) {
      let sum = 0;
      CATEGORIES.expense.forEach(c => {
        if (c.id === catId) sum += amount;
        else if (c.id !== 'other_expense') sum += (budgets[c.id] || 0);
      });

      if (sum > state.monthlyBudget) {
        addToast({ type: 'error', title: 'Budget Exceeded', message: `Cannot allocate ${formatBudgetAmount(amount, currency)}. It exceeds your overall monthly budget limit.` });
        return;
      }

      const otherAmt = Math.max(0, state.monthlyBudget - sum);
      dispatch({ type: 'SET_BUDGET', payload: { category: catId, amount } });
      dispatch({ type: 'SET_BUDGET', payload: { category: 'other_expense', amount: otherAmt } });
      addToast({ type: 'success', title: 'Budget updated!', message: `${getCategoryInfo(catId, 'expense').name} set to ${formatBudgetAmount(amount, currency)}, Other adjusted to ${formatBudgetAmount(otherAmt, currency)}` });
    } else {
      dispatch({ type: 'SET_BUDGET', payload: { category: catId, amount } });
      addToast({ type: 'success', title: 'Budget set!', message: `${getCategoryInfo(catId, 'expense').name} → ${amount === 0 ? 'No limit' : formatBudgetAmount(amount, currency)}/month` });
    }

    setEditingCat(null);
    setTempAmt('');
  };

  const handleQuickSaveAll = () => {
    let saved = 0;
    const incomeAmtFloat = parseFloat(quickIncome) || 0;
    const overallBudgetAmtFloat = parseFloat(quickBudget) || 0;

    let sum = 0;
    CATEGORIES.expense.forEach(c => {
      if (c.id !== 'other_expense') {
        const val = quickAmts[c.id] !== undefined ? quickAmts[c.id] : budgets[c.id];
        const amt = val === '' || val === undefined ? 0 : parseFloat(val);
        if (!isNaN(amt) && amt > 0) sum += amt;
      }
    });

    if (overallBudgetAmtFloat > 0 && sum > overallBudgetAmtFloat) {
      addToast({ type: 'error', title: 'Budget Exceeded', message: `Category total (${formatBudgetAmount(sum, currency)}) exceeds Overall Budget limit.` });
      return;
    }

    dispatch({ type: 'SET_MONTHLY_INCOME', payload: incomeAmtFloat });
    dispatch({ type: 'SET_MONTHLY_BUDGET', payload: overallBudgetAmtFloat });

    CATEGORIES.expense.forEach(cat => {
      let amount = 0;
      if (cat.id === 'other_expense') {
        amount = calculatedOther;
      } else {
        const val = quickAmts[cat.id] !== undefined ? quickAmts[cat.id] : budgets[cat.id];
        amount = val === '' || val === undefined ? 0 : parseFloat(val);
      }
      
      if (!isNaN(amount) && amount >= 0) {
        dispatch({ type: 'SET_BUDGET', payload: { category: cat.id, amount } });
        saved++;
      }
    });

    if (saved > 0 || incomeAmtFloat > 0 || overallBudgetAmtFloat > 0) {
      addToast({ type: 'success', title: 'Budgets saved!', message: 'Settings and monthly budgets updated successfully.' });
      setQuickSetMode(false);
      setQuickAmts({});
    } else {
      addToast({ type: 'error', title: 'No amounts entered', message: 'Enter at least one budget amount.' });
    }
  };

  const saveIncome = () => {
    dispatch({ type: 'SET_MONTHLY_INCOME', payload: parseFloat(tempIncome) || 0 });
    setEditingIncome(false);
    addToast({ type: 'success', title: 'Income Updated', message: 'Monthly income saved.' });
  };

  const saveOverallBudget = () => {
    const newOverall = parseFloat(tempMonthlyBudget) || 0;
    
    let sum = 0;
    CATEGORIES.expense.forEach(c => {
      if (c.id !== 'other_expense') sum += (budgets[c.id] || 0);
    });

    if (newOverall > 0 && newOverall < sum) {
      addToast({ type: 'error', title: 'Invalid Budget', message: `Overall budget cannot be less than your current categorized amount (${formatBudgetAmount(sum, currency)}).` });
      return;
    }

    dispatch({ type: 'SET_MONTHLY_BUDGET', payload: newOverall });
    const otherAmt = Math.max(0, newOverall - sum);
    dispatch({ type: 'SET_BUDGET', payload: { category: 'other_expense', amount: otherAmt } });
    
    setEditingMonthlyBudget(false);
    addToast({ type: 'success', title: 'Budget Updated', message: 'Overall monthly budget saved.' });
  };

  // ── Quick Setup Wizard ──────────────────────────────────────────────
  if (!hasBudgets || quickSetMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700, margin: '0 auto' }}>

        {/* Welcome banner */}
        <div className="card animate-in" style={{ background: 'var(--gradient-primary)', border: 'none', textAlign: 'center', padding: '36px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 26, fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: 'white', marginBottom: 8 }}>
            {quickSetMode ? 'Update Your Budgets' : 'Set Up Your Monthly Budgets'}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
            Define how much you want to spend in each category every month.
            You can always adjust these later.
          </div>
        </div>

        {/* 50/30/20 tip */}
        <div className="card" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Tip — The 50/30/20 Rule:</strong>{' '}
              Allocate 50% of income to needs (bills, food, transport), 30% to wants (shopping, entertainment),
              and 20% to savings. Leave categories at 0 if you don't want to track them.
            </div>
          </div>
        </div>

        {/* Overall values */}
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Set Overall Monthly Limits:
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Monthly Income</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16, fontWeight: 700 }}>{currency.symbol}</span>
                <input type="number" min="0" step="1" className="input" style={{ paddingLeft: 32 }} value={quickIncome} onChange={e => setQuickIncome(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Overall Budget</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16, fontWeight: 700 }}>{currency.symbol}</span>
                <input type="number" min="0" step="1" className="input" style={{ paddingLeft: 32 }} value={quickBudget} onChange={e => setQuickBudget(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        {/* Category inputs */}
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Enter monthly limits for each category:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CATEGORIES.expense.map(cat => {
              if (cat.id === 'other_expense') {
                return (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', flexShrink: 0, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{cat.name} <span style={{fontSize: 10, color: 'var(--text-muted)'}}>(Auto-calculated)</span></div>
                    </div>
                    <div style={{ position: 'relative', width: 160 }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 700 }}>{currency.symbol}</span>
                      <input type="number" className="input" style={{ paddingLeft: 28, width: '100%', background: 'var(--bg-card)' }} disabled value={calculatedOther} />
                    </div>
                  </div>
                );
              }

              const existing = budgets[cat.id] || '';
              const val = quickAmts[cat.id] !== undefined ? quickAmts[cat.id] : (existing || '');
              return (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{cat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{cat.name}</div>
                  </div>
                  <div style={{ position: 'relative', width: 160 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 700 }}>
                      {currency.symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="input"
                      style={{ paddingLeft: 28, width: '100%' }}
                      placeholder="0"
                      value={val}
                      onChange={e => setQuickAmts(q => ({ ...q, [cat.id]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {quickSetMode && (
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setQuickSetMode(false); setQuickAmts({}); }}>
                Cancel
              </button>
            )}
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleQuickSaveAll}>
              💾 Save All Budgets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Budget View (budgets exist) ────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Setting Inputs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Monthly Income</div>
          {editingIncome ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="number" min="0" className="input" style={{flex: 1}} value={tempIncome} onChange={e => setTempIncome(e.target.value)} />
              <button className="btn btn-success btn-sm" onClick={saveIncome}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingIncome(false)}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ fontSize: 28, fontFamily: 'Outfit,sans-serif', fontWeight: 800 }}>{formatBudgetAmount(state.monthlyIncome || 0, currency)}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setTempIncome(state.monthlyIncome || 0); setEditingIncome(true); }}>✏️ Edit</button>
            </div>
          )}
        </div>

        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Overall Expenses Budget</div>
          {editingMonthlyBudget ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="number" min="0" className="input" style={{flex: 1}} value={tempMonthlyBudget} onChange={e => setTempMonthlyBudget(e.target.value)} />
              <button className="btn btn-success btn-sm" onClick={saveOverallBudget}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingMonthlyBudget(false)}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ fontSize: 28, fontFamily: 'Outfit,sans-serif', fontWeight: 800 }}>{formatBudgetAmount(state.monthlyBudget || 0, currency)}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setTempMonthlyBudget(state.monthlyBudget || 0); setEditingMonthlyBudget(true); }}>✏️ Edit</button>
            </div>
          )}
        </div>
      </div>

      {/* Overview card */}
      <div className="card" style={{ background: 'var(--gradient-primary)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Total Budget Status
            </div>
            <div style={{ fontSize: 36, fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: 'white' }}>
              {formatBudgetAmount(totalBudget, currency)}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              {formatCurrency(totalSpent, currency)} spent · {formatBudgetAmount(totalRemaining, currency)} remaining
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ fontSize: 42, fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: 'white' }}>{totalPct}%</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>of budget used</div>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', marginTop: 4 }}
              onClick={() => setQuickSetMode(true)}
            >
              🎯 Full Setup Wizard
            </button>
          </div>
        </div>
        <div className="progress-bar" style={{ height: 8, marginTop: 20, background: 'rgba(255,255,255,0.2)' }}>
          <div className="progress-fill" style={{ width: `${totalPct}%`, background: 'white', opacity: 0.9 }} />
        </div>
      </div>

      {/* Category budgets */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">🎯 Category Budgets</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click ✏️ to edit a category (Other is auto-calculated)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {CATEGORIES.expense.map(cat => {
            const spent  = thisMonthExpenses[cat.id] || 0;
            const budget = budgets[cat.id] || 0;
            const pct    = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            const isOver = pct >= 100;
            const isWarn = pct >= 80 && !isOver;
            const barColor = isOver ? 'var(--accent-red)' : isWarn ? 'var(--accent-yellow)' : 'var(--accent-primary)';
            const noBudget = budget === 0;

            return (
              <div key={cat.id} className="animate-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {cat.name}
                        {isOver  && <span className="badge badge-expense">OVER</span>}
                        {isWarn  && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: 'var(--accent-yellow)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>NEAR LIMIT</span>}
                        {noBudget && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>No limit set</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {noBudget
                          ? `Spent: ${formatCurrency(spent, currency)}`
                          : `${formatCurrency(spent, currency)} of ${formatBudgetAmount(budget, currency)}`
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {editingCat === cat.id ? (
                      <>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>{currency.symbol}</span>
                          <input
                            type="number" min="0" className="input"
                            style={{ width: 120, padding: '6px 10px 6px 24px', fontSize: 13 }}
                            value={tempAmt}
                            onChange={e => setTempAmt(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleSave(cat.id)}
                          />
                        </div>
                        <button className="btn btn-success btn-sm" onClick={() => handleSave(cat.id)}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingCat(null)}>✕</button>
                      </>
                    ) : (
                      <>
                        {!noBudget && <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 16, fontWeight: 800, color: isOver ? 'var(--accent-red)' : 'var(--text-primary)' }}>{pct}%</span>}
                        {cat.id !== 'other_expense' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingCat(cat.id); setTempAmt(budget ? budget.toString() : ''); }}>
                            {noBudget ? '+ Set' : '✏️'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {!noBudget && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>💡 Budget Tips</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '🎯', tip: 'Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings.' },
            { icon: '📊', tip: 'Review budgets monthly and adjust based on actual spending.' },
            { icon: '🔔', tip: 'You\'ll see alerts when you hit 80% of any category limit.' },
            { icon: '💰', tip: 'If a category has no limit set, spending is tracked but not capped.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
