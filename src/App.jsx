import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import TransactionList from './components/transactions/TransactionList';
import TransactionModal from './components/transactions/TransactionModal';
import Analytics from './components/analytics/Analytics';
import Budget from './components/budget/Budget';
import Insights from './components/insights/Insights';
import SplitExpenses from './components/split/SplitExpenses';
import Savings from './components/savings/Savings';
import Achievements from './components/achievements/Achievements';
import Settings from './components/settings/Settings';

/* ── Inner app (requires auth + app context) ─────────────────────────── */
function AppInner() {
  const { state } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
  }, [state.darkMode]);

  const openAdd  = ()   => { setEditingTx(null); setShowModal(true); };
  const openEdit = (tx) => { setEditingTx(tx);   setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingTx(null); };

  const views = {
    dashboard:    <Dashboard onAddTransaction={openAdd} />,
    transactions: <TransactionList onEdit={openEdit} />,
    analytics:    <Analytics />,
    budget:       <Budget />,
    insights:     <Insights />,
    split:        <SplitExpenses />,
    savings:      <Savings />,
    achievements: <Achievements />,
    settings:     <Settings />,
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onAddTransaction={openAdd} />
        <main className="page-content">
          {views[state.activeView] || views.dashboard}
        </main>
      </div>
      {showModal && <TransactionModal transaction={editingTx} onClose={closeModal} />}
    </div>
  );
}

/* ── Auth gate: shows login or the app ───────────────────────────────── */
function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 56, height: 56, background: 'var(--gradient-primary)',
          borderRadius: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 28,
          boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>💸</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Loading FinTrack AI…</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  // Pass UID to AppProvider so data is scoped per user
  return (
    <AppProvider uid={user.uid}>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AppProvider>
  );
}

/* ── Root ────────────────────────────────────────────────────────────── */
export default function App() {
  // Set initial theme before auth resolves
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
