import type { GroupMember } from './groupcontext.tsx'
import type { Group } from './groupcontext.tsx'
import {GroupContext} from './groupcontext.tsx'
import type { selectedMember } from './groupcontext.tsx'
import type { editSettlement } from './groupcontext.tsx'
import {useState} from 'react'



export const GroupProvider = ({ children }: { children: React.ReactNode }) => {
    const [groups, setGroups] = useState<Group[]>([])
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    const [currentUser, setCurrentUser] = useState<GroupMember | null>(null)
    const [openSettings, setOpenSettings] = useState<boolean>(false)
    const [editSelectMembers, setEditSelectMembers] = useState<selectedMember[]>([])
    const [editSettlement, setEditSettlement] = useState<editSettlement | null>(null)
    const [showGroupExpenses, setShowGroupExpenses] = useState<boolean>(false)

    return (
        <GroupContext.Provider value={{ groups, setGroups, groupMembers, setGroupMembers, 
                                       selectedGroup, setSelectedGroup, currentUser, setCurrentUser, 
                                       openSettings, setOpenSettings, editSelectMembers, setEditSelectMembers,
                                       editSettlement, setEditSettlement, showGroupExpenses, setShowGroupExpenses }}>
            {children}
        </GroupContext.Provider>
    )
}