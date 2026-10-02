import { useState, useEffect, useContext } from 'react'
import type { GroupMember } from '../context/group/groupcontext.tsx'
import { GroupContext } from '../context/group/groupcontext.tsx'
import { ExpenseContext } from '../context/expense/ExpenseContext.tsx'
import { FriendContext } from '../context/friends/FriendContext.tsx'
import { RippleButton } from '../components/ui/ripple-button.tsx'
import { FaLongArrowAltRight } from "react-icons/fa";
import api from '../api/axios.ts'
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select"




const SettleUpModal = () => {

    const [recordPayment, setRecordPayment] = useState<number | null>(null)

    const { groups, selectedGroup, currentUser, groupMembers, editSettlement } = useContext(GroupContext) ||
        { groups: [], selectedGroup: null, currentUser: null, groupMembers: [], editSettlement: null }

    const { refresh, setRefresh, setEditSettleUpModal, selectedSettlement, setSelectedSettlement } = useContext(ExpenseContext) 
    || { refresh: false, setRefresh: () => { }, setEditSettleUpModal: () => {}, selectedSettlement: null, 
         setSelectedSettlement: () => {} }

    const { selectedFriend } = useContext(FriendContext) || { selectedFriend: null }

    const [paidBy, setPaidBy] = useState<GroupMember | null>(null)
    const [paidTo, setPaidTo] = useState<GroupMember | null>(null)
    const [selectedMembers, setSelectedMembers] = useState<(GroupMember)[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(selectedGroup ? String(selectedGroup.id) : null)


    const friendId = selectedFriend?.user_id_1 === currentUser?.id ? selectedFriend?.user_id_2 : selectedFriend?.user_id_1
    const friendName = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_name : selectedFriend?.user1_name
    const friendAvatar = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_avatar : selectedFriend?.user1_avatar

    useEffect(() => {
        if (selectedGroup) {
            setSelectedMembers(groupMembers)
        }
        else if (selectedFriend) {
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

            fetchMembers()
        }
    }, [])

    useEffect(() => {
        console.log("Edit Settlement:", editSettlement)

        const paid_by = editSettlement?.paid_by ? selectedMembers.find((member) => member.id === editSettlement.paid_by) : null
        setPaidBy(paid_by ?? currentUser)

        const paid_to = editSettlement?.paid_to ? selectedMembers.find((member) => member.id === editSettlement.paid_to) : null
        setPaidTo(paid_to ?? currentUser)

        setRecordPayment(editSettlement?.amount ?? null)
    }, [selectedMembers])

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
            await api.put(`settlements/update/${selectedSettlement?.id}`, payload)
            setRefresh(!refresh)
            setRecordPayment(null)
            setSelectedSettlement(null)
            setPaidBy(null)
            setPaidTo(null)
            setEditSettleUpModal(false)
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
                    <button type='button' onClick={() => setEditSettleUpModal(false)} className='rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white cursor-pointer'>Cancel</button>
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
