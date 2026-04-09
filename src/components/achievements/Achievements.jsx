import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';

const ALL_ACHIEVEMENTS = [
  { id:'first_tx',    title:'🎯 First Transaction', description:'Logged your first transaction!',    rarity:'Common' },
  { id:'ten_tx',      title:'📝 10 Transactions',   description:'Logged 10 transactions!',           rarity:'Common' },
  { id:'saver_20',    title:'💰 Smart Saver',        description:'Saved 20% of income this month!',  rarity:'Rare' },
  { id:'saver_30',    title:'🏆 Super Saver',        description:'Saved 30%+ of income this month!', rarity:'Epic' },
  { id:'budget_keeper',title:'✅ Budget Keeper',     description:'Spent within 70% of your income!', rarity:'Rare' },
  { id:'streak_7',    title:'🔥 7-Day Streak',       description:'Tracked expenses 7 days in a row!',rarity:'Rare' },
  { id:'big_saver',   title:'💎 Big Saver',          description:'Saved over $1000 in a month!',     rarity:'Legendary' },
  { id:'multi_cat',   title:'🗂️ Categorizer',       description:'Used 5+ categories!',              rarity:'Common' },
];

const rarityColors = {
  Common: '#94a3b8',
  Rare: '#6366f1',
  Epic: '#8b5cf6',
  Legendary: '#f59e0b',
};

export default function Achievements() {
  const { state } = useApp();
  const { achievements } = state;

  const unlockedIds = achievements.map(a => a.id);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div className="card" style={{ background:'linear-gradient(135deg, #1a1a2e, #16213e)', border:'1px solid rgba(99,102,241,0.3)', textAlign:'center', padding:'32px 24px' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
        <div style={{ fontSize:28, fontFamily:'Outfit,sans-serif', fontWeight:800, color:'white', marginBottom:8 }}>Achievements</div>
        <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>
          {achievements.length} / {ALL_ACHIEVEMENTS.length} unlocked
        </div>
        <div className="progress-bar" style={{ marginTop:16, height:8, background:'rgba(255,255,255,0.15)' }}>
          <div className="progress-fill" style={{ width:`${Math.round((achievements.length/ALL_ACHIEVEMENTS.length)*100)}%`, background:'var(--gradient-primary)' }}/>
        </div>
      </div>

      {/* Recently Unlocked */}
      {achievements.length > 0 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom:16 }}>🎉 Recently Unlocked</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {achievements.slice(-3).reverse().map(a => (
              <div key={a.id} className="achievement animate-in">
                <span style={{ fontSize:28 }}>{a.title.split(' ')[0]}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{a.description}</div>
                </div>
                <div style={{ marginLeft:'auto', fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                  {format(new Date(a.date), 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Achievements Grid */}
      <div className="card">
        <div className="section-title" style={{ marginBottom:20 }}>🎖️ All Achievements</div>
        <div className="grid-2">
          {ALL_ACHIEVEMENTS.map(a => {
            const unlocked = unlockedIds.includes(a.id);
            const unlockedData = achievements.find(u => u.id === a.id);
            return (
              <div key={a.id} className="animate-in" style={{
                padding:18, borderRadius:'var(--radius-md)',
                background: unlocked ? 'rgba(99,102,241,0.08)' : 'var(--bg-input)',
                border: `1px solid ${unlocked ? rarityColors[a.rarity]+'44' : 'var(--border-light)'}`,
                opacity: unlocked ? 1 : 0.5,
                transition:'var(--transition)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <span style={{ fontSize:32, filter: unlocked ? 'none' : 'grayscale(100%)' }}>{a.title.split(' ')[0]}</span>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:99,
                    background: `${rarityColors[a.rarity]}22`, color: rarityColors[a.rarity],
                    border: `1px solid ${rarityColors[a.rarity]}44`,
                  }}>{a.rarity}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom:4 }}>
                  {a.title.split(' ').slice(1).join(' ')}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>{a.description}</div>
                {unlocked && unlockedData && (
                  <div style={{ marginTop:8, fontSize:11, color:'var(--accent-green)', fontWeight:600 }}>
                    ✓ Earned {format(new Date(unlockedData.date), 'MMM d, yyyy')}
                  </div>
                )}
                {!unlocked && (
                  <div style={{ marginTop:8, fontSize:11, color:'var(--text-muted)' }}>🔒 Locked</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gamification Tips */}
      <div className="card">
        <div className="section-title" style={{ marginBottom:16 }}>💡 How to Earn</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            '📝 Log every transaction to unlock streak achievements',
            '💰 Save 20%+ of your monthly income for saver badges',
            '🎯 Stay within budget in all categories for keeper badge',
            '🗂️ Use different categories to unlock the Categorizer badge',
          ].map((tip,i) => (
            <div key={i} style={{ fontSize:13, color:'var(--text-secondary)', padding:'10px 14px', background:'var(--bg-input)', borderRadius:'var(--radius-md)', lineHeight:1.5 }}>
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
