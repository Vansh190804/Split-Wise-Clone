import { useContext, useState, useEffect } from "react";
import { GroupContext } from "../context/group/groupcontext";
import { ExpenseContext } from "../context/expense/ExpenseContext";
import { TransactionContext } from "../context/transaction/TransactionContext";
import type { GroupMember } from "../context/group/groupcontext";
import type { Group } from "../context/group/groupcontext";
import type { ExpenseCard } from "../context/expense/ExpenseContext";
import type { SettleMentState } from "../context/expense/ExpenseContext";
import api from "../api/axios"
import Settings from "../pages/Settings";
import EditExpenseModal from "./EditExpenseModal";
import ExpenseShowModal from "./ExpenseShowModal";
import SettlementShowModal from './SettlementShowModal';
import { createPortal } from "react-dom";
import EditSettlementModal from "./EditSettlementModal";
import { FaCheck } from "react-icons/fa";




const Groups = () => {
    const groupConext = useContext(GroupContext)
    const expenseContext = useContext(ExpenseContext)

    const { selectedGroup, groupMembers, setGroupMembers, currentUser, openSettings, setOpenSettings,
            showGroupExpenses, setShowGroupExpenses } = groupConext ||
        { selectedGroup: null, groupMembers: [], setGroupMembers: () => { }, currentUser: null, openSettings: false, setOpenSettings: () => { }, showGroupExpenses: false, setShowGroupExpenses: () => { } }

    const { selectedExpense, setSelectedExpense, editExpenseModal, setEditExpenseModal, selectedSettlement,
        setSelectedSettlement, refresh, editSettleUpModal, setEditSettleUpModal } = expenseContext ||
        {
            selectedExpense: null, setSelectedExpense: () => { }, editExpenseModal: false, setEditExpenseModal: () => { },
            selectedSettlement: null, setSelectedSettlement: () => { }, refresh: false, editSettleUpModal: false, setEditSettleUpModal: () => { }
        }

    const { setTransactions, setAllUserBalances, setCurrentUserBalance } = useContext(TransactionContext) ||
        { setTransactions: () => { }, setAllUserBalances: () => { }, setCurrentUserBalance: () => { } }

    const [historyFeed, setHistoryFeed] = useState<(any)[]>([])
    const [settledUntil, setSettledUntil] = useState<string | null>(null);

    const currentExpenseSplits = selectedExpense?.splits ?? []

    // fetch group members
    const fetchGroupMembers = async (groupId: number) => {
        try {
            const res = await api.get(`groups/${groupId}/members`)
            const members: GroupMember[] = res.data.details
            setGroupMembers(members)
        } catch (error) {
            console.error("Error fetching group members:", error)
        }
    }

    //expense selection
    const handleExpenseSelect = (e: React.MouseEvent<HTMLButtonElement>, expense: ExpenseCard | null) => {
        e.stopPropagation()
        setSelectedExpense(expense)
        setSelectedSettlement(null)
    }

    //Settlement selection
    const handleSettlementSelect = (e: React.MouseEvent<HTMLDivElement>, settlement: SettleMentState | null) => {
        e.stopPropagation()
        setSelectedSettlement(settlement)
        setSelectedExpense(null)
    }

    //fetching History
    useEffect(() => {
        const fetchHistory = async (group: Group) => {
            setOpenSettings(false)
            await fetchGroupMembers(group.id)
            const result = await api.get(`expenses/group/${group.id}`)
            const response = await api.get(`settlements/lists/group/${group.id}`)

            const expenses = result.data.expenses
            const splits = result.data.splits

            const new_settled_until = result.data.settled_until
            setSettledUntil(new_settled_until)

            const settlement_list = response.data

            const enrichedSettlement = settlement_list.map((settlement: any) => {
                return {
                    id: settlement.id,
                    from_userid: settlement.paid_by,
                    to_userid: settlement.paid_to,
                    from_name: settlement.paid_by_name,
                    to_name: settlement.paid_to_name,
                    amount: settlement.amount,
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

            const visibleHistory = showGroupExpenses ? history :
                history.filter((item: any) => {
                    if (!new_settled_until) return true

                    return new Date(item.created_at) > new Date(new_settled_until)
                })

            setHistoryFeed(visibleHistory)

            const res = await api.get(`groups/${group.id}/balances`)

            console.log("Fetched balances and transactions:", res.data)
            setCurrentUserBalance(res.data.current_user_balances)
            setAllUserBalances(res.data.balances)
            setTransactions(res.data.transactions)
        }

        fetchHistory(selectedGroup as Group)

    }, [selectedGroup, refresh, showGroupExpenses])

    return (
        <div>
            {
                !openSettings ?
                    <div className='bg-[#1E2420] w-full mt-5 rounded-md h-150'>
                        {/* A group's preview */}
                        <div className='flex gap-5 h-full'>
                            <div className='space-y-4 hide-scrollbar overflow-y-auto pr-2 m-2 flex flex-col w-1/2'>
                                <div>
                                    {groupMembers.length <= 1 &&
                                        <div className='text-white text-md font-bold pt-5'>You're the only one here. Add members to the group!</div>
                                    }
                                </div>

                                {/* Add history to the game */}
                                <div>
                                    {historyFeed.length === 0 && !settledUntil ? (
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
                                                                className={` w-full mb-3 p-4 rounded-2xl text-left border transition-all duration-200 flex items-center justify-between gap-4 bg-white/5  hover:bg-white/10 cursor-pointer
                                                            ${selectedExpense?.id === history.id
                                                                        ? "border-white/60 bg-white/10"
                                                                        : "border-white/10 hover:border-white/25"
                                                                    }`}
                                                            >
                                                                {/* Expense information */}
                                                                <div className="min-w-0 flex-1">

                                                                    <h3 className="text-base font-semibold text-white truncate">
                                                                        {history.title}
                                                                    </h3>

                                                                    <p className="mt-1.5 text-xs text-white/45">
                                                                        {history.paid_by === currentUser?.id
                                                                            ? "You"
                                                                            : history.paid_name}{" "}
                                                                        paid{" "}
                                                                        <span className="text-white/70 font-medium">
                                                                            ₹{history.amount}
                                                                        </span>
                                                                    </p>

                                                                </div>


                                                                {/* Your share */}
                                                                <div
                                                                    className={`shrink-0 text-right ${history.label === "You lent"
                                                                        ? "text-green-400"
                                                                        : history.label === "You borrowed"
                                                                            ? "text-red-400"
                                                                            : "text-white/60"
                                                                        }`}
                                                                >
                                                                    <p className="text-xs font-medium">
                                                                        {history.label}
                                                                    </p>

                                                                    <p className="mt-0.5 text-sm font-semibold">
                                                                        ₹{history.myAmount}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            /* Settlement */
                                                            <div
                                                                className={` mb-3 px-4 py-3 rounded-xl border border-white/8  bg-white/3 cursor-pointer hover:bg-white/10 hover:border-white/60
                                                            ${selectedSettlement?.id === history.id
                                                                        ? "border-white/60 bg-white/10"
                                                                        : "border-white/10 hover:border-white/25"
                                                                    }`}

                                                                onClick={(e) => handleSettlementSelect(e, history)}
                                                            >
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
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            })
                                        )}
                                </div>

                                {!showGroupExpenses && settledUntil && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        {historyFeed.length === 0 && (
                                            <div className='flex flex-col items-center justify-center'>
                                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                                                    <FaCheck className="text-2xl text-emerald-400" />
                                                </div>

                                                <p className="text-sm font-medium text-white/80">
                                                    You're all settled up
                                                </p>
                                            </div>
                                        )}

                                        <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/40">
                                            All expenses before{" "}
                                            <span className="text-white/60">
                                                {new Date(settledUntil).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>{" "}
                                            have been settled.
                                        </p>

                                        <button
                                            onClick={() => setShowGroupExpenses(true)}
                                            className="mt-4 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer"
                                        >
                                            Show all expenses
                                        </button>
                                    </div>
                                )}
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
                    </div>
                    :
                    // group Settings
                    <div className="w-full h-150 mt-5 bg-[#1E2420] rounded-3xl">
                        <Settings />
                    </div>
            }

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

export default Groups
