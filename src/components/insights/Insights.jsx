import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { detectSpendingInsights, computeMoneyHealthScore, predictNextMonthExpenses, formatCurrency, isCurrentMonth } from '../../utils/helpers';

export default function Insights() {
  const { state } = useApp();
  const { transactions, budgets, currency } = state;

  const insights  = useMemo(() => detectSpendingInsights(transactions, budgets, state.monthlyIncome || 0), [transactions, budgets, state.monthlyIncome]);
  const score     = useMemo(() => computeMoneyHealthScore(transactions, state.monthlyIncome || 0), [transactions, state.monthlyIncome]);
  const predicted = useMemo(() => predictNextMonthExpenses(transactions), [transactions]);

  const thisMonth = transactions.filter(t => isCurrentMonth(t.date));
  const loggedIncome = thisMonth.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
  const income    = (state.monthlyIncome || 0) + loggedIncome;
  const expense   = thisMonth.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const savings   = income - expense;
  const savingsPct = income > 0 ? Math.round((savings/income)*100) : 0;

  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 70 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Poor';

  // Spending advice
  const advice = useMemo(() => {
    const tips = [];
    if (savingsPct < 10) tips.push({ icon:'💡', text:'Try to cut discretionary spending to boost savings above 20%.' });
    if (savingsPct >= 20) tips.push({ icon:'🏆', text:'Great job! Keep maintaining your savings discipline.' });
    if (expense > income && income > 0) tips.push({ icon:'🚨', text:'You\'re spending more than you earn. Review your budget urgently.' });

    const cats = Object.entries(budgets);
    cats.forEach(([cat, limit]) => {
      const spent = thisMonth.filter(t => t.type==='expense' && t.category===cat).reduce((s,t)=>s+t.amount,0);
      if (spent > limit) tips.push({ icon:'⚠️', text:`Your ${cat} spending exceeded the budget by ${formatCurrency(spent-limit, currency)}.` });
    });

    tips.push({ icon:'📈', text:`Predicted next month's expenses: ${formatCurrency(predicted, currency)} based on your 3-month average.` });
    tips.push({ icon:'🔄', text:'Automating savings transfers on payday helps remove temptation to spend.' });
    return tips.slice(0,6);
  }, [transactions, budgets, income, expense, predicted]);

  // Habit analysis
  const topCategory = useMemo(() => {
    const cats = {};
    thisMonth.filter(t => t.type==='expense').forEach(t => {
      cats[t.category] = (cats[t.category]||0) + t.amount;
    });
    return Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
  }, [thisMonth]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header Scores */}
      <div className="grid-3">
        {[
          { icon:'💚', label:'Money Health Score', value:`${score}/100`, sub: scoreLabel, color: scoreColor },
          { icon:'💰', label:'Monthly Savings', value: formatCurrency(savings, currency), sub:`${savingsPct}% of income`, color: savings>=0?'var(--accent-green)':'var(--accent-red)' },
          { icon:'🔮', label:'Next Month Prediction', value: formatCurrency(predicted, currency), sub:'Based on 3-month avg', color:'var(--accent-primary)' },
        ].map((card,i) => (
          <div key={i} className="card animate-in" style={{ animationDelay:`${i*80}ms`, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>{card.icon}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>{card.label}</div>
            <div style={{ fontSize:28, fontFamily:'Outfit,sans-serif', fontWeight:800, color:card.color }}>{card.value}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:6 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">🧠 AI Spending Insights</div>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>Powered by behavior analysis</span>
        </div>
        {insights.length === 0 ? (
          <div className="empty-state" style={{ padding:'30px 0' }}>
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-title">All good!</div>
            <div className="empty-state-desc">No spending alerts at the moment. Keep it up!</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {insights.map((ins,i) => (
              <div key={i} className={`insight-card ${ins.type}`} style={{ animationDelay:`${i*80}ms` }}>
                <span className="insight-icon">{ins.icon}</span>
                <div>
                  <div className="insight-title">{ins.title}</div>
                  <div className="insight-message">{ins.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Tips */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">💡 Personalized Tips</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {advice.map((tip,i) => (
            <div key={i} className="animate-in" style={{ animationDelay:`${i*60}ms`, display:'flex', gap:12, padding:'12px 14px', background:'var(--bg-input)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-light)' }}>
              <span style={{ fontSize:20 }}>{tip.icon}</span>
              <span style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spending Habits */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">📊 Spending Habits</div>
        </div>
        <div className="grid-2">
          {[
            { label:'Biggest Spender', value: topCategory ? `${topCategory[0]} (${formatCurrency(topCategory[1], currency)})` : 'N/A', icon:'🔝' },
            { label:'Total Transactions', value: transactions.length, icon:'📋' },
            { label:'Avg Daily Spend', value: formatCurrency(expense / 30, currency), icon:'📅' },
            { label:'Income Coverage', value: income > 0 ? `${Math.round((expense/income)*100)}%` : '0%', icon:'📈' },
          ].map((item,i) => (
            <div key={i} style={{ padding:'16px', background:'var(--bg-input)', borderRadius:'var(--radius-md)', display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:28 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{item.label}</div>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginTop:2 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prediction Chart */}
      <div className="card" style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', border:'1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <span style={{ fontSize:48 }}>🔮</span>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Expense Forecast</div>
            <div style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6 }}>
              Based on your last 3 months of spending, we predict you'll spend approximately{' '}
              <strong style={{ color:'var(--accent-primary)' }}>{formatCurrency(predicted, currency)}</strong> next month.
              {predicted > expense
                ? ' That\'s higher than this month — consider reviewing your subscriptions and discretionary spending.'
                : ' Great trend — you\'re spending less over time!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
