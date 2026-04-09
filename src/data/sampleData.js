export const CATEGORIES = {
  expense: [
    { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#FF6B6B' },
    { id: 'transport', name: 'Transport', icon: '🚗', color: '#4ECDC4' },
    { id: 'bills', name: 'Bills & Utilities', icon: '💡', color: '#FFE66D' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#A8E6CF' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#C7CEEA' },
    { id: 'health', name: 'Health & Fitness', icon: '💊', color: '#FF8B94' },
    { id: 'travel', name: 'Travel', icon: '✈️', color: '#B5EAD7' },
    { id: 'education', name: 'Education', icon: '📚', color: '#FFDAC1' },
    { id: 'subscriptions', name: 'Subscriptions', icon: '📱', color: '#E2B4BD' },
    { id: 'other_expense', name: 'Other', icon: '💸', color: '#9EA3B0' },
  ],
  income: [
    { id: 'salary', name: 'Salary', icon: '💼', color: '#6BCB77' },
    { id: 'freelance', name: 'Freelance', icon: '💻', color: '#4D96FF' },
    { id: 'investment', name: 'Investment', icon: '📈', color: '#FFD93D' },
    { id: 'business', name: 'Business', icon: '🏢', color: '#FF924C' },
    { id: 'gift', name: 'Gift', icon: '🎁', color: '#C77DFF' },
    { id: 'other_income', name: 'Other', icon: '💰', color: '#70D6FF' },
  ],
};

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.5 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 151.5 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const now = new Date();
const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

export const generateSampleTransactions = () => [
  // Income
  { id: 't1', type: 'income', category: 'salary', amount: 5000, description: 'Monthly Salary', date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), currency: 'USD' },
  { id: 't2', type: 'income', category: 'freelance', amount: 800, description: 'Web Design Project', date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), currency: 'USD' },
  { id: 't3', type: 'income', category: 'salary', amount: 5000, description: 'Monthly Salary', date: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), currency: 'USD' },
  { id: 't4', type: 'income', category: 'investment', amount: 320, description: 'Stock Dividends', date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(), currency: 'USD' },
  { id: 't5', type: 'income', category: 'salary', amount: 5000, description: 'Monthly Salary', date: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(), currency: 'USD' },
  { id: 't6', type: 'income', category: 'freelance', amount: 1200, description: 'Mobile App Consulting', date: new Date(now.getFullYear(), now.getMonth() - 2, 20).toISOString(), currency: 'USD' },

  // Expenses - Current Month
  { id: 't7', type: 'expense', category: 'food', amount: 120, description: 'Grocery Shopping', date: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(), currency: 'USD' },
  { id: 't8', type: 'expense', category: 'food', amount: 45, description: 'Restaurant Dinner', date: new Date(now.getFullYear(), now.getMonth(), 6).toISOString(), currency: 'USD' },
  { id: 't9', type: 'expense', category: 'transport', amount: 60, description: 'Monthly Metro Pass', date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(), currency: 'USD' },
  { id: 't10', type: 'expense', category: 'bills', amount: 95, description: 'Electricity Bill', date: new Date(now.getFullYear(), now.getMonth(), 7).toISOString(), currency: 'USD' },
  { id: 't11', type: 'expense', category: 'subscriptions', amount: 15, description: 'Netflix Subscription', date: new Date(now.getFullYear(), now.getMonth(), 4).toISOString(), currency: 'USD' },
  { id: 't12', type: 'expense', category: 'subscriptions', amount: 10, description: 'Spotify Premium', date: new Date(now.getFullYear(), now.getMonth(), 4).toISOString(), currency: 'USD' },
  { id: 't13', type: 'expense', category: 'health', amount: 80, description: 'Gym Membership', date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), currency: 'USD' },
  { id: 't14', type: 'expense', category: 'shopping', amount: 200, description: 'New Shoes', date: new Date(now.getFullYear(), now.getMonth(), 8).toISOString(), currency: 'USD' },
  { id: 't15', type: 'expense', category: 'entertainment', amount: 30, description: 'Movie Tickets', date: new Date(now.getFullYear(), now.getMonth(), 9).toISOString(), currency: 'USD' },

  // Expenses - Last Month
  { id: 't16', type: 'expense', category: 'food', amount: 130, description: 'Grocery Shopping', date: new Date(now.getFullYear(), now.getMonth() - 1, 3).toISOString(), currency: 'USD' },
  { id: 't17', type: 'expense', category: 'food', amount: 75, description: 'Friends Dinner', date: new Date(now.getFullYear(), now.getMonth() - 1, 14).toISOString(), currency: 'USD' },
  { id: 't18', type: 'expense', category: 'travel', amount: 450, description: 'Weekend Trip', date: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString(), currency: 'USD' },
  { id: 't19', type: 'expense', category: 'bills', amount: 100, description: 'Internet Bill', date: new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString(), currency: 'USD' },
  { id: 't20', type: 'expense', category: 'health', amount: 80, description: 'Gym Membership', date: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), currency: 'USD' },
  { id: 't21', type: 'expense', category: 'education', amount: 200, description: 'Online Course', date: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(), currency: 'USD' },
  { id: 't22', type: 'expense', category: 'subscriptions', amount: 25, description: 'Cloud Storage', date: new Date(now.getFullYear(), now.getMonth() - 1, 4).toISOString(), currency: 'USD' },

  // Expenses - 2 Months Ago
  { id: 't23', type: 'expense', category: 'food', amount: 110, description: 'Grocery Shopping', date: new Date(now.getFullYear(), now.getMonth() - 2, 5).toISOString(), currency: 'USD' },
  { id: 't24', type: 'expense', category: 'shopping', amount: 350, description: 'Clothes Shopping', date: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(), currency: 'USD' },
  { id: 't25', type: 'expense', category: 'transport', amount: 60, description: 'Monthly Metro Pass', date: new Date(now.getFullYear(), now.getMonth() - 2, 2).toISOString(), currency: 'USD' },
  { id: 't26', type: 'expense', category: 'bills', amount: 88, description: 'Electricity Bill', date: new Date(now.getFullYear(), now.getMonth() - 2, 8).toISOString(), currency: 'USD' },
  { id: 't27', type: 'expense', category: 'entertainment', amount: 60, description: 'Concert Tickets', date: new Date(now.getFullYear(), now.getMonth() - 2, 12).toISOString(), currency: 'USD' },
  { id: 't28', type: 'expense', category: 'health', amount: 80, description: 'Gym Membership', date: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(), currency: 'USD' },
];

export const DEFAULT_BUDGETS = {
  food: 300,
  transport: 100,
  bills: 200,
  shopping: 250,
  entertainment: 100,
  health: 100,
  travel: 500,
  education: 200,
  subscriptions: 50,
  other_expense: 100,
};
