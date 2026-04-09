import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { formatCurrency, generateId } from '../../utils/helpers';

export default function SplitExpenses() {
  const { state, dispatch } = useApp();
  const { splitGroups, currency } = state;
  const { addToast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState(['', '']);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmt, setExpenseAmt] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const addMember = () => setMembers(m => [...m, '']);
  const updateMember = (i, val) => setMembers(m => m.map((v, idx) => idx === i ? val : v));
  const removeMember = (i) => setMembers(m => m.filter((_, idx) => idx !== i));

  const createGroup = () => {
    const validMembers = members.filter(m => m.trim());
    if (!groupName.trim() || validMembers.length < 2) {
      addToast({ type: 'error', title: 'Invalid group', message: 'Enter a group name and at least 2 members.' });
      return;
    }
    const group = { id: generateId(), name: groupName, members: validMembers, expenses: [] };
    dispatch({ type: 'ADD_SPLIT_GROUP', payload: group });
    addToast({ type: 'success', title: 'Group created!', message: `"${groupName}" is ready to track shared expenses.` });
    setGroupName(''); setMembers(['', '']); setShowCreate(false);
  };

  const addExpenseToGroup = (group) => {
    if (!expenseDesc || !expenseAmt || !paidBy) {
      addToast({ type: 'error', title: 'Missing fields', message: 'Fill all fields to add an expense.' });
      return;
    }
    const amt = parseFloat(expenseAmt);
    const perPerson = amt / group.members.length;
    const expense = { id: generateId(), description: expenseDesc, amount: amt, paidBy, perPerson, date: new Date().toISOString() };
    const updated = { ...group, expenses: [...(group.expenses || []), expense] };
    // Update group in state (re-create all groups)
    dispatch({ type: 'INIT', payload: { ...state, splitGroups: state.splitGroups.map(g => g.id === group.id ? updated : g) }});
    addToast({ type: 'success', title: 'Expense added', message: `${formatCurrency(perPerson, currency)}/person` });
    setExpenseDesc(''); setExpenseAmt(''); setPaidBy('');
    setSelectedGroup(updated);
  };

  const getBalance = (group, member) => {
    let balance = 0;
    (group.expenses || []).forEach(e => {
      if (e.paidBy === member) balance += e.amount - e.perPerson;
      else balance -= e.perPerson;
    });
    return balance;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="card" style={{ background: 'var(--gradient-primary)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 24, fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: 'white' }}>👥 Split Expenses</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Track shared costs with friends & family</div>
          </div>
          <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={() => setShowCreate(!showCreate)}>
            + Create Group
          </button>
        </div>
      </div>

      {/* Create Group Form */}
      {showCreate && (
        <div className="card animate-in">
          <div className="section-title" style={{ marginBottom: 20 }}>Create New Group</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Group Name</label>
              <input className="input" placeholder="e.g. Goa Trip, Apartment" value={groupName} onChange={e => setGroupName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Members</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input className="input" placeholder={`Member ${i + 1}`} value={m} onChange={e => updateMember(i, e.target.value)} />
                    {members.length > 2 && (
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeMember(i)}>×</button>
                    )}
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addMember}>+ Add Member</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={createGroup}>Create Group</button>
            </div>
          </div>
        </div>
      )}

      {splitGroups.length === 0 && !showCreate ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No groups yet</div>
          <div className="empty-state-desc">Create a group to start splitting expenses with friends.</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>Create First Group</button>
        </div>
      ) : (
        <div className="grid-2">
          {/* Groups List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {splitGroups.map(group => {
              const totalSpent = (group.expenses || []).reduce((s, e) => s + e.amount, 0);
              return (
                <div key={group.id} className="card animate-in" style={{ cursor: 'pointer', border: selectedGroup?.id === group.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)' }}
                  onClick={() => setSelectedGroup(group)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{group.name}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {group.members.map((m, i) => (
                          <div key={i} className="split-member" style={{ padding: '4px 10px' }}>
                            <div className="split-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>{m[0]?.toUpperCase()}</div>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit,sans-serif', color: 'var(--accent-primary)' }}>{formatCurrency(totalSpent, currency)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(group.expenses||[]).length} expenses</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Group Detail */}
          {selectedGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Add Expense */}
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Add Expense to "{selectedGroup.name}"</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input className="input" placeholder="Description" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} />
                  <input className="input" type="number" placeholder="Amount" value={expenseAmt} onChange={e => setExpenseAmt(e.target.value)} />
                  <select className="input" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                    <option value="">Who paid?</option>
                    {selectedGroup.members.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button className="btn btn-primary" onClick={() => addExpenseToGroup(selectedGroup)}>Add Expense</button>
                </div>
              </div>

              {/* Balances */}
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>💰 Balances</div>
                {selectedGroup.members.map(m => {
                  const bal = getBalance(selectedGroup, m);
                  return (
                    <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="split-avatar">{m[0]?.toUpperCase()}</div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{m}</span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: bal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {bal >= 0 ? '+' : ''}{formatCurrency(Math.abs(bal), currency)}
                        <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4, color: 'var(--text-muted)' }}>{bal >= 0 ? 'gets back' : 'owes'}</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Expense History */}
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>📋 Expense History</div>
                {(selectedGroup.expenses || []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No expenses yet</div>
                ) : (
                  (selectedGroup.expenses || []).map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{e.description}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Paid by {e.paidBy} · {formatCurrency(e.perPerson, currency)}/person</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(e.amount, currency)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
