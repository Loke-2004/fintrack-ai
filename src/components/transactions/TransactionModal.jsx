import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { generateId, autoCategorizeTx, checkAchievements } from '../../utils/helpers';
import { CATEGORIES } from '../../data/sampleData';

export default function TransactionModal({ transaction, onClose }) {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const isEdit = !!transaction;

  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    currency: state.currency.code,
    notes: '',
  });

  const [autoSuggest, setAutoSuggest] = useState(null);

  useEffect(() => {
    if (isEdit) {
      setForm({
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        date: transaction.date.split('T')[0],
        currency: transaction.currency || state.currency.code,
        notes: transaction.notes || '',
      });
    }
  }, [transaction]);

  const handleDescriptionChange = (val) => {
    setForm((f) => ({ ...f, description: val }));
    const suggested = autoCategorizeTx(val);
    if (suggested && !form.category) {
      setAutoSuggest(suggested);
    }
  };

  const applyAutoSuggest = () => {
    setForm((f) => ({ ...f, category: autoSuggest }));
    setAutoSuggest(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.category) {
      addToast({ type: 'error', title: 'Missing fields', message: 'Please fill all required fields.' });
      return;
    }

    const tx = {
      id: isEdit ? transaction.id : generateId(),
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category,
      date: new Date(form.date).toISOString(),
      currency: form.currency,
      notes: form.notes,
    };

    if (isEdit) {
      dispatch({ type: 'UPDATE_TRANSACTION', payload: tx });
      addToast({ type: 'success', title: 'Transaction updated', message: `"${tx.description}" has been updated.` });
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload: tx });
      addToast({ type: 'success', title: 'Transaction added', message: `"${tx.description}" (${tx.type}) recorded!` });
    }

    checkAchievements([tx, ...state.transactions], dispatch, state.monthlyIncome || 0);
    onClose();
  };

  const categories = form.type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 20 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Type toggle */}
          <div className="tabs">
            <button type="button" className={`tab ${form.type === 'expense' ? 'active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, type: 'expense', category: '' }))}
              style={form.type === 'expense' ? { background: 'var(--gradient-red)' } : {}}>
              💸 Expense
            </button>
            <button type="button" className={`tab ${form.type === 'income' ? 'active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, type: 'income', category: '' }))}
              style={form.type === 'income' ? { background: 'var(--gradient-green)' } : {}}>
              💰 Income
            </button>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16, fontWeight: 700 }}>
                {state.currency.symbol}
              </span>
              <input
                type="number"
                className="input"
                style={{ paddingLeft: 32 }}
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Grocery shopping, Netflix..."
              value={form.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              required
            />
            {autoSuggest && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🧠 Auto-suggest:</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={applyAutoSuggest}>
                  {CATEGORIES.expense.find(c => c.id === autoSuggest)?.icon} {CATEGORIES.expense.find(c => c.id === autoSuggest)?.name || autoSuggest}
                </button>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 8px',
                    borderRadius: 'var(--radius-md)', border: `2px solid ${form.category === cat.id ? cat.color : 'var(--border-light)'}`,
                    background: form.category === cat.id ? `${cat.color}22` : 'var(--bg-input)',
                    cursor: 'pointer', transition: 'var(--transition)', fontSize: 12, fontWeight: 600,
                    color: form.category === cat.id ? cat.color : 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{cat.icon}</span>
                  <span style={{ fontSize: 10, textAlign: 'center', lineHeight: 1.2 }}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="input"
              placeholder="Add a note..."
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn ${form.type === 'income' ? 'btn-success' : 'btn-primary'}`} style={{ flex: 2 }}>
              {isEdit ? '💾 Save Changes' : `+ Add ${form.type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
