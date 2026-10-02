import { useState, useEffect, useContext } from 'react'
import type { GroupMember } from '../context/group/groupcontext.tsx'
import { GroupContext } from '../context/group/groupcontext.tsx'
import { ExpenseContext } from '../context/expense/ExpenseContext.tsx'
import { FriendContext } from '../context/friends/FriendContext.tsx'
import { useTransaction } from '../context/transaction/TransactionContext.tsx'
import type { Transaction } from '../context/transaction/TransactionContext.tsx'
import { RippleButton } from '../components/ui/ripple-button.tsx'
import { FaLongArrowAltRight } from "react-icons/fa";
import api from '../api/axios.ts'
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select"




const SettleUpModal = ({ setSettleUpModal }: { setSettleUpModal: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const [recordPayment, setRecordPayment] = useState<number | null>(null)

    const { groups, selectedGroup, currentUser, groupMembers } = useContext(GroupContext) ||
        { groups: [], selectedGroup: null, currentUser: null, groupMembers: [] }
    const { refresh, setRefresh } = useContext(ExpenseContext) || { refresh: false, setRefresh: () => { } }
    const { selectedFriend } = useContext(FriendContext) || { selectedFriend: null }
    const { transactions, setTransactions } = useTransaction()

    const [paidBy, setPaidBy] = useState<GroupMember | null>(null)
    const [paidTo, setPaidTo] = useState<GroupMember | null>(null)
    const [selectedMembers, setSelectedMembers] = useState<(GroupMember)[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(selectedGroup ? String(selectedGroup.id) : null)


    const friendId = selectedFriend?.user_id_1 === currentUser?.id ? selectedFriend?.user_id_2 : selectedFriend?.user_id_1
    const friendName = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_name : selectedFriend?.user1_name
    const friendAvatar = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_avatar : selectedFriend?.user1_avatar

    useEffect(() => {
        if (selectedGroup) {
            const fetchGroupTransactions = async () => {
                try {
                    const res = await api.get(`/groups/${selectedGroup.id}/balances`)
                    setTransactions(res.data.transactions)

                    if (res.data.current_user_balances <= 0) {
                        const transactions = res.data.transactions.filter(
                            (tx: any) => tx.from_userid === currentUser?.id
                        );

                        const maxTransaction = transactions.reduce(
                            (max: any, tx: any) =>
                                !max || tx.amount > max.amount ? tx : max,
                            null
                        );

                        setPaidBy(groupMembers.filter((member) => member.id === currentUser?.id)[0])

                        if (maxTransaction) {
                            setPaidTo(groupMembers.filter((member) => member.id === maxTransaction.to_userid)[0])
                        } else {
                            setPaidTo(groupMembers.filter((member) => member.id === currentUser?.id)[0]);
                        }
                    } else {
                        const transactions = res.data.transactions.filter(
                            (tx: any) => tx.to_userid === currentUser?.id
                        );

                        const maxTransaction = transactions.reduce(
                            (max: any, tx: any) =>
                                !max || tx.amount > max.amount ? tx : max,
                            null
                        );

                        setPaidTo(groupMembers.filter((member) => member.id === currentUser?.id)[0])

                        if (maxTransaction) {
                            setPaidBy(groupMembers.filter((member) => member.id === maxTransaction.from_userid)[0])
                        }
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            fetchGroupTransactions()
            setSelectedMembers(groupMembers)
        }
        else if (selectedFriend) {
            const fetchFriendTransactions = async () => {
                try {
                    const res = await api.get(`/friends/${friendId}/balances`)
                    console.log("Friend Transactions:", res.data)
                    const balance = Math.abs(res.data.current_user_balances)
                    setRecordPayment(balance)

                    if (res.data.current_user_balances <= 0) {
                        setPaidBy({
                            "id": currentUser!.id,
                            "name": currentUser!.name,
                            "email": null,
                            "group_id": null,
                            "registered": true,
                            "avatar_url": currentUser!.avatar_url
                        })
                        setPaidTo({
                            "id": friendId!,
                            "name": friendName!,
                            "email": null,
                            "group_id": null,
                            "registered": true,
                            "avatar_url": friendAvatar!
                        })
                    }
                    else {
                        setPaidBy({
                            "id": friendId!,
                            "name": friendName!,
                            "email": null,
                            "group_id": null,
                            "registered": true,
                            "avatar_url": friendAvatar!
                        })
                        setPaidTo({
                            "id": currentUser!.id,
                            "name": currentUser!.name,
                            "email": null,
                            "group_id": null,
                            "registered": true,
                            "avatar_url": currentUser!.avatar_url
                        })
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            fetchFriendTransactions()
            setSelectedMembers([
                {
                    "id": friendId!,
                    "name": friendName!,
                    "email": null,
                    "group_id": null,
                    "registered": true,
                    "avatar_url": friendAvatar!
                },
                {
                    "id": currentUser!.id,
                    "name": currentUser!.name,
                    "email": null,
                    "group_id": null,
                    "registered": true,
                    "avatar_url": currentUser!.avatar_url
                }
            ])
        }
        else {
            const fetchDashboardTransactions = async (members: GroupMember[]) => {
                try {
                    const res = await api.get('/expenses/dashboard')
                    const trans = res.data.all_transactions
                    setTransactions(trans)

                    const maxTransaction = trans.reduce((max: any, tx: any) => !max || tx.amount > max.amount ? tx : max, null)

                    if (maxTransaction) {
                        setPaidBy(members.filter((member) => member.id === maxTransaction.from_userid)[0])
                        setPaidTo(members.filter((member) => member.id === maxTransaction.to_userid)[0])
                    }
                } catch (err: any) {
                    console.log(err.response.data.detail)
                }
            }

            const fetchMembers = async () => {
                try {
                    const res = await api.get('/groups/allmembers')
                    const members: GroupMember[] = [
                        ...res.data.group_member_format,
                        {
                            "id": currentUser!.id,
                            "name": currentUser!.name,
                            "email": currentUser!.email,
                            "group_id": null,
                            "registered": true,
                            "avatar_url": currentUser!.avatar_url
                        }
                    ]

                    setSelectedMembers(members)
                    return members
                } catch (err: any) {
                    console.log(err.response.data.detail)
                }
            }

            const data = async () => {
                const members = await fetchMembers()
                await fetchDashboardTransactions(members!)
            }

            data()
        }
    }, [])

    useEffect(() => {
        const transaction = transactions.find((tx: Transaction) => tx.from_userid === paidBy?.id && tx.to_userid === paidTo?.id) || null

        if (transaction) {
            setRecordPayment(Math.abs(transaction.amount))
        }
        else {
            setRecordPayment(null)
        }
    }, [paidBy, paidTo, transactions])

    const handlePaidByChange = (id: number) => {
        setPaidBy(selectedMembers.filter((member) => member.id === id)[0] || null)
    }

    const handlePaidToChange = (id: number) => {
        setPaidTo(selectedMembers.filter((member) => member.id === id)[0] || null)
    }

    // Record payment button function
    const handleSettleBetweenMembers = async () => {
        if (recordPayment! <= 0) {
            alert("Write an amount")
            return
        }

        const payload = {
            group_id: selectedGroupId ? Number(selectedGroupId) : null,
            paid_by: paidBy?.id,
            paid_to: paidTo?.id,
            amount: recordPayment
        }

        console.log("Settling between members with payload:", payload)

        try {
            await api.post('settlements/settle', payload)
            setRefresh(!refresh)
            setRecordPayment(null)
            setPaidBy(null)
            setPaidTo(null)
            setSettleUpModal(false)
        } catch (error: any) {
            console.log("Error recording payment:", error)
            alert(error.response?.data?.detail || "An error occurred while recording the payment.")
        }
    }

    //Major group selection
    const handleGroupChange = (value: string) => {
        setSelectedGroupId(value == "no group" ? null : value)
    }

    return (
        <>
            <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-5 flex flex-col gap-6 shadow-lg">
                <div className="flex flex-col">
                    <div className="flex flex-col items-center justify-center gap-5">
                        <div className='flex items-center justify-center gap-5'>
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                                    {paidBy?.avatar_url ? (
                                        <img
                                            src={paidBy.avatar_url}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-emerald-500/15 text-3xl font-semibold text-emerald-400">
                                            {paidBy?.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <span className="max-w-24 truncate text-xs text-white/60">
                                    {paidBy?.name}
                                </span>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
                                <FaLongArrowAltRight className="text-xl text-white/60" />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                                    {paidTo?.avatar_url ? (
                                        <img
                                            src={paidTo.avatar_url}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-emerald-500/15 text-3xl font-semibold text-emerald-400">
                                            {paidTo?.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <span className="max-w-24 truncate text-xs text-white/60">
                                    {paidTo?.name}
                                </span>
                            </div>
                        </div>


                        <div className='flex items-center text-white gap-3'>
                            <p>Belongs to:</p>
                            <Select value={selectedGroupId ?? "no group"} onValueChange={handleGroupChange}>
                                <SelectTrigger className='text-white'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no group">No group</SelectItem>

                                    <SelectGroup>
                                        {groups.map((item) => (
                                            item.is_active && item.id != null && (
                                                <SelectItem key={item.id} value={String(item.id)}>
                                                    {item.name}
                                                </SelectItem>
                                            )
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="relative">
                            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/35">
                                Paid by
                            </label>

                            <select
                                value={paidBy?.id ?? ""}
                                onChange={(e) => handlePaidByChange(Number(e.target.value))}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-10 text-sm text-white outline-none transition hover:border-white/20 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20"
                            >
                                {selectedMembers.map((member: any) => (
                                    <option
                                        key={member.id}
                                        value={member.id}
                                        className="bg-[#1E1E1E] text-white"
                                    >
                                        {member.name}
                                    </option>
                                ))}
                            </select>

                            <span className="pointer-events-none absolute right-3 bottom-3.5 text-white/40">
                                ▾
                            </span>
                        </div>

                        <div className="relative">
                            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/35">
                                Paid to
                            </label>

                            <select
                                value={paidTo?.id ?? ""}
                                onChange={(e) => handlePaidToChange(Number(e.target.value))}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-10 text-sm text-white outline-none transition hover:border-white/20 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20"
                            >
                                {selectedMembers.map((member: any) => (
                                    <option
                                        key={member.id}
                                        value={member.id}
                                        className="bg-[#1E1E1E] text-white"
                                    >
                                        {member.name}
                                    </option>
                                ))}
                            </select>

                            <span className="pointer-events-none absolute right-3 bottom-3.5 text-white/40">
                                ▾
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-white/35">
                        Amount
                    </label>

                    <div className="relative w-2/4">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            ₹
                        </span>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={recordPayment ? recordPayment : ""}
                            onChange={(e) => setRecordPayment(Number(e.target.value))}
                            className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-9 pr-4 text-right text-white placeholder:text-white/25 outline-none transition focus:border-emerald-300/60 focus:ring-1 focus:ring-emerald-300/10"
                        />
                    </div>
                </div>

                <div className='flex items-center justify-end gap-3 pt-2'>
                    <button type='button' onClick={() => setSettleUpModal(false)} className='rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white cursor-pointer'>Cancel</button>
                    <RippleButton
                        className="rounded-full border border-emerald-400/20 bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500"
                        onClick={handleSettleBetweenMembers}
                    >
                        Record Payment
                    </RippleButton>
                </div>
            </div>
        </>
    )
}

export default SettleUpModal
