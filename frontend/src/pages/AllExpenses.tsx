import { useState, useEffect, useContext } from 'react'
import api from '../api/axios'
import { GroupContext } from '../context/group/groupcontext'
import { ExpenseContext } from '../context/expense/ExpenseContext'
import type { ExpenseCard } from '../context/expense/ExpenseContext'
import type { SettleMentState } from '../context/expense/ExpenseContext'
import ExpenseShowModal from './ExpenseShowModal'
import EditExpenseModal from './EditExpenseModal'
import { createPortal } from 'react-dom'
import SettlementShowModal from './SettlementShowModal'
import EditSettlementModal from './EditSettlementModal'


const AllExpenses = () => {

    const groupConext = useContext(GroupContext)
    const expenseContext = useContext(ExpenseContext)

    const { selectedGroup, currentUser } = groupConext ||
        { selectedGroup: null, currentUser: null }

    const { selectedExpense, setSelectedExpense, selectedSettlement, setSelectedSettlement, refresh, editExpenseModal, setEditExpenseModal, editSettleUpModal, setEditSettleUpModal } = expenseContext ||
        { selectedExpense: null, setSelectedExpense: () => { }, selectedSettlement: null, setSelectedSettlement: () => { }, refresh: false, editExpenseModal: false, setEditExpenseModal: () => { }, editSettleUpModal: false, setEditSettleUpModal: () => { } }

    const [historyFeed, setHistoryFeed] = useState<(any)[]>([])

    const currentExpenseSplits = selectedExpense?.splits ?? []


    const handleExpenseSelect = (e: React.MouseEvent<HTMLButtonElement>, expense: ExpenseCard | null) => {
        e.stopPropagation()
        setSelectedSettlement(null)
        setSelectedExpense(expense)
    }

    const handleSettlementSelect = (e: React.MouseEvent<HTMLDivElement>, settlement: SettleMentState | null) => {
        e.stopPropagation()
        setSelectedExpense(null)
        setSelectedSettlement(settlement)
    }


    useEffect(() => {
        const fetchHistory = async () => {
            const result = await api.get(`expenses/allExpenses`)
            const response = await api.get(`settlements/allSettlements`)

            const expenses = result.data.expenses
            const splits = result.data.splits

            const settlement_list = response.data

            const enrichedSettlement = settlement_list.map((settlement: any) => {
                return {
                    id: settlement.id,
                    from_userid: settlement.paid_by,
                    to_userid: settlement.paid_to,
                    from_name: settlement.paid_by_name,
                    to_name: settlement.paid_to_name,
                    amount: settlement.amount,
                    group_name: settlement.group_name,
                    created_at: settlement.created_at
                }
            })


            const enrichedExpenses = expenses.map((expense: any) => {
                const relatedSplits = splits.filter(
                    (split: any) => split.expense_id === expense.id
                )

                let label = "You are not involved"
                let myAmount = 0

                if (expense.paid_by === currentUser?.id) {
                    label = "You lent"
                    myAmount = relatedSplits.filter((split: any) => split.user_id !== currentUser?.id).reduce((sum: number, split: any) => sum + split.amount, 0)
                }
                else {
                    const mySplit = relatedSplits.find((split: any) => split.user_id == currentUser?.id)
                    if (mySplit) {
                        label = "You borrowed"
                        myAmount = mySplit.amount
                    }
                }

                return {
                    ...expense,
                    label,
                    myAmount,
                    splits: relatedSplits,
                }
            })

            const history = [
                ...enrichedExpenses.map((expense: ExpenseCard) => ({
                    ...expense,
                    created_at: new Date(expense.created_at),
                    type: "expense"
                })),

                ...enrichedSettlement.map((settlement: SettleMentState) => ({
                    ...settlement,
                    created_at: new Date(settlement.created_at),
                    type: "settlement"
                })),
            ].sort(
                (a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                }
            )

            setHistoryFeed(history)
        }

        fetchHistory()

    }, [selectedGroup, refresh])


    return (
        <div className='bg-[#1E2420] w-full mt-5 rounded-md h-150'>
            <div className='flex gap-5 h-full'>
                <div className='space-y-4 hide-scrollbar overflow-y-auto pr-2 m-2 flex flex-col w-1/2'>
                    {/* Add history to the game */}
                    <div>
                        {historyFeed.length === 0 ? (
                            <div className='text-center'>
                                <p className="font-bold text-xl">You have not added any expenses yet.</p>
                                <p className="text-md">To add an Expense, click the <b className="text-green-400">Add Expense</b> button.</p>
                            </div>
                        ) :
                            (
                                historyFeed.map((history: any) => {
                                    const date = new Date(history.created_at);
                                    return <div key={history.id} className='flex gap-3 items-center mb-3'>
                                        <div className="text-center font-bold">
                                            {
                                                date.toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })
                                            }
                                        </div>


                                        <div className="w-full">
                                            {history.type === "expense" ? (
                                                <button
                                                    key={history.id}
                                                    type="button"
                                                    onClick={(e) => handleExpenseSelect(e, history)}
                                                    className={`w-full mb-3 p-4 rounded-2xl text-left border transition-all duration-200 bg-white/5 hover:bg-white/10 cursor-pointer
                                                     ${selectedExpense?.id === history.id
                                                            ? "border-white/60 bg-white/10"
                                                            : "border-white/10 hover:border-white/25"
                                                        }
                                                   `}
                                                >
                                                    <div className="flex items-center justify-between gap-4">

                                                        {/* Left: Expense information */}
                                                        <div className="min-w-0 flex-1">

                                                            <h3 className="text-base font-semibold text-white truncate">
                                                                {history.title}
                                                            </h3>

                                                            {history.group_name && (
                                                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/50">
                                                                    {history.group_name}
                                                                </span>
                                                            )}

                                                            <p className="mt-2 text-xs text-white/45">
                                                                {history.paid_by === currentUser?.id
                                                                    ? "You"
                                                                    : history.paid_name}{" "}
                                                                paid{" "}
                                                                <span className="text-white/70 font-medium">
                                                                    ₹{history.amount}
                                                                </span>
                                                            </p>
                                                        </div>


                                                        {/* Right: Your share */}
                                                        <div className="shrink-0 text-right">
                                                            <p className={` text-xs font-medium  ${history.label === "You lent"
                                                                ? "text-green-400"
                                                                : history.label === "You borrowed"
                                                                    ? "text-red-400"
                                                                    : "text-white/50"
                                                                }`}
                                                            >
                                                                {history.label}
                                                            </p>
                                                            <p className={` mt-0.5 text-base font-semibold ${history.label === "You lent"
                                                                ? "text-green-400"
                                                                : history.label === "You borrowed"
                                                                    ? "text-red-400"
                                                                    : "text-white"
                                                                }`}
                                                            >
                                                                ₹{history.myAmount}
                                                            </p>

                                                        </div>

                                                    </div>
                                                </button>
                                            ) : (
                                                /* Settlement */
                                                <div className={`mb-3 px-4 py-3  rounded-xl  border border-white/8 bg-white/3
                                                         hover:bg-white/10 hover:border-white/60 cursor-pointer
                                                  ${selectedSettlement?.id === history.id
                                                        ? "border-white/60 bg-white/10"
                                                        : "border-white/10 hover:border-white/25"
                                                    }
                                                   `}
                                                    onClick={(e) => handleSettlementSelect(e, history)}
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="text-sm text-white/70">
                                                            <span className="font-medium text-white">
                                                                {history.from_userid === currentUser?.id
                                                                    ? "You"
                                                                    : history.from_name}
                                                            </span>

                                                            <span className="mx-1.5 text-white/30">
                                                                paid
                                                            </span>

                                                            <span className="font-semibold text-white">
                                                                ₹{history.amount}
                                                            </span>

                                                            <span className="mx-1.5 text-white/30">
                                                                to
                                                            </span>

                                                            <span className="font-medium text-white">
                                                                {history.to_userid === currentUser?.id
                                                                    ? "You"
                                                                    : history.to_name}
                                                            </span>
                                                        </p>
                                                        {history.group_name && (
                                                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/50">
                                                                {history.group_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                })
                            )}
                    </div>
                </div>

                {/* expense details view */}
                <div
                    className="bg-white/5 rounded-2xl p-5 overflow-y-auto hide-scrollbar m-3 w-1/2 border border-white/10"
                    onClick={() => setSelectedExpense(null)}
                >
                    {selectedExpense ? (
                        <div onClick={(e) => e.stopPropagation()}>
                            <ExpenseShowModal currentExpenseSplits={currentExpenseSplits} />
                        </div>
                    ) :
                        selectedSettlement ? (
                            <div onClick={(e) => e.stopPropagation()}>
                                <SettlementShowModal />
                            </div>
                        ) :
                            (
                                <div className="h-full flex items-center justify-center text-center">
                                    <div className="space-y-2">
                                        <h2 className="text-white/80 text-xl font-semibold">
                                            Expense Details
                                        </h2>

                                        <p className="text-white/35 text-sm">
                                            Select an expense to view its details
                                        </p>
                                    </div>
                                </div>
                            )}
                </div>
            </div>

            {
                editExpenseModal && selectedExpense && createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setEditExpenseModal(false)}>
                        <div onClick={(e) => e.stopPropagation()}>
                            <EditExpenseModal />
                        </div>
                    </div>, document.body
                )
            }

            {
                editSettleUpModal && selectedSettlement && createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setEditSettleUpModal(false)}>
                        <div onClick={(e) => e.stopPropagation()}>
                            <EditSettlementModal />
                        </div>
                    </div>, document.body
                )
            }
        </div>
    )
}

export default AllExpenses
