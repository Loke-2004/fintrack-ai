import { useApp } from '../../context/AppContext';
import { CURRENCIES } from '../../data/sampleData';

const viewTitles = {
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  analytics: 'Analytics',
  budget: 'Budget Manager',
  insights: 'AI Insights',
  split: 'Split Expenses',
  savings: 'Savings & Goals',
  achievements: 'Achievements',
  settings: 'Settings',
};

export default function Header({ onAddTransaction, toggleSidebar }) {
  const { state, dispatch } = useApp();

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          className="btn btn-ghost btn-icon mobile-only" 
          onClick={toggleSidebar}
          style={{ fontSize: 20, padding: 4 }}
        >
          ☰
        </button>
        <div className="header-title">{viewTitles[state.activeView] || 'Dashboard'}</div>
      </div>
      <div className="header-actions">
        {/* Currency Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            className="input"
            style={{ width: 'auto', padding: '7px 30px 7px 10px', fontSize: 13 }}
            value={state.currency.code}
            onChange={(e) => {
              const cur = CURRENCIES.find((c) => c.code === e.target.value);
              dispatch({ type: 'SET_CURRENCY', payload: cur });
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
            ))}
          </select>
        </div>

        {/* Dark mode toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
          title={state.darkMode ? 'Light Mode' : 'Dark Mode'}
          style={{ fontSize: 18 }}
        >
          {state.darkMode ? '☀️' : '🌙'}
        </button>

        {/* Add Transaction */}
        <button className="btn btn-primary" onClick={onAddTransaction}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          Add Transaction
        </button>
      </div>
    </header>
  );
}
