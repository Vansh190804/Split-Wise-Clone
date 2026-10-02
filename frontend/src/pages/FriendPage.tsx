import { useEffect, useContext, useState } from 'react'
import { FriendContext } from '../context/friends/FriendContext.tsx'
import { GroupContext } from '../context/group/groupcontext.tsx'
import { ExpenseContext } from '../context/expense/ExpenseContext.tsx'
import { TransactionContext } from '../context/transaction/TransactionContext.tsx'
import Settings from './Settings.tsx'
import ExpenseShowModal from './ExpenseShowModal.tsx'
import SettlementShowModal from './SettlementShowModal.tsx'
import api from '../api/axios.ts'
import EditExpenseModal from './EditExpenseModal.tsx'
import { createPortal } from 'react-dom'
import EditSettlementModal from './EditSettlementModal.tsx'
import { FaCheck } from "react-icons/fa";


const FriendPage = () => {

  const { selectedFriend, setSelectedFriend, showFriendExpenses, setShowFriendExpenses } = useContext(FriendContext) || { selectedFriend: null, setSelectedFriend: () => { }, showFriendExpenses: false, setShowFriendExpenses: () => { } }

  const { currentUser, setSelectedGroup, openSettings } = useContext(GroupContext) || { currentUser: null, setSelectedGroup: () => { }, openSettings: false }

  const { selectedExpense, selectedSettlement, setSelectedSettlement, refresh, setSelectedExpense, editExpenseModal, setEditExpenseModal, editSettleUpModal, setEditSettleUpModal } = useContext(ExpenseContext) ||

    { selectedExpense: null, selectedSettlement: null, setSelectedSettlement: () => { }, refresh: false, setSelectedExpense: () => { }, editExpenseModal: false, setEditExpenseModal: () => { }, editSettleUpModal: false, setEditSettleUpModal: () => { } }

  const { setTransactions, setAllUserBalances } = useContext(TransactionContext) ||
    { setTransactions: () => { }, setAllUserBalances: () => { } }

  const friendId = selectedFriend?.user_id_1 === currentUser?.id ? selectedFriend?.user_id_2 : selectedFriend?.user_id_1
  const friendName = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_name : selectedFriend?.user1_name

  const [historyFeed, setHistoryFeed] = useState<any[]>([])
  const [settledUntil, setSettledUntil] = useState<string | null>(null);


  useEffect(() => {
    const fetchHistoryFeed = async () => {
      try {
        setHistoryFeed([])
        const res = await api.get(`/expenses/friend/${friendId}`)
        const response = await api.get(`/settlements/lists/friend/${friendId}`)

        const groupExpenses = res.data.group_expenses
        const nonGroupExpenses = res.data.non_group_expenses
        const settlements = response.data

        const new_settled_until = res.data.settled_until
        setSettledUntil(new_settled_until)

        const history = [
          ...groupExpenses.map((expense: any) => ({
            ...expense,
            created_at: new Date(expense.created_at),
            type: "group"
          })),

          ...nonGroupExpenses.map((expense: any) => ({
            ...expense,
            created_at: new Date(expense.created_at),
            type: "non_group"
          })),

          ...settlements.map((settlement: any) => ({
            ...settlement,
            created_at: new Date(settlement.created_at),
            type: "settlement"
          }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        const visibleHistory = showFriendExpenses ? history :
          history.filter((item: any) => {
            if (!new_settled_until) return true

            return new Date(item.created_at) > new Date(new_settled_until)
          })

        setHistoryFeed(visibleHistory)

        console.log("History feed:", history)

        const result = await api.get(`/friends/${friendId}/balances`)
        setAllUserBalances(result.data.balances)
        setTransactions(result.data.transactions)
      } catch (err) {
        console.error("Error fetching history feed:", err)
      }
    }

    fetchHistoryFeed()
  }, [selectedFriend, refresh, showFriendExpenses])

  const currentExpenseSplits = selectedExpense?.splits ?? []

  const handleExpenseSelect = async (e: React.MouseEvent<HTMLButtonElement>, history: any) => {
    e.stopPropagation()
    if (history.type === "group") {
      console.log("Selected group expense:", history)
      setSelectedExpense(null)
      setSelectedSettlement(null)
      setSelectedFriend(null)
      setSelectedGroup({
        id: history.group_id,
        name: history.group_name,
        group_avatar: history.group_avatar,
        is_active: true,
      })
    }
    else {
      setSelectedSettlement(null)
      setSelectedExpense({
        id: history.id,
        title: history.title,
        amount: history.amount,
        group_id: null,
        paid_by: history.paid_by,
        paid_name: history.paid_name,
        split_type: history.split_type,
        splits: history.splits,
        label: history.label,
        myAmount: history.label !== "you owe nothing" ? (history.splits ? history.splits.filter((split: any) => split.user_id === currentUser?.id)[0].amount : 0) : 0,
        created_at: new Date(history.created_at)
      })
    }
  }

  const handleSettlementSelect = (e: React.MouseEvent<HTMLDivElement>, history: any) => {
    console.log("Selected settlement:", history)
    e.stopPropagation()
    setSelectedSettlement({
      id: history.id,
      from_userid: history.paid_by,
      to_userid: history.paid_to,
      from_name: history.paid_by_name,
      to_name: history.paid_to_name,
      amount: history.amount,
      created_at: new Date(history.created_at)
    })
    setSelectedExpense(null)
  }

  return (
    <div className='bg-[rgb(30,36,32)] w-full mt-5 rounded-md h-150'>
      {!openSettings ?
        <div className='flex gap-5 h-full'>
          <div className='space-y-4 hide-scrollbar overflow-y-auto pr-2 m-2 flex flex-col w-1/2'>
            {/* Add history to the game */}
            <div className='pt-2'>
              {historyFeed.length === 0 && !settledUntil ? (
                <div className='text-center'>
                  <p className="font-bold text-xl">You have no expenses with {friendName}</p>
                  <p className="text-md">To add an expense, click the <b className="text-green-400">Add Expense</b> button.</p>
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
                        {history.type === "group" ? (
                          <div className="flex items-center">
                            <button
                              key={history.id}
                              type="button"
                              onClick={(e) => handleExpenseSelect(e, history)}
                              className={`w-full mb-3 p-4 rounded-2xl text-left flex items-center justify-between gap-4 border transition-all duration-200 bg-white/5 hover:bg-white/10 cursor-pointe`}
                            >
                              <div className="min-w-0 flex-1">
                                <h3 className="text-white font-semibold text-base truncate">
                                  {history.group_name}
                                </h3>
                              </div>

                              <div
                                className={`shrink-0 text-right flex flex-col items-end ${history.label === "Owes you"
                                  ? "text-green-400"
                                  : history.label === "You owe"
                                    ? "text-red-400"
                                    : "text-white/70"
                                  }`}
                              >
                                <div className="text-xs leading-5">
                                  {history.label === "Owes you" && <p>{history.from}</p>}

                                  <p className="font-medium">
                                    {history.label}
                                  </p>

                                  {history.label === "You owe" && <p>{history.to}</p>}
                                </div>

                                <p className="mt-1 text-sm font-semibold">
                                  ₹ {history.amount}
                                </p>
                              </div>
                            </button>
                          </div>
                        ) : history.type === "non_group" ? (
                          <div className="flex items-center">
                            <button
                              key={history.id}
                              type="button"
                              onClick={(e) => handleExpenseSelect(e, history)}
                              className={`w-full mb-3 p-4 rounded-2xl text-left flex items-center justify-between gap-4 border transition-all duration-200 bg-white/5 hover:bg-white/10 cursor-pointer
                                ${selectedExpense?.id === history.id
                                  ? "border-white/80 bg-white/10"
                                  : "border-white/10 hover:border-white/30"
                                }`}
                            >
                              <div className="min-w-0 flex-1">
                                <h3 className="text-white font-semibold text-base truncate">
                                  {history.title}
                                </h3>
                              </div>

                              <div className="shrink-0 flex items-center gap-4 text-xs text-white/70">
                                <div className="flex flex-col items-end leading-5">
                                  <p>{history.paid_name} paid</p>
                                  <p className="text-sm font-semibold text-white">
                                    ₹ {history.amount}
                                  </p>
                                </div>

                                <div className="flex flex-col items-end leading-5">
                                  {history.label === "lent you" ? (
                                    <div className="text-right">
                                      <p>
                                        {friendName} {history.label}
                                      </p>
                                      <p className="text-red-400 font-semibold">
                                        {history.splits?.find(
                                          (s: any) => s.user_id == currentUser?.id
                                        )?.amount ?? 0}
                                      </p>
                                    </div>
                                  ) : history.label === "You lent" ? (
                                    <div className="text-right">
                                      <p>
                                        {history.label} {friendName}
                                      </p>
                                      <p className="text-green-400 font-semibold">
                                        {history.splits?.find(
                                          (s: any) => s.user_id == friendId
                                        )?.amount ?? 0}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-white/70">
                                      {history.label}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className={`mb-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70
                                          cursor-pointer hover:bg-white/10 hover:border-white/60
                                          ${selectedSettlement?.id === history.id
                              ? "border-white/60 bg-white/10"
                              : "border-white/10 hover:border-white/25"
                            }`}
                            onClick={(e) => handleSettlementSelect(e, history)}
                          >
                            <span className="font-medium text-white">
                              {history.paid_by === currentUser?.id
                                ? "You"
                                : history.paid_by_name}
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
                              {history.paid_to === currentUser?.id
                                ? "You"
                                : history.paid_to_name}
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  })
                )}
            </div>

            {!showFriendExpenses && settledUntil && (
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
                  onClick={() => setShowFriendExpenses(true)}
                  className="mt-4 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  Show all expenses
                </button>
              </div>
            )}
          </div>

          {/* expense details view */}
          <div
            className="bg-white/5 rounded-2xl p-5 overflow-y-auto hide-scrollbar m-3 w-1/2 border border-white/10"
            onClick={() => setSelectedExpense(null)}>
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

        </div> :

        <div>
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

export default FriendPage
