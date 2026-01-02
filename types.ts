
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
}

export interface CategoryState {
  income: string[];
  expense: string[];
  transfer: string[];
}
