import {FriendContext }from './FriendContext'
import type { Friend } from './FriendContext'
import { useState } from 'react'


export const FriendProvider = ({children}: {children: React.ReactNode}) => {
    const [friends, setFriends] = useState<Friend[]>([])
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
    const [showFriendExpenses, setShowFriendExpenses] = useState<boolean>(false)

    return (
        <FriendContext.Provider value = {{friends, setFriends, selectedFriend,
                                          setSelectedFriend, showFriendExpenses,setShowFriendExpenses}}>
            {children}
        </FriendContext.Provider>
    )
}