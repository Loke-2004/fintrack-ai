import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { CURRENCIES } from '../../data/sampleData';
import { formatCurrency } from '../../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export default function Settings() {
  const { state, dispatch } = useApp();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email       = user?.email || '';
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isGoogle    = user?.providerData?.[0]?.providerId === 'google.com';

  const handleClear = () => {
    if (!window.confirm('Clear ALL transactions permanently? This cannot be undone.')) return;
    dispatch({ type: 'INIT', payload: { transactions: [], budgets: {}, splitGroups: [], achievements: [] } });
    addToast({ type: 'info', title: 'Cleared', message: 'All data removed.' });
  };

  const handleClearBudgets = () => {
    if (!window.confirm('Reset all budget limits to unset?')) return;
    dispatch({ type: 'INIT', payload: { ...state, budgets: {} } });
    addToast({ type: 'info', title: 'Budgets cleared', message: 'Go to Budget page to set new limits.' });
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Notes'];
    const rows = state.transactions.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      t.type, t.category, t.description, t.amount.toFixed(2), t.currency || 'USD', t.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fintrack_export.csv'; a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'CSV exported', message: `${state.transactions.length} transactions saved.` });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('FinTrack AI — Expense Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Account: ${email}`, 14, 32);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 40);

    const totalIncome  = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    doc.text(`Total Income:  ${formatCurrency(totalIncome, state.currency)}`, 14, 52);
    doc.text(`Total Expense: ${formatCurrency(totalExpense, state.currency)}`, 14, 60);
    doc.text(`Balance:       ${formatCurrency(totalIncome - totalExpense, state.currency)}`, 14, 68);

    const rows = state.transactions.slice(0, 200).map(t => [
      format(new Date(t.date), 'MMM d, yyyy'),
      t.type.toUpperCase(),
      t.category,
      t.description.slice(0, 35),
      `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, state.currency)}`,
    ]);

    autoTable(doc, {
      head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
      body: rows,
      startY: 78,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`fintrack_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    addToast({ type: 'success', title: 'PDF exported!', message: 'Report downloaded.' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>

      {/* Profile Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="avatar"
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, color: 'white', flexShrink: 0,
          }}>{initials}</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Outfit,sans-serif', color: 'var(--text-primary)' }}>{displayName}</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-info">{isGoogle ? '🔵 Google Account' : '📧 Email Account'}</span>
            <span className="badge badge-income">Active</span>
          </div>
        </div>
        <button className="btn btn-danger btn-sm" onClick={logout} style={{ flexShrink: 0 }}>
          ↩ Sign Out
        </button>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 20 }}>🎨 Appearance</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Dark Mode</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Toggle between dark and light theme</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={state.darkMode} onChange={() => dispatch({ type: 'TOGGLE_DARK_MODE' })} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Currency</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Display currency for amounts</div>
          </div>
          <select className="input" style={{ width: 200 }} value={state.currency.code}
            onChange={e => {
              const cur = CURRENCIES.find(c => c.code === e.target.value);
              dispatch({ type: 'SET_CURRENCY', payload: cur });
            }}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
          </select>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 20 }}>🔒 Security</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>PIN Lock</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Protect the app with a 4-digit PIN</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={pinEnabled} onChange={e => setPinEnabled(e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>
        {pinEnabled && (
          <div className="animate-in" style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input" type="password" maxLength={4} placeholder="Enter 4-digit PIN"
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} />
            <input className="input" type="password" maxLength={4} placeholder="Confirm PIN"
              value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
            <button className="btn btn-primary" onClick={() => {
              if (pin.length < 4) { addToast({ type: 'error', title: 'PIN must be 4 digits' }); return; }
              if (pin !== confirmPin) { addToast({ type: 'error', title: 'PINs do not match' }); return; }
              localStorage.setItem(`pin_${user?.uid}`, pin);
              addToast({ type: 'success', title: 'PIN set!', message: 'App is now PIN protected.' });
            }}>Set PIN</button>
          </div>
        )}
        <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Data Storage</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Data stored locally, scoped to your account</div>
          </div>
          <span className="badge badge-income">Private</span>
        </div>
      </div>

      {/* Export */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>📤 Export Data</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" style={{ flex: 1, minWidth: 160 }} onClick={exportCSV}>📊 Export CSV</button>
          <button className="btn btn-primary" style={{ flex: 1, minWidth: 160 }} onClick={exportPDF}>📄 Export PDF Report</button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          {state.transactions.length} transactions · PDF includes summary & full transaction list
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>⚙️ Data Management</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleClearBudgets}>🎯 Reset Budgets</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleClear}>🗑️ Clear All Data</button>
        </div>
        <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--accent-red)' }}>
          ⚠️ Clearing data is permanent. Your account remains active — only local transaction data is removed.
        </div>
      </div>

      {/* About */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit,sans-serif', color: 'var(--text-primary)' }}>FinTrack AI</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Version 1.0.0 · Smart Money Manager</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Made with ❤️ · Data stored locally per account for privacy</div>
      </div>
    </div>
  );
}
