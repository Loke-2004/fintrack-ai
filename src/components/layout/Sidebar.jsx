import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { id: 'dashboard',     icon: '📊', label: 'Dashboard' },
  { id: 'transactions',  icon: '💳', label: 'Transactions' },
  { id: 'analytics',     icon: '📈', label: 'Analytics' },
  { id: 'budget',        icon: '🎯', label: 'Budget' },
  { id: 'insights',      icon: '🧠', label: 'AI Insights' },
  { id: 'split',         icon: '👥', label: 'Split Expenses' },
  { id: 'savings',       icon: '💰', label: 'Savings & Goals' },
  { id: 'achievements',  icon: '🏆', label: 'Achievements' },
  { id: 'settings',      icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { user, logout } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'My Account';
  const email       = user?.email || '';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💸</div>
        <div className="sidebar-logo-text">
          <h2>FinTrack AI</h2>
          <span>Smart Money Manager</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {navItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            className={`nav-item ${state.activeView === item.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="nav-section-label">Social & Goals</div>
        {navItems.slice(5, 8).map(item => (
          <button
            key={item.id}
            className={`nav-item ${state.activeView === item.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="nav-section-label">Account</div>
        <button
          className={`nav-item ${state.activeView === 'settings' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}
        >
          <span className="nav-item-icon">⚙️</span>
          Settings
        </button>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 4px' }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar"
              style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--border)' }}
            />
          ) : (
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background:'var(--gradient-primary)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:800, color:'white',
            }}>{initials}</div>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</div>
          </div>
          <button
            title="Sign out"
            onClick={logout}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted)', padding:'4px', borderRadius:'var(--radius-sm)', transition:'var(--transition)', flexShrink:0 }}
            onMouseEnter={e => e.target.style.color = 'var(--accent-red)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  );
}
