import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ExpenseProvider } from './context/expense/ExpenseProvider.tsx'
import { GroupProvider } from './context/group/GroupProvider.tsx'
import { FriendProvider } from './context//friends/FriendProvider.tsx'
import { TransactionProvider } from './context/transaction/TransactionProvider.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TransactionProvider>
    <FriendProvider>
    <GroupProvider>
      <ExpenseProvider>
        <App />
      </ExpenseProvider>
    </GroupProvider>
    </FriendProvider>
    </TransactionProvider>
  </StrictMode>,
)



