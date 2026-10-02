import {createContext} from 'react'

export type Group = {
  id: number
  name: string
  group_avatar: string | null
  is_active: boolean
}

export type GroupMember = {
  id: number
  group_id: number | null
  name: string
  email: string | null
  registered: Boolean,
  avatar_url: string | null
}

export type selectedMember = {
    id: number,
    item_id: number,
    name: string,
    is_group: boolean,
    is_active: boolean | null
    avatar_url: string | null
}

export type editSettlement = {
    paid_by: number | null
    paid_to: number | null
    amount: number,
}


export type GroupContextType = {
    groups: Group[];
    setGroups: React.Dispatch<React.SetStateAction<Group[]>>;

    groupMembers: GroupMember[];
    setGroupMembers: React.Dispatch<React.SetStateAction<GroupMember[]>>;

    currentUser: GroupMember | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<GroupMember | null>>;

    selectedGroup: Group | null;
    setSelectedGroup: React.Dispatch<React.SetStateAction<Group | null>>;

    openSettings: boolean;
    setOpenSettings: React.Dispatch<React.SetStateAction<boolean>>;

    editSelectMembers: selectedMember[];
    setEditSelectMembers: React.Dispatch<React.SetStateAction<selectedMember[]>>; 

    editSettlement: editSettlement | null;
    setEditSettlement: React.Dispatch<React.SetStateAction<editSettlement | null>>;

    showGroupExpenses: boolean;
    setShowGroupExpenses: React.Dispatch<React.SetStateAction<boolean>>;
}


export const GroupContext = createContext<GroupContextType | null>(null);
