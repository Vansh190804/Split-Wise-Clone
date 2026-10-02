import React, { useState } from 'react';
import { ExpenseContext } from './ExpenseContext';
import type { ExpenseCard } from './ExpenseContext';
import type { ExpenseFormState } from './ExpenseContext';
import type { SettleMentState } from './ExpenseContext';

export const ExpenseProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseCard | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<SettleMentState | null>(null);
  const [addExpenseModal, setAddExpenseModal] = useState<boolean>(false)
  const [editExpenseModal, setEditExpenseModal] = useState<boolean>(false)
  const [settleUpModal, setSettleUpModal] = useState<boolean>(false)
  const [editSettleUpModal, setEditSettleUpModal] = useState<boolean>(false)
  const [refresh, setRefresh] = useState<boolean>(false)
  const [openExpenses, setOpenExpenses] = useState<boolean>(false)
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
       title: '',
       amount: '',
       splitType: 'equal',
       payerId: '',
       selected: {},
       splitValues: {},
     })
  

  return (
    <ExpenseContext.Provider value={{ selectedExpense, setSelectedExpense, selectedSettlement, setSelectedSettlement, expenseForm, 
    setExpenseForm, addExpenseModal, setAddExpenseModal, editExpenseModal, setEditExpenseModal, settleUpModal, setSettleUpModal,
    editSettleUpModal, setEditSettleUpModal, refresh, setRefresh , openExpenses, setOpenExpenses }}>
      {children}
    </ExpenseContext.Provider>
  );
};