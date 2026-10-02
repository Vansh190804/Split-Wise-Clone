import { useEffect, useState, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { RippleButton } from '../components/ui/ripple-button'
import api from '../api/axios'
import { createPortal } from 'react-dom'
import { ExpenseContext } from '../context/expense/ExpenseContext.tsx'
import { GroupContext } from '../context/group/groupcontext.tsx'
import { useTransaction } from '../context/transaction/TransactionContext.tsx'
import type { Group } from '../context/group/groupcontext.tsx'
import type { Friend } from '../context/friends/FriendContext.tsx'
import { FriendContext } from '../context/friends/FriendContext.tsx'
import AddExpenseModal from '../pages/AddExpenseModal.tsx'
import SettleUpModal from '../pages/SettleUpModal.tsx'
import FriendPage from './FriendPage.tsx'
import AllExpenses from './AllExpenses.tsx'
import Groups from './Groups.tsx'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/ui/hover-card"
import { LogOutIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Button } from '../components/ui/button.tsx'
import { IoIosSettings } from 'react-icons/io'
import { IoIosWarning } from "react-icons/io";
import { MemberRow } from '../components/MemberRow.tsx'
import { Input } from '../components/ui/input.tsx'
import { Label } from '../components/ui/label.tsx'
import { HiMiniRectangleGroup } from "react-icons/hi2";
import { FaUser } from "react-icons/fa";
import { FaTag } from "react-icons/fa";
import { IoIosList } from "react-icons/io";
import { GiSplitCross } from "react-icons/gi";


export type GroupMemberInput = {
  id: number;
  name: string;
  email: string;
  friendId: number | null;
};

const dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  //group context
  const { groups, setGroups, groupMembers, selectedGroup, setSelectedGroup, currentUser, setCurrentUser, setOpenSettings,
    setShowGroupExpenses
  } = useContext(GroupContext) ||
    {
      groups: [], setGroups: () => { }, groupMembers: [], selectedGroup: null, setSelectedGroup: () => { }, currentUser: null, setCurrentUser: () => { }, setOpenSettings: () => { }, setShowGroupExpenses: () => { }
    }

  //expense context
  const { setSelectedExpense, setSelectedSettlement, addExpenseModal, setAddExpenseModal, openExpenses, setOpenExpenses, refresh, settleUpModal, setSettleUpModal } = useContext(ExpenseContext) ||
    { setSelectedExpense: () => { }, setSelectedSettlement: () => { }, addExpenseModal: false, setAddExpenseModal: () => { }, openExpenses: false, setOpenExpenses: () => { }, refresh: false, settleUpModal: false, setSettleUpModal: () => { } }

  //friend context
  const { friends, setFriends, selectedFriend, setSelectedFriend, setShowFriendExpenses } = useContext(FriendContext) ||
    { friends: [], setFriends: () => { }, selectedFriend: null, setSelectedFriend: () => { }, setShowFriendExpenses: () => { } }


  const friendName = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_name : selectedFriend?.user1_name
  const friendAvatar = selectedFriend?.user_id_1 == currentUser?.id ? selectedFriend?.user2_avatar : selectedFriend?.user1_avatar

  //transaction context
  const { transactions, allUserBalances } = useTransaction()


  const [addFriendModal, setAddFriendModal] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [owe, setOwe] = useState<[]>([])
  const [owed, setOwed] = useState<[]>([])

  const [groupName, setGroupName] = useState<string>('')
  const [addGroupModal, setAddGroupModal] = useState<boolean>(false)

  const [allmembers, setAllmembers] = useState<GroupMemberInput[]>([])
  const [mybalance, setMyBalance] = useState<number>(0)

  // Group addition
  const createEmptyMember = (): GroupMemberInput => ({
    id: Date.now(),
    name: "",
    email: "",
    friendId: null,
  });

  const [members, setMembers] = useState<GroupMemberInput[]>([
    createEmptyMember(),
  ]);

  // Fetch Friends
  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends')
      setFriends(res.data)
    } catch (error) {
      console.log("Error fetching friends:", error)
    }
  }

  // Dashboard data fetch
  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/expenses/dashboard')
      setOwe(res.data.you_owe)
      setOwed(res.data.you_are_owed)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [refresh])

  // invite in group
  useEffect(() => {
    if (location.state && location.state.autoJoin) {
      const group = groups.find((g) => g.id === location.state.group_id)
      if (group) {
        handleGroupSelect(group)
      }
    }
  }, [groups])

  // fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get('/auth/me')
        setCurrentUser(res.data)
      } catch (err) {
        console.log(err)
      }
    }

    fetchCurrentUser()
  }, [])

  // fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('groups/my')
        setGroups(res.data)
      } catch (error) {
        console.error("Error fetching groups:", error)
      }
    }

    fetchGroups()
  }, [])


  //fetch Friends on load
  useEffect(() => {
    fetchFriends()
  }, [])

  //fetch all members
  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        const res = await api.get('/groups/allmembers')
        setAllmembers(res.data.members)
      } catch (error) {
        console.error("Error fetching group members:", error)
      }
    }

    fetchGroupMembers()
  }, [])

  //fetch my total balance
  useEffect(() => {
    const fetchMyBalance = async () => {
      try {
        const res = await api.get('/expenses/mytotalExpense')
        setMyBalance(res.data.balance)
      } catch (error) {
        console.log("Error fetching my balance:", error)
      }
    }

    fetchMyBalance()
  }, [])

  // Dashboard data on load
  useEffect(() => {
    fetchDashboardData()
  }, [])

  //handle group select
  const handleGroupSelect = async (group: Group) => {
    setSelectedGroup(group)
    setSelectedFriend(null)
    setSelectedExpense(null)
    setSelectedSettlement(null)
    setOpenExpenses(false)
    setShowGroupExpenses(false)
  }

  //handle friend select
  const handleFriendSelect = async (friend: Friend) => {
    setSelectedFriend(friend)
    setSelectedGroup(null)
    setSelectedExpense(null)
    setSelectedSettlement(null)
    setOpenExpenses(false)
    setOpenSettings(false)
    setShowFriendExpenses(false)
  }

  // Group creation
  const handleCreateGroup = async () => {
    const emails = members.map((member) => member.email.trim())
    const hasDuplicates = new Set(emails).size !== emails.length

    if (hasDuplicates) {
      alert("Duplicate members found. Please ensure each member has a unique email.")
      return
    }

    try {
      const res = await api.post('/groups/', { name: groupName.trim(), members: members })
      const newGroup: Group = res.data
      setGroups((prevGroups) => [...prevGroups, newGroup])
      setGroupName('')
      setMembers([createEmptyMember()])
      setAddGroupModal(false)
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Error creating group. Please ensure all fields are filled correctly.")
      setAddGroupModal(false)
    }
  }

  // Friend addition
  const handleCreateFriend = async () => {
    if (email.trim() === '') return;

    try {
      await api.post('/friends/add', { email: email.trim() })
      fetchFriends()
      setEmail('')
      setAddFriendModal(false)
    } catch (error: any) {
      console.log(error.response?.data?.detail || "Error adding friend")
      alert(error.response?.data?.detail || "Error adding friend")
      setEmail('')
      setAddFriendModal(false)
    }
  }

  //dashboard opening
  const handleDashboard = () => {
    setSelectedGroup(null)
    setSelectedFriend(null)
    setSelectedExpense(null)
    setOpenExpenses(false)
    fetchDashboardData()
  }

  //allExpenses opening
  const handleAllExpenses = () => {
    setSelectedGroup(null)
    setSelectedFriend(null)
    setSelectedExpense(null)
    setOpenExpenses(true)
  }

  //profile open
  const handleProfile = () => {
    navigate('/profile')
  }

  //logout
  const handleLogout = () => {
    localStorage.removeItem("access_token")
    navigate('/')
  }

  const handleRouteFriend = async (item: any) => {
      try{
         const res = await api.get(`/friends/${item.user_id}/route`)
         setSelectedFriend(res.data)
      } catch(err: any){
         console.log(err.response?.data?.detail || "Error routing to friend")
         alert(err.response?.data?.detail || "Error routing to friend")
      }
  }


  useEffect(() => {
    console.log("members", members)
  }, [members])

  return (
    <div className={`flex flex-col`}>

      <header className='flex justify-between pr-30 py-0.5 bg-emerald-500'>
        <div className="flex items-center gap-1 pl-17">
          <GiSplitCross className="text-2xl" />
          <h1 className='text-2xl font-bold'>Splitwise</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="cursor-pointer bg-transparent border-none hover:bg-black/10">
              {
                currentUser?.avatar_url ?
                  <img src={currentUser?.avatar_url} alt="User Avatar" className="h-6 w-6 rounded-full object-cover" /> :
                  <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold  text-emerald-400'>
                    {currentUser?.name?.charAt(0)?.toUpperCase()}
                  </div>
              }
              <span>{currentUser?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-black text-white">
            <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className={`bg-linear-to-br bg-[#0B0F0C] text-[#F8FAF9] h-screen id=dashboard flex`}>
        {/* Left space */}
        {
          <div className='w-1/5 h-screen flex flex-col gap-5 p-5 bg-[#1E2420]'>

            <div className='flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full cursor-pointer' onClick={handleDashboard}>
              <GiSplitCross className="text-2xl" />
              <h1 className='text-2xl font-bold'>Dashboard</h1>
            </div>

            <div className='flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full cursor-pointer' onClick={handleAllExpenses}>
              <IoIosList className="text-2xl" />
              <h1 className='text-2xl font-bold'>All Expenses</h1>
            </div>

            {/* Groups */}
            <div className=''>
              <div className="px-3 py-2 rounded-full flex justify-between bg-white/10">
                <h1 className='text-2xl font-bold'>Groups</h1>
                <RippleButton className='font-bold shrink-0 bg-emerald-500 hover:bg-[#16A34A] border-black  text-white text-xs rounded-full border' onClick={() => setAddGroupModal(true)}>+ Add</RippleButton>
              </div>

              <div className='flex flex-col p-2'>
                {
                  groups.length === 0 ? <div>You don't have any groups yet!</div> :

                    groups.map((group: Group) => (
                      <div key={group.id}
                        className={`flex gap-2 items-center hover:bg-white/10  
                           p-2 rounded-full cursor-pointer ${selectedGroup?.id === group.id ? 'text-emerald-300' : ''}`}
                        onClick={() => handleGroupSelect(group)}
                      >
                        <FaTag />
                        <h3 className='font-bold'>{group.name}</h3>
                      </div>
                    ))
                }
              </div>
            </div>

            {/* Friends */}
            <div className=''>
              <div className="px-3 flex justify-between bg-white/10 rounded-full py-2">
                <h1 className='text-2xl font-bold'>Friends</h1>
                <RippleButton className='font-bold shrink-0 bg-emerald-500 hover:bg-[#16A34A] border-black  text-white text-xs rounded-full border' onClick={() => setAddFriendModal(true)}>+ Add</RippleButton>
              </div>
              <div className='flex flex-col p-2'>
                {
                  friends.length === 0 ? <div>You do not have any friends yet!</div> :

                    friends.map((friend: Friend) => (
                      <div key={friend.id}
                        className={`flex gap-2 items-center hover:bg-white/10  p-2 rounded-full  cursor-pointer
                                    ${selectedFriend?.id === friend.id ? 'text-emerald-300' : ''}`}
                        onClick={() => handleFriendSelect(friend)}
                      >
                        <FaUser />
                        <h3 className='font-bold'>{friend.user_id_1 == currentUser?.id ? friend.user2_name : friend.user1_name}</h3>
                      </div>
                    ))
                }
              </div>
            </div>

            {/* Portal to add groups */}
            {addGroupModal &&
              createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setAddGroupModal(false)}>
                  <div
                    className="w-full max-w-lg rounded-2xl border border-white/8 bg-zinc-900/80 backdrop-blur-xl  shadow-2xl shadow-black/40  p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold tracking-tight text-white">
                        Start a group
                      </h1>
                    </div>

                    {/* Group name */}
                    <div className="mb-6 space-y-2">
                      <Label
                        htmlFor="group-name"
                        className="text-sm font-medium text-white/70"
                      >
                        Group name
                      </Label>

                      <Input
                        id="group-name"
                        placeholder="Enter group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="
                    h-11 rounded-xl
                    bg-white/4
                    border-white/8
                    text-white
                    placeholder:text-white/25
                    focus-visible:border-emerald-400/40
                    focus-visible:ring-2
                    focus-visible:ring-emerald-400/10
                "
                      />
                    </div>

                    {/* Members */}
                    <div className="space-y-3">

                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-white/70">
                          Members
                        </Label>
                      </div>

                      {/* Current user */}
                      <div
                        className="
                    flex items-center gap-3
                    rounded-xl
                    border border-white/8
                    bg-white/4
                    px-3 py-2.5
                "
                      >
                        <div
                          className="
                        flex h-8 w-8 shrink-0 items-center justify-center
                        rounded-full
                        bg-emerald-500/15
                        text-xs font-semibold
                        text-emerald-400
                    "
                        >
                          {currentUser?.name?.charAt(0)?.toUpperCase()}
                        </div>

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

                      {/* Added members */}
                      {members.map((member) => (
                        <MemberRow
                          key={member.id}
                          member={member}
                          allMembers={allmembers}
                          currentUser={currentUser}
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
                            setMembers((prev) =>
                              prev.filter((m) => m.id !== member.id)
                            );
                          }}
                        />
                      ))}

                      {/* Add person */}
                      <button
                        type="button"
                        onClick={() => {
                          setMembers((prev) => [
                            ...prev,
                            createEmptyMember(),
                          ]);
                        }}
                        className="
                    flex items-center gap-2
                    pt-1
                    text-sm
                    text-emerald-400/80
                    transition-colors
                    hover:text-emerald-300
                    "
                      >
                        <span className="text-lg leading-none">+</span>
                        Add a person
                      </button>
                    </div>

                    <Button
                      className="
                mt-7 w-full h-11 rounded-xl
                bg-emerald-500
                text-white font-semibold
                border border-emerald-400/20
                shadow-lg shadow-emerald-500/10
                hover:bg-emerald-400
                transition-all duration-200
                disabled:opacity-30 cursor-pointer
                "
                      disabled={
                        !groupName.trim() ||
                        members.some(
                          (member) =>
                            !member.name.trim() ||
                            !member.email.trim()
                        )
                      }
                      onClick={handleCreateGroup}
                    >
                      Create group
                    </Button>
                  </div>
                </div>, document.body
              )
            }

            {/* Portal to add friends */}
            {addFriendModal &&
              createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setAddFriendModal(false)}>
                  <div
                    className="w-full max-w-md p-8 flex flex-col justify-center items-center gap-5 rounded-3xl
                             border border-white/10 bg-zinc-900/80 backdrop-blur-xl
                             shadow-2xl shadow-black/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-full">
                      <h2 className="text-lg font-semibold text-white">
                        Add a friend
                      </h2>
                      <p className="mt-1 text-sm text-white/40">
                        Enter their email to send them an invite.
                      </p>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter friend's email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      name="email"
                      className="w-full rounded-xl border border-white/10
               bg-white/4 px-4 py-3 text-sm text-white
               placeholder:text-white/25 outline-none
               transition-all duration-200
               focus:border-emerald-400/50
               focus:bg-white/6
               focus:ring-2 focus:ring-emerald-400/10"
                    />

                    <RippleButton
                      className="w-full rounded-xl border border-emerald-400/20
               bg-emerald-500/90 py-3 font-semibold text-white
               shadow-lg shadow-emerald-500/10
               transition-all duration-200
               hover:bg-emerald-500
               active:scale-[0.98] cursor-pointer"
                      onClick={handleCreateFriend}
                    >
                      Send Invite
                    </RippleButton>
                  </div>
                </div>, document.body
              )
            }
          </div>
        }

        {/*Middle Space - group / dashboard / non-group-expences*/}
        <div className='w-3/5 h-screen p-5 flex flex-col bg-[#2d2d2d]'>
          {/* upper bar */}
          <div className={`flex justify-between items-center ${selectedGroup == null && selectedFriend == null ? 'border-b pb-2' : ''}`}>
            <div className='flex items-center gap-3'>
              {
                selectedGroup ?
                  selectedGroup.group_avatar ?
                    <img src={selectedGroup.group_avatar} alt="Group Avatar" className="h-10 w-10 rounded-full object-cover" />
                    :
                    <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold  text-emerald-400'>
                      <HiMiniRectangleGroup />
                    </div>
                  :
                  selectedFriend ?
                    friendAvatar ?
                      <img src={friendAvatar} alt="Group Avatar" className="h-10 w-10 rounded-full object-cover" />
                      :
                      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold  text-emerald-400'>
                        {friendName?.charAt(0)?.toUpperCase()}
                      </div>
                    :
                    ""
              }

              <h1 className='text-xl font-bold'>{selectedGroup ? selectedGroup.name : selectedFriend ?
                friendName : openExpenses ? 'All Expenses' : 'Dashboard'}</h1>

              {selectedFriend && selectedFriend.status == 'pending' && <p className="text-sm bg-yellow-100 text-black font-semibold rounded-xs px-1">Pending Invitation</p>}
            </div>


            {!openExpenses && <div className='flex gap-3'>
              <RippleButton className='font-bold bg-orange-400 text-white rounded-full text-xs h-10 hover:bg-orange-500 hover:text-black border-none' onClick={() => setAddExpenseModal(true)}>Add Expense</RippleButton>

              <RippleButton className='font-bold bg-emerald-500 text-white rounded-full text-xs h-10 hover:bg-emerald-600 hover:text-black border-none' onClick={() => setSettleUpModal(true)}>Settle Up</RippleButton>
            </div>}
          </div>

          {/* Main Content */}
          {selectedGroup && <Groups />}
          {selectedFriend && <FriendPage />}
          {openExpenses && <AllExpenses />}
          {
            selectedGroup === null && selectedFriend === null && openExpenses == false &&
            <div className="flex justify-between px-10 py-6 gap-6">
              {/* You Owe */}
              <div className="w-1/2 flex flex-col gap-4">
                <h2 className="text-gray-400 font-semibold text-xs tracking-widest">
                  YOU OWE
                </h2>

                {owe.length === 0 ? (
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                    <p className="text-sm text-white/40 text-center">
                      You do not owe anything!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {owe.map((item: any) => {
                      console.log("item", item)
                      return (
                        <div
                          className="flex items-center justify-between rounded-xl bg-white/5 border
                                     border-white/5 px-4 py-3 transition hover:bg-white/10 cursor-pointer"
                          onClick={() => handleRouteFriend(item)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold  text-emerald-400">
                              {item.avatar_url ?
                                <img src={item.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                                :
                                item.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <h3 className="text-white/90 font-medium text-sm">
                              {item.name}
                            </h3>
                          </div>

                          <p className="text-red-400 text-xs font-medium">
                            you owe ₹{item.amount}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px bg-white/10 self-stretch" />

              {/* You Are Owed */}
              <div className="w-1/2 flex flex-col gap-4">
                <h2 className="text-gray-400 font-semibold text-xs tracking-widest text-right">
                  YOU ARE OWED
                </h2>

                {owed.length === 0 ? (
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                    <p className="text-sm text-white/40 text-center">
                      You are not owed anything!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {owed.map((item: any) => {
                      console.log("item", item)
                      return (
                        <div
                          className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 
                                    px-4 py-3 transition hover:bg-white/10 cursor-pointer"
                          onClick={() => handleRouteFriend(item)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold  text-emerald-400">
                              {item.avatar_url ?
                                <img src={item.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                                :
                                item.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <h3 className="text-white/90 font-medium text-sm">
                              {item.name}
                            </h3>
                          </div>

                          <p className="text-green-400 text-xs font-medium">
                            owes you ₹{item.amount}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          }
        </div>

        {/* side bar */}
        <div className='w-1/5 h-screen p-6 flex flex-col bg-[#1E2420]'>
          {
            selectedGroup ?
              <div className='flex flex-col'>
                <div className="flex items-center gap-5 mb-3">
                  <h1 className='text-xl font-bold'>Group Balances</h1>
                  {
                    <Button variant="outline" size="icon" className="bg-emerald-500 border-none cursor-pointer"
                      onClick={() => setOpenSettings(true)}>
                      <IoIosSettings />
                    </Button>
                  }
                </div>
                {
                  groupMembers.length > 1 && groupMembers.map((member: any) => {
                    return (
                      <HoverCard key={"left"}>
                        <HoverCardTrigger>
                          <div className="flex items-center hover:bg-white/20 rounded-lg py-1">
                            <div className="p-2">
                              {
                                member.avatar_url ?
                                  <img src={member.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover" /> :
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold  text-emerald-400">
                                    {member.name?.charAt(0)?.toUpperCase()}
                                  </div>
                              }
                            </div>
                            <div className='flex flex-col px-2 py-1'>
                              <div className='flex items-center '>
                                {!member.registered && <IoIosWarning className="text-red-400 text-sm mr-1 inline" />}
                                <h3 className="font-semibold text-md">{member.name}</h3>
                              </div>
                              <p className={`text-xs ${allUserBalances[member.id] > 0 ? 'text-green-400' :
                                allUserBalances[member.id] < 0 ? 'text-red-400' : 'text-gray-400'}`}>

                                {allUserBalances[member.id] > 0 ? `gets back ${allUserBalances[member.id]}` :
                                  allUserBalances[member.id] < 0 ? `owes ${Math.abs(allUserBalances[member.id])}` :
                                    `settled up`
                                }
                              </p>
                            </div>
                          </div>
                        </HoverCardTrigger>

                        <HoverCardContent side={"left"} className="flex flex-col gap-2 bg-black text-white">
                          <div className="border-b border-gray-400">
                            <h3 className="font-semibold text-md">{member.name}</h3>
                            <p className="text-xs">{member.email}</p>
                            {member.registered === false && <p className="text-xs flex ">
                              <IoIosWarning className="text-sm mr-1 inline" />
                              <span> This person has been sent an invite but not claimed their account yet.</span>
                            </p>}
                          </div>
                          {
                            allUserBalances[member.id] > 0 ?
                              transactions.filter((t: any) => t.to_userid === member.id).map((t: any) => {
                                return <p>gets back <span className="text-green-400">{t.amount}</span> from {t.from}</p>
                              })
                              : allUserBalances[member.id] < 0 ?
                                transactions.filter((t: any) => t.from_userid === member.id).map((t: any) => {
                                  return <p>owes  <span className="text-red-400">{t.amount}</span> to {t.to}</p>
                                })
                                : <p>settled up</p>
                          }
                        </HoverCardContent>
                      </HoverCard>
                    )
                  })
                }
              </div>
              :
              selectedFriend ?
                <div className='flex flex-col gap-3'>
                  <div className="flex items-center gap-5 mb-3">
                    <h1 className='text-xl font-bold'>Your Balance</h1>
                    {
                      <Button variant="outline" size="icon" className="bg-emerald-500 border-none cursor-pointer"
                        onClick={() => setOpenSettings(true)}>
                        <IoIosSettings />
                      </Button>
                    }
                  </div>
                  <div className={`${allUserBalances[currentUser?.id!] > 0 ? 'text-green-400' : allUserBalances[currentUser?.id!] < 0 ? 'text-red-400' : 'text-gray-400'} text-xl font-semibold`}>
                    {
                      allUserBalances[currentUser?.id!] > 0 ?
                        <p>{friendName} owes you ₹{allUserBalances[currentUser?.id!]}</p> :
                        allUserBalances[currentUser?.id!] < 0 ?
                          <p>You owe {friendName} ₹{Math.abs(allUserBalances[currentUser?.id!])}</p> :
                          <p>You are all settled up!</p>
                    }
                  </div>
                </div>
                :
                openExpenses ?
                  <div>
                    <h1 className='text-xl font-bold'>Your Total Balance</h1>
                    <div className={`${mybalance > 0 ? 'text-green-400' : mybalance < 0 ? 'text-red-400' : 'text-gray-400'} text-xl font-semibold`}>
                      {
                        mybalance > 0 ?
                          <p>You are owed ₹{mybalance}</p> :
                          mybalance < 0 ?
                            <p>You owe ₹{Math.abs(mybalance)}</p> :
                            <p>You are all settled up!</p>
                      }
                    </div>
                  </div>
                  :
                  <div></div>
          }
        </div>

        {
          addExpenseModal && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setAddExpenseModal(false)}>
              <div onClick={(e) => e.stopPropagation()}>
                <AddExpenseModal />
              </div>
            </div>, document.body
          )
        }

        {
          settleUpModal && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setSettleUpModal(false)}>
              <div onClick={(e) => e.stopPropagation()}>
                <SettleUpModal setSettleUpModal={setSettleUpModal} />
              </div>
            </div>, document.body
          )
        }
      </div>
    </div>
  )
}

export default dashboard