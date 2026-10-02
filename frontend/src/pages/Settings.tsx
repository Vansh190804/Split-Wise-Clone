import { useEffect, useState } from "react"
import api from "../api/axios"
import { createPortal } from "react-dom";
import { useContext } from "react";
import { GroupContext } from "../context/group/groupcontext";
import { FriendContext } from '../context/friends/FriendContext'
import { useNavigate } from "react-router-dom";
import { useTransaction } from "../context/transaction/TransactionContext";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { MemberRow } from "../components/MemberRowSettings";
import { HiMiniRectangleGroup } from "react-icons/hi2";


export type GroupMemberInput = {
    id: string | number;
    name: string;
    email: string | null;
    friendId: number | null;
    registered: Boolean;
    isExisting: Boolean;
};

const Settings = () => {

    const { groups, setGroups, groupMembers, setGroupMembers, currentUser, selectedGroup, setSelectedGroup, setOpenSettings } = useContext(GroupContext) ||
    {
        groups: null, setGroups: () => { }, groupMembers: [], setGroupMembers: () => { }, currentUser: null, selectedGroup: null, setSelectedGroup: () => { },
        setOpenSettings: () => { }
    }

    const { allUserBalances } = useTransaction()
    const { friends, setFriends, selectedFriend, setSelectedFriend } = useContext(FriendContext)
        || { friends: [], setFriends: () => { }, selectedFriend: null, setSelectedFriend: () => { } }

    const friendId = selectedFriend?.user_id_1 === currentUser?.id ? selectedFriend?.user_id_2 : selectedFriend?.user_id_1
    const friendName = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_name : selectedFriend?.user1_name
    const friendEmail = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_email : selectedFriend?.user1_email

    const [confirmLeave, setConfirmLeave] = useState<{ id: number, name: string } | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false)
    const [confirmRemove, setConfirmRemove] = useState<boolean>(false)
    const [groupName, setGroupName] = useState<string>(selectedGroup?.name || "")
    const [groupAvatarUrl, setGroupAvatar] = useState<string | null>(selectedGroup?.group_avatar || null)
    const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null)

    const createEmptyMember = (): GroupMemberInput => ({
        id: crypto.randomUUID(),
        name: "",
        email: "",
        friendId: null,
        registered: false,
        isExisting: false,
    });

    const previewUrl = groupAvatarFile ? URL.createObjectURL(groupAvatarFile) : groupAvatarUrl;

    const [members, setMembers] = useState<GroupMemberInput[]>(createEmptyMember() ? [createEmptyMember()] : [])
    const [allMembers, setAllMembers] = useState<GroupMemberInput[]>([])

    const navigate = useNavigate()

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups/my')
            setGroups(res.data)
        } catch (error) {
            console.error("Error fetching groups:", error)
        }
    }

    const fetchGroupMembers = async (groupId: number) => {
        try {
            const res = await api.get(`/groups/${groupId}/members`)
            setGroupMembers(res.data.details)
            setConfirmLeave(null)
        } catch (error) {
            console.error("Error fetching group members:", error)
        }
    }

    const fetchFriends = async () => {
        try {
            const res = await api.get('/friends')
            setFriends(res.data)
            setSelectedFriend(null)
            setConfirmRemove(false)
        } catch (error) {
            console.log("Error fetching friends:", error)
        }
    }

    //Group Settings

    // Leave group
    const handleLeaveGroup = async (memberid: number) => {
        try {
            const payload = {
                group_id: selectedGroup?.id,
                userToDelete: memberid,
                balance: allUserBalances ? allUserBalances[memberid] ?? 0 : 0
            }

            console.log("Payload for leaving group:", payload)

            const res = await api.post(`/groups/leave`, payload)

            if (res.status == 200) {
                if (memberid === currentUser?.id) {
                    await fetchGroups()
                    navigate('/dashboard')
                }
                else {
                    await fetchGroupMembers(selectedGroup?.id as number)
                }
            }

        } catch (error: any) {
            switch (error.response?.status) {
                case 400:
                    console.error(error.response.data.detail)
                    alert(error.response.data.detail)
                    setConfirmLeave(null)
                    break
            }
        }

    }

    // Delete group
    const handleDeleteGroup = async () => {
        try {
            const res = await api.post(`groups/${selectedGroup?.id}/delete`)
            if (res.status == 200) {
                await fetchGroups()
                navigate('/dashboard')
            }
        } catch (error: any) {
            console.error("Error deleting group:", error)
        }
    }

    // Adding a friend from the group member
    const handleAddFriend = async (member: GroupMemberInput) => {
        try {
            await api.post(`/friends/addFromGroup/${member.friendId}`)
            await fetchFriends()
        } catch (err: any) {
            console.error("Error adding friend:", err.response?.data.detail)
        }
    }

    // Remove a  group Member
    const handleRemoveMember = async (member: GroupMemberInput) => {
        const balance = allUserBalances ? allUserBalances[member.friendId as number] ?? 0 : 0

        if (balance !== 0) {
            alert(`Cannot remove ${member.name} from the group. Please settle the balance before removing them.`)
            return
        }

        setMembers((prev) => prev.filter((m) => m.id !== member.id))
    }

    // update group
    const handleSaveChanges = async () => {
        if(!groupName.trim()) {
            alert("Group name cannot be empty.")
            return
        }

        if(members.length === 0 || !members.every(member => member.name.trim() && member.email?.trim())) {
            alert("Please add at least one member with a name or email.")
            return
        }

        const formData = new FormData()
        formData.append('name', groupName)
        formData.append('members_data', JSON.stringify(members))
        
        if(groupAvatarFile){
            formData.append('avatar', groupAvatarFile)
        }

        console.log(formData)

        try {
            await api.put(`/groups/${selectedGroup?.id}/update`, formData)
            fetchGroups()
        } catch (error: any) {
            console.error("Error saving changes:", error)
            alert(error.response?.data.detail || "An error occurred while saving changes.")
        }
    }

    // Friend Settings

    // Remove friend
    const handleRemoveFriend = async () => {
        console.log("Attempting to remove friend with ID:", friendId)
        try {
            console.log("Removing friend with ID:", friendId)
            await api.delete(`/friends/remove/${friendId}`)
            await fetchFriends()
        } catch (err: any) {
            console.log("Error removing friend:", err.response?.data.detail)
            alert(err.response?.data.detail)
        }
    }
    
    //Avatar
    const handleGroupAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if(file){
            setGroupAvatarFile(file)
        }
    }

    const handleRemoveAvatar = () => {
        setGroupAvatarFile(null)
        setGroupAvatar(null)
    }


    useEffect(() => {
        if (selectedGroup) {
            const m: GroupMemberInput[] = groupMembers.filter((m) => m.id !== currentUser?.id).map((member) => ({
                id: crypto.randomUUID(),
                name: member.name,
                email: member.email,
                friendId: member.id,
                registered: member.registered,
                isExisting: true
            }))
            setMembers(m)
        }
    }, [groupMembers, selectedGroup, selectedFriend, friendId, friendName, currentUser])

    useEffect(() => {
        setSelectedGroup(groups!.find((g) => g.id === selectedGroup?.id) || null)
    }, [groups])

    useEffect(() => {
        const fetchAllMembers = async () => {
            try {
                const res = await api.get('/groups/allmembers')
                setAllMembers(res.data.members)
            } catch (error: any) {
                console.log("Error fetching all members:", error.response?.data?.detail)
            }
        }

        fetchAllMembers()
    }, [])

    return (
        <>
            <div className="w-full h-full flex flex-col justify-between relative text-white">

                {/* Main content */}
                <div className="p-6 flex flex-col gap-7 overflow-y-auto hide-scrollbar">

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <button
                            className="w-10 h-10 rounded-full bg-white/10 border border-white/10 
                           flex items-center justify-center text-white text-xl
                           hover:bg-white hover:text-black transition-all duration-200 cursor-pointer"
                            onClick={() => setOpenSettings(false)}
                        >
                            &larr;
                        </button>

                        <div>
                            <h2 className="text-2xl font-bold">
                                {selectedGroup ? "Group Settings" : "Friend Settings"}
                            </h2>
                        </div>
                    </div>


                    {selectedGroup ? (
                        <section className="flex flex-col gap-5">

                            <div className="space-y-3">


                                <div>
                                    <h3 className="text-base font-semibold text-white">
                                        Group Information
                                    </h3>
                                </div>

                                <div className="rounded-xl border border-[#292F2B] bg-[#171B19] p-4">
                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                                        <div className="flex flex-col items-center sm:w-36 sm:shrink-0">
                                            <label
                                                htmlFor="group-avatar"
                                                className="group relative cursor-pointer"
                                            >
                                                {previewUrl ? (
                                                    <img
                                                        src={previewUrl}
                                                        alt="Group"
                                                        className="h-28 w-28 rounded-xl border border-[#303632] object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-[#303632] bg-[#0F1211]">
                                                        <span className="text-2xl font-semibold text-gray-400">
                                                            <HiMiniRectangleGroup className="text-5xl" />
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <span className="text-xs font-medium text-white">
                                                        Change
                                                    </span>
                                                </div>

                                                {previewUrl && 
                                                (<button type="button" onClick={handleRemoveAvatar} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#303632] bg-[#171B19] text-sm text-gray-400 shadow-md transition-colors hover:bg-red-500/10 hover:text-red-400" aria-label="Remove group photo" > 
                                                    × 
                                                </button>)}
                                            </label>

                                            <input
                                                id="group-avatar"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {handleGroupAvatarChange(e)}}
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <Label className="mb-2 block text-xs font-medium text-[#9AA19C]">
                                                Group Name
                                            </Label>

                                            <Input
                                                type="text"
                                                placeholder="Enter group name"
                                                value={groupName}
                                                onChange={(e) => setGroupName(e.target.value)}
                                                className="h-10 rounded-lg border-[#303632] bg-[#0F1211] text-white placeholder:text-[#626A65] focus-visible:border-emerald-500 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                                            />
                                        </div>
                                    </div>
                                </div>


                            </div>


                            <div className="space-y-3">

                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-white/70">
                                        Members
                                    </Label>

                                    <span className="text-xs text-white/30">
                                        {members.length + 1}{" "}
                                        {members.length + 1 === 1 ? "member" : "members"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                                    {
                                        <div>
                                            {currentUser?.avatar_url ?
                                                <img src={currentUser?.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                                                :
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold  text-emerald-400">
                                                    {currentUser?.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            }
                                        </div>
                                    }

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">
                                            {currentUser?.name}
                                        </p>

                                        <p className="truncate text-xs text-white/35">
                                            {currentUser?.email}
                                        </p>
                                    </div>

                                    <span className="ml-auto text-xs text-white/25">
                                        You
                                    </span>
                                </div>

                                {members.map((member) => (
                                    <MemberRow
                                        key={member.id}
                                        member={member}
                                        allMembers={allMembers}
                                        currentUser={currentUser}
                                        friends={friends}
                                        isExistingMember={member.isExisting === true}

                                        onChange={(updatedMember) => {
                                            setMembers((prev) =>
                                                prev.map((m) =>
                                                    m.id === member.id
                                                        ? updatedMember
                                                        : m
                                                )
                                            );
                                        }}

                                        onRemove={() => {
                                            handleRemoveMember(member);
                                        }}

                                        onAddFriend={() => {
                                            handleAddFriend(member);
                                        }}
                                    />
                                ))}


                                <button
                                    type="button"
                                    onClick={() => {
                                        setMembers((prev) => [
                                            ...prev,
                                            createEmptyMember(),
                                        ]);
                                    }}
                                    className="flex items-center gap-2 pt-1 text-sm text-emerald-400/80 transition-colorshover:text-emerald-300 cursor-pointer">
                                    <span className="text-lg leading-none">+</span>
                                    Add a person
                                </button>

                            </div>


                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handleSaveChanges}
                                    className=" cursor-pointer rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-300 active:scale-[0.98]">
                                    Save Changes
                                </button>
                            </div>

                        </section>
                    )
                        : selectedFriend && (
                            <section>
                                <div
                                    className="group flex items-center justify-between p-3
                                       rounded-xl bg-white/10
                                       transition-all duration-200">
                                    <div className="flex items-center gap-3 min-w-0">

                                        <div className="w-10 h-10 shrink-0 rounded-full
                                                bg-emerald-400
                                                flex items-center justify-center
                                                text-black font-bold shadow-sm">
                                            {friendName!.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-medium truncate">
                                                {friendName}
                                            </p>


                                            <p className="text-[11px] text-white/50 truncate">
                                                {friendEmail}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}


                    {selectedGroup ? <section className="mt-2">

                        <div className="border border-red-400/20 rounded-2xl p-4 bg-red-400/5">

                            <div className="mb-4">
                                <h3 className="font-semibold text-red-400">
                                    Danger Zone
                                </h3>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    className="w-full p-3 rounded-xl
                                   border border-red-400/20
                                   text-red-400 text-sm font-semibold
                                   hover:bg-red-400 hover:text-white
                                   transition-all cursor-pointer"
                                    onClick={() => setConfirmLeave({ id: currentUser?.id as number, name: currentUser?.name as string })}
                                >
                                    Leave Group
                                </button>

                                <button
                                    className="w-full p-3 rounded-xl
                                   bg-red-400 text-white
                                   text-sm font-semibold
                                   hover:bg-red-500
                                   transition-all cursor-pointer"
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    Delete Group
                                </button>
                            </div>
                        </div>

                    </section> :
                        selectedFriend &&
                        <section>
                            <button
                                className="w-full mt-2 h-11 rounded-xl
                               border border-dashed border-red-400/30
                               bg-red-400/5
                               text-red-400 text-sm font-semibold
                               hover:bg-red-400/10
                               hover:border-red-400/60
                               transition-all cursor-pointer"
                                onClick={() => setConfirmRemove(true)}
                            >
                                Delete Friendship
                            </button>
                        </section>}

                </div>
            </div>

            {
                confirmLeave && createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                        <div className="flex flex-col justify-between items-center p-5 rounded-xl bg-red-400/5 border-red-400/20  gap-5">
                            <div className="text-white text-lg font-bold flex flex-col text-center">
                                {
                                    confirmLeave.id === currentUser?.id ? <p>Are you sure you want to leave this group?</p> :
                                        <p>Are you sure you want to remove {confirmLeave.name} from the group?</p>
                                }
                            </div>
                            <div className="flex gap-4">
                                <button className="px-4 py-2 cursor-pointer rounded-xl bg-white text-black font-bold hover:bg-gray-200"
                                    onClick={() => setConfirmLeave(null)}>
                                    Cancel
                                </button>
                                <button className="px-4 py-2 cursor-pointer rounded-xl bg-red-500 text-white font-bold hover:bg-red-600"
                                    onClick={() => handleLeaveGroup(confirmLeave.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>, document.body
                )
            }

            {
                confirmRemove && createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                        <div className="flex flex-col justify-between items-center p-5 rounded-xl bg-red-400/5 border-red-400/20  gap-5">
                            {
                                <p className="text-white text-lg font-bold flex flex-col text-center">
                                    <p>Are you sure you want to remove {friendName} as your friend?</p>
                                    <p>All their expenses with you will be deleted</p>
                                </p>

                            }
                            <div className="flex gap-4">
                                <button className="px-4 py-2 cursor-pointer rounded-xl bg-white text-black font-bold hover:bg-gray-200"
                                    onClick={() => setConfirmRemove(false)}>
                                    Cancel
                                </button>
                                <button className="px-4 py-2 cursor-pointer rounded-xl bg-red-500 text-white font-bold hover:bg-red-600"
                                    onClick={handleRemoveFriend}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>, document.body
                )
            }

            {
                confirmDelete && createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                        <div className="flex flex-col justify-between items-center p-5 rounded-xl bg-red-400/5 border-red-400/20  gap-5">
                            <p className="text-white text-lg font-bold">Are you sure you want to delete the group?</p>
                            <p className="text-white">This will remove the group for all users involved.</p>
                            <div className="flex gap-4">
                                <button className="px-4 py-2 cursor-pointer rounded-xl bg-white text-black font-bold hover:bg-gray-200"
                                    onClick={() => setConfirmDelete(false)}>
                                    Cancel
                                </button>
                                <button className="px-4 py-2 cursor-pointer rounded-xl bg-red-500 text-white font-bold hover:bg-red-600"
                                    onClick={handleDeleteGroup}>
                                    Delete Group
                                </button>
                            </div>
                        </div>
                    </div>, document.body
                )
            }
        </>
    )
}

export default Settings
