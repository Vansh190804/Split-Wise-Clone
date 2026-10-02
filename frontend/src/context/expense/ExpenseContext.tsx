import { createContext } from 'react';

export type ExpenseSplit = {
  id: number
  expense_id: number
  user_id: number
  user_name: string
  avatar_url: string | null
  amount: number
};

export type ExpenseCard = {
  id: number
  title: string
  amount: number
  group_id: number | null
  paid_by: number
  paid_name: string
  split_type: string
  label: string
  myAmount: number
  created_at: Date
  splits?: ExpenseSplit[]
};

type SplitType = 'equal' | 'custom' | 'percentage'

export type ExpenseFormState = {
  title: string
  amount: string
  splitType: SplitType
  payerId: string
  selected: Record<number, boolean>
  splitValues: Record<number, string>
}

export type SettleMentState = {
    id: number
    from_userid: number
    to_userid: number
    from_name: string
    to_name: string
    amount: number
    created_at: Date
}


export type ExpenseContextType = {
  selectedExpense: ExpenseCard | null;
  setSelectedExpense: React.Dispatch<React.SetStateAction<ExpenseCard | null>>;

  selectedSettlement: SettleMentState | null;
  setSelectedSettlement: React.Dispatch<React.SetStateAction<SettleMentState | null>>;

  expenseForm: ExpenseFormState;
  setExpenseForm: React.Dispatch<React.SetStateAction<ExpenseFormState>>;

  addExpenseModal: boolean
  setAddExpenseModal: React.Dispatch<React.SetStateAction<boolean>>;

  editExpenseModal: boolean
  setEditExpenseModal: React.Dispatch<React.SetStateAction<boolean>>;

  settleUpModal: boolean
  setSettleUpModal: React.Dispatch<React.SetStateAction<boolean>>;

  editSettleUpModal: boolean
  setEditSettleUpModal: React.Dispatch<React.SetStateAction<boolean>>;

  openExpenses: boolean
  setOpenExpenses: React.Dispatch<React.SetStateAction<boolean>>;

  refresh: boolean
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};


export const ExpenseContext =
  createContext<ExpenseContextType | null>(null);