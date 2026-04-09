import { createContext, useContext, useReducer, useEffect } from 'react';
import { CURRENCIES } from '../data/sampleData';

const AppContext = createContext();

// Load state from localStorage scoped to a specific user UID
function getInitialState(uid) {
  try {
    const key = uid ? `fintrack_${uid}` : 'fintrack_guest';
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      const currency = CURRENCIES.find(c => c.code === parsed.currency?.code) || CURRENCIES[0];
      return { ...parsed, currency, activeView: 'dashboard' };
    }
  } catch (e) {}
  return {
    transactions: [],
    budgets: {},          // empty: user must set budgets manually
    monthlyIncome: 0,
    monthlyBudget: 0,
    currency: CURRENCIES[0],
    darkMode: true,
    activeView: 'dashboard',
    splitGroups: [],
    achievements: [],
  };
}

function appReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload };

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };

    case 'SET_BUDGET':
      return { ...state, budgets: { ...state.budgets, [action.payload.category]: action.payload.amount } };

    case 'SET_MONTHLY_INCOME':
      return { ...state, monthlyIncome: action.payload };

    case 'SET_MONTHLY_BUDGET':
      return { ...state, monthlyBudget: action.payload };

    case 'SET_CURRENCY':
      return { ...state, currency: action.payload };

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    case 'SET_VIEW':
      return { ...state, activeView: action.payload };

    case 'ADD_SPLIT_GROUP':
      return { ...state, splitGroups: [...state.splitGroups, action.payload] };

    case 'UNLOCK_ACHIEVEMENT':
      if (state.achievements.find(a => a.id === action.payload.id)) return state;
      return { ...state, achievements: [...state.achievements, action.payload] };

    default:
      return state;
  }
}

export function AppProvider({ children, uid }) {
  const [state, dispatch] = useReducer(appReducer, getInitialState(uid));

  useEffect(() => {
    const key = uid ? `fintrack_${uid}` : 'fintrack_guest';
    localStorage.setItem(key, JSON.stringify({
      transactions:  state.transactions,
      budgets:       state.budgets,
      monthlyIncome: state.monthlyIncome,
      monthlyBudget: state.monthlyBudget,
      currency:      state.currency,
      darkMode:      state.darkMode,
      splitGroups:   state.splitGroups,
      achievements:  state.achievements,
    }));
  }, [state, uid]);

  // Re-load when user changes (e.g. switching accounts)
  useEffect(() => {
    const loaded = getInitialState(uid);
    dispatch({ type: 'INIT', payload: loaded });
  }, [uid]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
