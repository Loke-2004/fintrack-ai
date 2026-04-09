import { CATEGORIES, CURRENCIES } from '../data/sampleData';

export function formatCurrency(amount, currency) {
  const curr = currency || CURRENCIES[0];
  return `${curr.symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// For budget amounts — no rate conversion, they're already in the display currency
export function formatBudgetAmount(amount, currency) {
  const curr = currency || CURRENCIES[0];
  return `${curr.symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCategoryInfo(categoryId, type) {
  const list = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  return list.find((c) => c.id === categoryId) || { name: 'Unknown', icon: '❓', color: '#888' };
}

export function getMonthName(date) {
  return new Date(date).toLocaleString('default', { month: 'long' });
}

export function getWeekNumber(date) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
}

export function groupByMonth(transactions) {
  const groups = {};
  transactions.forEach((t) => {
    const key = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return groups;
}

export function groupByCategory(transactions, type) {
  const groups = {};
  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      if (!groups[t.category]) groups[t.category] = 0;
      groups[t.category] += t.amount;
    });
  return groups;
}

export function getDaysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

export function generateId() {
  return `t${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isCurrentMonth(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function isCurrentWeek(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return date >= startOfWeek && date < endOfWeek;
}

export function computeMoneyHealthScore(transactions, monthlyIncomeObj = 0) {
  const now = new Date();
  const currentMonthTxs = transactions.filter((t) => isCurrentMonth(t.date));
  const loggedIncome = currentMonthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthlyIncomeObj + loggedIncome;
  const totalExpense = currentMonthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  if (totalIncome === 0) return 50;

  const savingsRate = (totalIncome - totalExpense) / totalIncome;
  let score = Math.min(100, Math.max(0, Math.round(savingsRate * 100)));

  // Bonus for categorized spending
  const hasCategories = currentMonthTxs.some((t) => t.category);
  if (hasCategories) score = Math.min(100, score + 5);

  return score;
}

export function predictNextMonthExpenses(transactions) {
  const now = new Date();
  const last3Months = [0, 1, 2].map((i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
  });

  const avg = last3Months.reduce((s, v) => s + v, 0) / (last3Months.filter((v) => v > 0).length || 1);
  return Math.round(avg);
}

export function detectSpendingInsights(transactions, budgets, monthlyIncomeObj = 0) {
  const insights = [];
  const now = new Date();
  const currentMonthTxs = transactions.filter((t) => isCurrentMonth(t.date));
  const lastMonthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() - 1 && d.getFullYear() === now.getFullYear();
  });

  // Category overspending
  const categorySpend = groupByCategory(currentMonthTxs, 'expense');
  Object.entries(categorySpend).forEach(([cat, amount]) => {
    const budget = budgets[cat];
    if (budget && amount > budget * 0.8) {
      const pct = Math.round((amount / budget) * 100);
      insights.push({
        type: pct >= 100 ? 'danger' : 'warning',
        icon: pct >= 100 ? '🚨' : '⚠️',
        title: pct >= 100 ? `Budget exceeded in ${cat}` : `Nearing budget in ${cat}`,
        message: `You've spent ${pct}% of your ${cat} budget this month.`,
      });
    }
  });

  // Month-over-month comparison
  const currentExpense = currentMonthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const lastExpense = lastMonthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  if (lastExpense > 0) {
    const change = ((currentExpense - lastExpense) / lastExpense) * 100;
    if (change > 20) {
      insights.push({
        type: 'warning',
        icon: '📈',
        title: 'Spending increased',
        message: `Your spending is up ${Math.round(change)}% compared to last month.`,
      });
    } else if (change < -10) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Great savings!',
        message: `You're spending ${Math.abs(Math.round(change))}% less than last month. Keep it up!`,
      });
    }
  }

  // Subscription detection
  const subscriptions = currentMonthTxs.filter((t) => t.category === 'subscriptions');
  if (subscriptions.length > 3) {
    insights.push({
      type: 'info',
      icon: '📱',
      title: 'Multiple subscriptions',
      message: `You have ${subscriptions.length} active subscriptions. Review if all are needed.`,
    });
  }

  // Savings check
  const loggedIncome = currentMonthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthlyIncomeObj + loggedIncome;
  const savingsRate = totalIncome > 0 ? (totalIncome - currentExpense) / totalIncome : 0;
  if (savingsRate < 0.1 && totalIncome > 0) {
    insights.push({
      type: 'danger',
      icon: '💸',
      title: 'Low savings rate',
      message: `You're saving only ${Math.round(savingsRate * 100)}% of income. Aim for at least 20%.`,
    });
  } else if (savingsRate >= 0.3) {
    insights.push({
      type: 'success',
      icon: '🏆',
      title: 'Excellent savings!',
      message: `You're saving ${Math.round(savingsRate * 100)}% of income — that's outstanding!`,
    });
  }

  return insights.slice(0, 5);
}

