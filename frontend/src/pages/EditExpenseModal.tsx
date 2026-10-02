import { useContext, useEffect, useState } from 'react'
import { ExpenseContext } from '../context/expense/ExpenseContext'
import { GroupContext } from '../context/group/groupcontext'
import type { GroupMember } from '../context/group/groupcontext'
import type { selectedMember } from '../context/group/groupcontext'
import React from 'react'
import api from '../api/axios'
import {
    Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxItem, ComboboxList, ComboboxValue, useComboboxAnchor,
} from "../components/ui/combobox"
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select"

type SplitType = 'equal' | 'custom' | 'percentage'

const EditExpenseModal = () => {

    const Excontext = useContext(ExpenseContext)
    const Gcontext = useContext(GroupContext)

    const anchor = useComboboxAnchor()

    const { selectedExpense, setSelectedExpense, expenseForm, setExpenseForm, setEditExpenseModal, setRefresh } = Excontext ||
    {
        selectedExpense: null, setSelectedExpense: () => {},
        expenseForm: {
            title: '', amount: '', splitType: 'equal', payerId: '', selected: {} as Record<number, boolean>,
            splitValues: {} as Record<number, string>
        }, setExpenseForm: () => { }, addExpenseModal: false, setEditExpenseModal: () => { },
        setRefresh: () => { }
    }

    const { groups, selectedGroup, currentUser, editSelectMembers } = Gcontext ||
        { groups: [], groupMembers: [], selectedGroup: null, currentUser: null, editSelectMembers: [] }

    const [searchQuery, setSearchQuery] = useState<string>('')
    const [searchResults, setSearchResults] = useState<(selectedMember)[]>([])
    const [selectedMembers, setSelectedMembers] = useState<(selectedMember)[]>([])
    const [membersParticipating, setMembersParticipating] = useState<(GroupMember)[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(selectedGroup ? String(selectedGroup.id) : null)

    useEffect(() => {
        if (editSelectMembers) {
            setSelectedMembers(editSelectMembers)
        }
    }, [])

    useEffect(() => {
        console.log("Selected Members", selectedMembers)
        const participants: GroupMember[] = [];
        participants.push(currentUser as GroupMember)

        const fetchParticipants = async () => {
            const groupsInvolved = selectedMembers.filter((member) => member.is_group === true)
            const friendsInvolved = selectedMembers.filter((member) => member.is_group == false)

            try {
                for (const g of groupsInvolved) {
                    const res = await api.get(`groups/${g.item_id}/members`)
                    for (const r of res.data.details) {
                        if (!participants.some((p) => p.id === r.id))
                            participants.push(r)
                    }
                }

                for (const f of friendsInvolved) {
                    if (!participants.some((p) => p.id === f.item_id)) {
                        const f_member = {
                            "id": f.item_id,
                            "group_id": null,
                            "name": f.name,
                            "email": null,
                            "registered": true,
                            "avatar_url": f.avatar_url
                        }
                        participants.push(f_member)
                    }
                }

                setMembersParticipating(participants)
            } catch (err: any) {
                console.error(err)
            }
        }

        fetchParticipants()

    }, [selectedMembers])

    useEffect(() => {
        const controller = new AbortController()

        if (!searchQuery.trim()) {
            setSearchResults([])
            return
        }

        const payload = {
            query: searchQuery,
            selectedMembers: selectedMembers
        }

        const search = async () => {
            try {
                const res = await api.post(`/search`, payload, {
                    signal: controller.signal,
                })
                setSearchResults(res.data)
            } catch (err) {
                console.log(err)
            }
        }

        search()
        return () => controller.abort()
    }, [searchQuery])

    useEffect(() => {
        setExpenseForm(prev => {          
            return {
            ...prev,
            selected: membersParticipating.reduce<Record<number, boolean>>((acc, member) => {
                acc[member.id] = true
                return acc
            }, {})
        }})
    }, [membersParticipating])


    const selectedMemberList = membersParticipating.filter((member) => expenseForm.selected[member.id])
    const selectedMemberCount = selectedMemberList.length
    const expenseAmountNumber = Number(expenseForm.amount) || 0
    const splitPreview = selectedMemberCount > 0 ? expenseAmountNumber / selectedMemberCount : 0
    const selectedIds = selectedMemberList.map((member) => member.id)
    const splitValuesForSelected = selectedMemberList.map((member) => Number(expenseForm.splitValues[member.id]) || 0)
    const selectedManualTotal = splitValuesForSelected.reduce((sum, value) => sum + value, 0)
    const selectedPercentageTotal = splitValuesForSelected.reduce((sum, value) => sum + value, 0)
    const isManualSplitValid = expenseForm.splitType !== 'custom' || selectedManualTotal <= expenseAmountNumber
    const isPercentageSplitValid = expenseForm.splitType !== 'percentage' || selectedPercentageTotal <= 100
    const isEqualSplitValid = expenseForm.splitType !== 'equal' || selectedMemberCount > 0
    const isExpenseFormValid = Boolean(expenseForm.title.trim())
        && expenseAmountNumber > 0
        && selectedIds.length > 0
        && isManualSplitValid
        && isPercentageSplitValid
        && isEqualSplitValid


    const handleSelect = (items: any[]) => {
        setSelectedMembers(items)
        setSearchQuery('')
    }

    useEffect(() => {
        console.log("expenseForm", expenseForm)
    }, [])


    // Editing Expense
    const handleExpenseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!isExpenseFormValid) {
            alert("Please fill in all required fields and ensure the splits are valid.")
            return
        }

        if (selectedMembers.length == 0) {
            alert("Please select at least one member or group to split the expense with.")
            return
        }

        const payload = {
            title: expenseForm.title.trim(),
            split_between: selectedIds,
            splits: expenseForm.splitType === 'equal' ? null : splitValuesForSelected,
            amount: expenseAmountNumber,
            major_group_id: selectedGroupId ? Number(selectedGroupId) : null,
            split_type: expenseForm.splitType,
            paid_by: Number(expenseForm.payerId),
        }

        console.log("Expense Payload", payload)

        try {
            await api.put(`/expenses/update/${selectedExpense?.id}`, payload)
            setEditExpenseModal(false)
            setSelectedExpense(null)
            setRefresh((prev) => !prev)
        } catch (err: any) {
            console.error(err.response?.data?.detail)
            alert(err.response?.data?.detail)
        }
    }


    const handleGroupChange = (value: string) => {
        setSelectedGroupId(value == "no group" ? null : value)
    }

    return (
        <div className='bg-[#1E1E1E] rounded-3xl overflow-hidden'>
            <div className='rounded-3xl bg-linear-to-br p-6 overflow-y-auto hide-scrollbar flex flex-col gap-4 max-h-[80vh] relative'>
                <Combobox
                    multiple
                    autoHighlight
                    items={searchResults}
                    value={selectedMembers}
                    onValueChange={handleSelect}
                >
                    <div className='flex items-center text-white gap-3'>
                        <p>With you and:</p>
                        <ComboboxChips ref={anchor} className="w-full max-w-xs">
                            <ComboboxValue>
                                {(values) => (
                                    <>
                                        {values.map((value: any) => (
                                            <ComboboxChip key={value.id}>
                                                {value.name}
                                            </ComboboxChip>
                                        ))}
                                        <ComboboxChipsInput
                                            value={searchQuery}
                                            placeholder={selectedMembers.length == 0 ? `Search by group or user name...` : ''}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </>
                                )}
                            </ComboboxValue>
                        </ComboboxChips>
                    </div>
                    <ComboboxContent anchor={anchor}>
                        <ComboboxList>
                            {(item) => (
                                <ComboboxItem key={item.id} value={item}>
                                    {item.name}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>

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

                <form className='space-y-5 rounded-3xl border border-white/10 bg-black/25 p-5' onSubmit={handleExpenseSubmit}>
                    <div className='space-y-5'>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <label className='space-y-2'>
                                <span className='text-white text-sm font-medium'>Name</span>
                                <input
                                    type='text'
                                    value={expenseForm.title}
                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder=''
                                    className='w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-emerald-300/70'
                                />
                            </label>

                            <label className='space-y-2'>
                                <span className='text-white text-sm font-medium'>Amount</span>
                                <input
                                    type='number'
                                    min='0'
                                    step='0.01'
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                                    placeholder='0.00'
                                    className='w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-emerald-300/70'
                                />
                            </label>
                        </div>

                        <div className='grid gap-4 md:grid-cols-2'>
                            <label className='space-y-2'>
                                <span className='text-white text-sm font-medium'>Paid by</span>
                                <select
                                    value={expenseForm.payerId}
                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, payerId: e.target.value }))}
                                    className='w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-emerald-300/70'
                                >
                                    {membersParticipating.map((member) => (
                                        <option key={member.id} value={member.id} className='text-black'>
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className='space-y-2'>
                                <span className='text-white text-sm font-medium'>Split type</span>
                                <select
                                    value={expenseForm.splitType}
                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, splitType: e.target.value as SplitType }))}
                                    className='w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-emerald-300/70'
                                >
                                    <option value='equal' className='text-black'>Equal</option>
                                    <option value='custom' className='text-black'>Manual</option>
                                    <option value='percentage' className='text-black'>Percentage</option>
                                </select>
                            </label>
                        </div>

                        {expenseForm.splitType !== 'equal' && (
                            <p className={`text-sm ${expenseForm.splitType === 'custom' ? (isManualSplitValid ? 'text-white/60' : 'text-red-300') : (isPercentageSplitValid ? 'text-white/60' : 'text-red-300')}`}>
                                {expenseForm.splitType === 'custom'
                                    ? `Manual split total: ₹ ${selectedManualTotal.toFixed(2)} / ₹ ${expenseAmountNumber.toFixed(2)}`
                                    : `Percentage total: ${selectedPercentageTotal}% / 100%`}
                            </p>
                        )}

                        <div className='rounded-3xl border border-white/10 bg-white/5 p-4'>
                            <div className='flex items-center justify-between gap-3 mb-4'>
                                <div>
                                    <h3 className='text-white font-semibold'>People and split</h3>
                                    <p className='text-white/60 text-sm'>{selectedMemberCount} of {membersParticipating.length} selected</p>
                                </div>
                            </div>

                            <div className='space-y-3'>
                                {membersParticipating.map((member) => {
                                    console.log("member id:", member.id);
                                    console.log("split values:", expenseForm.splitValues);
                                    console.log(
                                        "value:",
                                        expenseForm.splitValues[member.id]
                                    );
                                    const isSelected = Boolean(expenseForm.selected[member.id])
                                    const displayValue = expenseForm.splitType === 'equal'
                                        ? (isSelected ? `₹ ${splitPreview.toFixed(2)}` : '₹ 0.00')
                                        : expenseForm.splitType === 'percentage'
                                            ? `${expenseForm.splitValues[member.id] || 0}%`
                                            : `₹ ${expenseForm.splitValues[member.id] || '0.00'}`

                                    return (
                                        <label key={member.id} className='flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white'>
                                            <input
                                                type='checkbox'
                                                checked={isSelected}
                                                onChange={() => setExpenseForm((prev) => ({
                                                    ...prev,
                                                    selected: {
                                                        ...prev.selected,
                                                        [member.id]: !isSelected,
                                                    },
                                                }))}
                                                className='h-4 w-4 rounded-full cursor-pointer border-white/30 bg-transparent text-emerald-400 focus:ring-emerald-300'
                                            />

                                            <div className='min-w-0 flex-1'>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        {
                                                            member.avatar_url ?
                                                                <img src={member.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
                                                                :
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold  text-emerald-400">
                                                                    {member.name?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                        }
                                                    </div>
                                                    <p className='font-medium truncate'>{member.name}</p>
                                                </div>
                                            </div>

                                            <div className='w-32 text-right'>
                                                {expenseForm.splitType === 'equal' ? (
                                                    <p className='font-semibold text-emerald-100'>{displayValue}</p>
                                                ) : (
                                                    <input
                                                        type='number'
                                                        min='0'
                                                        max={expenseForm.splitType === 'percentage'
                                                            ? String(Math.max(0, 100 - (selectedPercentageTotal - (Number(expenseForm.splitValues[member.id]) || 0))))
                                                            : expenseForm.splitType === 'custom'
                                                                ? String(Math.max(0, expenseAmountNumber - (selectedManualTotal - (Number(expenseForm.splitValues[member.id]) || 0))))
                                                                : undefined}
                                                        step={expenseForm.splitType === 'percentage' ? '1' : '0.01'}
                                                        value={expenseForm.splitValues[member.id]}
                                                        onChange={(e) => setExpenseForm((prev) => ({
                                                            ...prev,
                                                            splitValues: {
                                                                ...prev.splitValues,
                                                                [member.id]: e.target.value,
                                                            },
                                                        }))}
                                                        placeholder={expenseForm.splitType === 'percentage' ? '%' : '₹'}
                                                        className='w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right text-white placeholder:text-white/30 outline-none focus:border-emerald-300/70'
                                                        disabled={!isSelected}
                                                    />
                                                )}
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>

                        <div className='flex items-center justify-end gap-3 pt-2'>
                            <button type='button' onClick={() => setEditExpenseModal(false)} className='rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white cursor-pointer'>Cancel</button>
                            <button
                                type='submit'
                                disabled={!isExpenseFormValid}
                                className='rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-900/30 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40 cursor-pointer'
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditExpenseModal
