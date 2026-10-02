import { useContext,  useState } from "react";
import { ExpenseContext } from "../context/expense/ExpenseContext";
import { GroupContext } from "../context/group/groupcontext";
import { Pencil, Trash2 } from "lucide-react";
import { customAlphabet } from 'nanoid';
import { createPortal } from "react-dom";
import api from "../api/axios";

type SplitType = 'equal' | 'custom' | 'percentage'

type selectedMember = {
    id: number,
    item_id: number,
    name: string,
    is_group: boolean,
    is_active: boolean | null
    avatar_url: string | null
}

const generateNumericId = customAlphabet('1234567890', 9);
export function generate() {
  return parseInt(generateNumericId(), 10);
}


const ExpenseShowModal = ({ currentExpenseSplits }: { currentExpenseSplits: any[] }) => {

    const Excontext = useContext(ExpenseContext)
    const Gcontext = useContext(GroupContext)

    const [deleteExpenseModal, setDeleteExpenseModal] = useState<boolean>(false)

    const { selectedExpense, setSelectedExpense, setEditExpenseModal, setExpenseForm, setRefresh } = Excontext ||
        { selectedExpense: null, setSelectedExpense: () => {}, setEditExpenseModal: () => { }, setExpenseForm: () => { },
          setRefresh: () => {} }

    const { currentUser, setEditSelectMembers } = Gcontext || { currentUser: null, setEditSelectMembers: () => { } }


    //edit expense
    const handleEditExpense = async () => {
        if (selectedExpense && selectedExpense.splits) {
            setEditSelectMembers([])
            selectedExpense.splits.forEach((split) => {
                const member: selectedMember = {
                    id: generate(),
                    item_id: split.user_id,
                    name: split.user_name,
                    is_group: false,
                    is_active: null,
                    avatar_url: split.avatar_url
                }
                setEditSelectMembers((prevMembers) => [...prevMembers, member])
            })

            setExpenseForm({
                title: selectedExpense.title || "",
                amount: selectedExpense.amount.toString() || "",
                splitType: selectedExpense.split_type as SplitType,
                payerId: selectedExpense.paid_by.toString() || "",
                selected: selectedExpense.splits.reduce<Record<number, boolean>>((acc, split) => {
                    acc[split.user_id] = true
                    return acc
                }, {}),
                splitValues: selectedExpense.splits?.reduce<Record<number, string>>((acc, split) => {
                    acc[split.user_id] = split.amount.toString() || ''
                    return acc
                }, {})
            })

            setEditExpenseModal(true)
        }
    }

    //delete expense
    const handleDeleteExpense = async () => {
          try{
              await api.delete(`expenses/delete/${selectedExpense?.id}`)
              setSelectedExpense(null)
              setDeleteExpenseModal(false)
              setRefresh((prev) => !prev)
          } catch(error: any){
              console.error(error.response?.data?.detail)
              alert("Error deleting expense: " + (error.response?.data?.detail || "Unknown error"))
          }
    }

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-white">
                        {selectedExpense!.title}
                    </h2>

                    <p className="mt-2 text-sm text-white/50">
                        {selectedExpense!.paid_by === currentUser?.id
                            ? "You"
                            : selectedExpense!.paid_name}{" "}
                        <span className="text-white/30">paid</span>{" "}
                        <span className="font-medium text-white/80">
                            ₹ {selectedExpense!.amount}
                        </span>
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={handleEditExpense}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-emerald-500/3 text-emerald-400/70 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer"
                        title="Edit expense"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => setDeleteExpenseModal(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/3 text-red-400/70 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                        title="Delete expense"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>


            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-white/40 text-[11px] uppercase tracking-[0.15em] font-medium">
                    Your position
                </p>

                <div className="flex items-end justify-between mt-2">
                    <p className="text-white text-xl font-semibold">
                        {selectedExpense!.label}
                    </p>

                    <p className="text-white/70 text-sm font-medium">
                        ₹ {selectedExpense!.myAmount}
                    </p>
                </div>
            </div>


            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">
                        Split breakdown
                    </h3>

                    <span className="text-white/30 text-xs">
                        {currentExpenseSplits.length}{" "}
                        {currentExpenseSplits.length === 1 ? "person" : "people"}
                    </span>
                </div>

                {currentExpenseSplits.length === 0 ? (
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <p className="text-white/40 text-sm">
                            No split data found.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {currentExpenseSplits.map((split) => {  
                            return (
                                <div
                                    key={split.id}
                                    className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-4 py-3 transition hover:bg-white/10"
                                >
                                    <div className="min-w-0 flex items-center gap-2">
                                        <div>
                                            {
                                                split.avatar_url ?
                                                    <img src={split.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover" /> :
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold  text-emerald-400">
                                                        {split.user_name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                            }
                                        </div>
                                        <p className="text-white/90 font-medium text-sm truncate">
                                            {split.user_id === currentUser?.id
                                                ? "You"
                                                : split.user_name}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0 ml-4">
                                        <p className="text-white/70 text-sm">
                                            owes{" "}
                                            <span className="text-white font-semibold">
                                                ₹ {split.amount}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {
                deleteExpenseModal && (
                    createPortal(
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setDeleteExpenseModal(false)}>
                               <div className="flex flex-col justify-between items-center p-5 rounded-xl bg-red-400/5 border-red-400/20  gap-5">
                            <div className="text-white text-lg font-bold flex flex-col text-center">
                                <p>Are you sure you want to delete this expense?</p>
                                <p className="text-white/70 text-sm">This action cannot be undone.</p>
                            </div>
                            <div className="flex gap-4">
                                <button className="px-4 py-2 cursor-pointer rounded-xl bg-white text-black font-bold hover:bg-gray-200"
                                    onClick={() => setDeleteExpenseModal(false)}>
                                    Cancel
                                </button>
                                <button className="px-4 py-2 cursor-pointer rounded-xl bg-red-500 text-white font-bold hover:bg-red-600"
                                    onClick={handleDeleteExpense}>
                                    Delete
                                </button>
                            </div>
                        </div>
                        </div>, document.body
                    )
                )
            }
        </div>
    )
}

export default ExpenseShowModal
