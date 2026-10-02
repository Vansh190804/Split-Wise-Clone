import { createContext } from 'react'

export type Friend = {
    id: number
    user_id_1: number
    user_id_2: number
    user1_name: string | null
    user2_name: string | null
    user1_email: string | null
    user2_email: string | null
    user1_avatar: string | null
    user2_avatar: string | null
    created_at: Date
    status: "pending" | "accepted"
}


export type FriendContextType = {
     friends: Friend[],
     setFriends: React.Dispatch<React.SetStateAction<Friend[]>>

     selectedFriend: Friend | null,
     setSelectedFriend: React.Dispatch<React.SetStateAction<Friend | null>>

     showFriendExpenses: boolean,
     setShowFriendExpenses: React.Dispatch<React.SetStateAction<boolean>>
}

export const FriendContext = createContext<FriendContextType | null>(null)