export function autoCategorizeTx(description) {
  const desc = description.toLowerCase();
  const rules = [
    { keywords: ['grocery', 'food', 'restaurant', 'pizza', 'burger', 'cafe', 'coffee', 'swiggy', 'zomato', 'uber eats'], category: 'food' },
    { keywords: ['uber', 'ola', 'taxi', 'metro', 'bus', 'train', 'fuel', 'petrol', 'transport'], category: 'transport' },
    { keywords: ['netflix', 'spotify', 'prime', 'youtube', 'hbo', 'disney', 'subscription', 'apple music'], category: 'subscriptions' },
    { keywords: ['electricity', 'internet', 'water', 'gas', 'bill', 'utility', 'broadband'], category: 'bills' },
    { keywords: ['amazon', 'flipkart', 'shopping', 'clothes', 'shoes', 'fashion'], category: 'shopping' },
    { keywords: ['gym', 'doctor', 'hospital', 'medicine', 'pharmacy', 'health', 'fitness'], category: 'health' },
    { keywords: ['flight', 'hotel', 'travel', 'trip', 'vacation', 'holiday', 'airbnb'], category: 'travel' },
    { keywords: ['course', 'udemy', 'book', 'education', 'school', 'tuition', 'college'], category: 'education' },
    { keywords: ['salary', 'payroll', 'wages'], category: 'salary' },
    { keywords: ['freelance', 'contract', 'project payment', 'client'], category: 'freelance' },
    { keywords: ['dividend', 'stock', 'mutual fund', 'investment returns', 'interest'], category: 'investment' },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => desc.includes(kw))) {
      return rule.category;
    }
  }
  return null;
}

export function checkAchievements(transactions, dispatch, monthlyIncomeObj = 0) {
  const currentMonthTxs = transactions.filter((t) => isCurrentMonth(t.date));
  const loggedIncome = currentMonthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthlyIncomeObj + loggedIncome;
  const expense = currentMonthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const achievementList = [
    { id: 'first_tx', condition: transactions.length >= 1, title: '🎯 First Transaction', description: 'Logged your first transaction!' },
    { id: 'ten_tx', condition: transactions.length >= 10, title: '📝 10 Transactions', description: 'Logged 10 transactions!' },
    { id: 'saver_20', condition: totalIncome > 0 && (totalIncome - expense) / totalIncome >= 0.2, title: '💰 20% Saver', description: 'Saved 20% of income this month!' },
    { id: 'saver_30', condition: totalIncome > 0 && (totalIncome - expense) / totalIncome >= 0.3, title: '🏆 Super Saver', description: 'Saved 30%+ of income this month!' },
    { id: 'budget_keeper', condition: expense < totalIncome * 0.7, title: '✅ Budget Keeper', description: 'Spent within 70% of your income!' },
  ];

  achievementList.forEach((a) => {
    if (a.condition) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: { id: a.id, title: a.title, description: a.description, date: new Date().toISOString() } });
    }
  });
}
