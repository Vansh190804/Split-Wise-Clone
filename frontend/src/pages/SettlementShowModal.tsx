import { useContext, useState } from "react";
import { ExpenseContext } from "../context/expense/ExpenseContext";
import { GroupContext } from "../context/group/groupcontext";
import { Pencil, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import api from "../api/axios";

const SettlementShowModal = () => {
    const { selectedSettlement, setSelectedSettlement, setEditSettleUpModal, setRefresh } = useContext(ExpenseContext) ||
        { selectedSettlement: null, setSelectedSettlement: () => {}, currentUserId: undefined,
          setEditSettleUpModal: () => { }, setRefresh: () => { } };

    const { currentUser, setEditSettlement } = useContext(GroupContext) ||
        { currentUser: null, setEditSettlement: () => { } };

    const [deleteSettlementModal, setDeleteSettlementModal] = useState(false);

    const currentUserId = currentUser?.id;
    const isCurrentUserPayer =
        selectedSettlement?.from_userid === currentUserId;

    const payerName = isCurrentUserPayer
        ? "You"
        : selectedSettlement?.from_name;

    const receiverName = selectedSettlement?.to_userid === currentUserId
        ? "You"
        : selectedSettlement?.to_name;

    const handleEditSettlement = () => {
        setEditSettlement({
            paid_by: selectedSettlement?.from_userid || null,
            paid_to: selectedSettlement?.to_userid || null,
            amount: selectedSettlement?.amount || 0,
        })

        setEditSettleUpModal(true);
    }

    const handleDeleteSettlement = async () => {
        try {
            await api.delete(`settlements/delete/${selectedSettlement?.id}`)
            setSelectedSettlement(null)
            setDeleteSettlementModal(false)
            setRefresh((prev) => !prev)
        } catch (error: any) {
            console.error(error.response?.data?.detail)
            alert("Error deleting expense: " + (error.response?.data?.detail || "Unknown error"))
        }
    }

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-white">
                        Settlement
                    </h2>

                    <p className="mt-2 text-sm text-white/50">
                        Payment recorded between{" "}
                        <span className="text-white/80 font-medium">
                            {payerName}
                        </span>{" "}
                        <span className="text-white/30">and</span>{" "}
                        <span className="text-white/80 font-medium">
                            {receiverName}
                        </span>
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={handleEditSettlement}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-emerald-500/3 text-emerald-400/70 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer"
                        title="Edit expense"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => setDeleteSettlementModal(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/3 text-red-400/70 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                        title="Delete expense"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                <p className="text-white/40 text-[11px] uppercase tracking-[0.15em] font-medium">
                    Payment
                </p>

                <div className="flex items-center justify-between mt-3">
                    <div className="min-w-0">
                        <p className="text-white text-lg font-semibold">
                            {payerName}
                        </p>

                        <p className="text-white/40 text-sm mt-1">
                            paid {receiverName}
                        </p>
                    </div>

                    <p className="text-white text-2xl font-semibold shrink-0 ml-4">
                        ₹ {selectedSettlement?.amount}
                    </p>
                </div>
            </div>

            {/* Direction */}
            <div>
                <h3 className="text-white text-base font-semibold mb-3">
                    Payment details
                </h3>

                <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-4 py-3">
                        <span className="text-white/40 text-sm">
                            Paid by
                        </span>

                        <span className="text-white/90 text-sm font-medium">
                            {payerName}
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-4 py-3">
                        <span className="text-white/40 text-sm">
                            Paid to
                        </span>

                        <span className="text-white/90 text-sm font-medium">
                            {receiverName}
                        </span>
                    </div>
                </div>
            </div>

            {
                deleteSettlementModal && (
                    createPortal(
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setDeleteSettlementModal(false)}>
                            <div className="flex flex-col justify-between items-center p-5 rounded-xl bg-red-400/5 border-red-400/20  gap-5">
                                <div className="text-white text-lg font-bold flex flex-col text-center">
                                    <p>Are you sure you want to delete this settlement?</p>
                                    <p className="text-white/70 text-sm">This action cannot be undone.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button className="px-4 py-2 cursor-pointer rounded-xl bg-white text-black font-bold hover:bg-gray-200"
                                        onClick={() => setDeleteSettlementModal(false)}>
                                        Cancel
                                    </button>
                                    <button className="px-4 py-2 cursor-pointer rounded-xl bg-red-500 text-white font-bold hover:bg-red-600"
                                        onClick={handleDeleteSettlement}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>, document.body
                    )
                )
            }
        </div>
    );
};

export default SettlementShowModal;
