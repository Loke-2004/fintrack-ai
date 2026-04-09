import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { formatCurrency, getCategoryInfo } from '../../utils/helpers';
import { CATEGORIES } from '../../data/sampleData';
import { format } from 'date-fns';

export default function TransactionList({ onEdit }) {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const handleDelete = (tx) => {
    if (window.confirm(`Delete "${tx.description}"?`)) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: tx.id });
      addToast({ type: 'success', title: 'Deleted', message: `"${tx.description}" removed.` });
    }
  };

  const now = new Date();
  const filtered = state.transactions.filter((t) => {
    const d = new Date(t.date);
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    const matchCat = filterCategory === 'all' || t.category === filterCategory;
    let matchPeriod = true;
    if (filterPeriod === 'this_month') matchPeriod = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    else if (filterPeriod === 'last_month') matchPeriod = d.getMonth() === now.getMonth() - 1 && d.getFullYear() === now.getFullYear();
    else if (filterPeriod === 'this_week') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 7);
      matchPeriod = d >= start && d < end;
    }
    return matchSearch && matchType && matchCat && matchPeriod;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount_desc') return b.amount - a.amount;
    if (sortBy === 'amount_asc') return a.amount - b.amount;
    return 0;
  });

  const allCategories = [...CATEGORIES.expense, ...CATEGORIES.income];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 180, maxWidth: 280 }}
            placeholder="🔍  Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" style={{ width: 140 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="income">💰 Income</option>
            <option value="expense">💸 Expense</option>
          </select>
          <select className="input" style={{ width: 160 }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <select className="input" style={{ width: 150 }} value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
            <option value="all">All Time</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
          <select className="input" style={{ width: 160 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'this_week', 'this_month', 'last_month'].map((p) => (
            <button key={p} className={`filter-chip ${filterPeriod === p ? 'active' : ''}`}
              onClick={() => setFilterPeriod(p)}>
              {p === 'all' ? '📅 All Time' : p === 'this_week' ? '📆 This Week' : p === 'this_month' ? '📅 This Month' : '🗓 Last Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Bar */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Shown', value: sorted.length, icon: '📋', color: 'var(--accent-primary)' },
          { label: 'Income', value: formatCurrency(sorted.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), state.currency), icon: '💚', color: 'var(--accent-green)' },
          { label: 'Expense', value: formatCurrency(sorted.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), state.currency), icon: '🔴', color: 'var(--accent-red)' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <span>{item.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}:</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No transactions found</div>
            <div className="empty-state-desc">Try adjusting your filters or add a new transaction.</div>
          </div>
        ) : (
          <div>
            {sorted.map((tx, i) => {
              const cat = getCategoryInfo(tx.category, tx.type);
              return (
                <div key={tx.id} className="tx-item animate-in"
                  style={{ animationDelay: `${i * 30}ms`, borderBottom: i < sorted.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div className="tx-icon" style={{ background: `${cat.color}22` }}>{cat.icon}</div>
                  <div className="tx-info">
                    <div className="tx-name">{tx.description}</div>
                    <div className="tx-meta">
                      {cat.name} · {format(new Date(tx.date), 'MMM d, yyyy')}
                      {tx.notes && <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>· {tx.notes}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                      {tx.type}
                    </span>
                    <div className={`tx-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, state.currency)}
                    </div>
                    <div className="tx-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(tx)} title="Edit" style={{ fontSize: 14 }}>✏️</button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(tx)} title="Delete" style={{ fontSize: 14 }}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
