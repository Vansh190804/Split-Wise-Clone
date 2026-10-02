import {createContext} from 'react'
import { useContext } from 'react'

export type Transaction = {
    amount: number,
    from_userid: number,
    to_userid: number,
    from: string,
    to: string,
}

export type TransactionContextType = {
    transactions: Transaction[],
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;

    allUserBalances: Record<number, number>,
    setAllUserBalances: React.Dispatch<React.SetStateAction<Record<number, number>>>;

    currentUserBalance: number,
    setCurrentUserBalance: React.Dispatch<React.SetStateAction<number>>;
}

export const TransactionContext = createContext<TransactionContextType | null>(null)


export const useTransaction = () => {
    const context = useContext(TransactionContext);

    if (!context) {
        throw new Error(
            "useTransaction must be used within TransactionProvider"
        );
    }

    return context;
};