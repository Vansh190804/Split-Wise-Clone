import { TransactionContext } from './TransactionContext'
import type { Transaction } from './TransactionContext'
import {useState} from 'react'

export const TransactionProvider = ({children}: {children: React.ReactNode}) => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [allUserBalances, setAllUserBalances] = useState<Record<number, number>>({})
    const [currentUserBalance, setCurrentUserBalance] = useState<number>(0)

    return (
        <TransactionContext.Provider value={{transactions, setTransactions, allUserBalances, setAllUserBalances, currentUserBalance, setCurrentUserBalance}}>
            {children}
        </TransactionContext.Provider>
    )
}