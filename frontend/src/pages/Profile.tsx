import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import type { GroupMember } from '../context/group/groupcontext'
import api from "../api/axios"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"


const Profile = () => {

    const [currentUser, setCurrentUser] = useState<GroupMember | null>(null)
    const [name, setName] = useState<string>(currentUser?.name || "")
    const [email, setEmail] = useState<string>(currentUser?.email || "")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser?.avatar_url || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const navigate = useNavigate()

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

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || "")
            setEmail(currentUser.email || "")
            setAvatarUrl(currentUser.avatar_url || null)
        }

        console.log("Current user updated:", currentUser)
    }, [currentUser])

    const handleSaveChanges = async () => {
        const formData = new FormData()

        formData.append('name', name)
        formData.append('email', email)

        if(avatarFile) {
            formData.append('avatar', avatarFile)
        }

        try {
            const res = await api.put('/auth/update', formData)
            if (res.status === 200) {
                setCurrentUser(res.data.user)
                alert("Profile updated successfully!")
            }
        } catch (err: any) {
            console.error(err.response.data.detail)
        }
    }

    const handleGoBack = () => {
        setName(currentUser?.name || "")
        setEmail(currentUser?.email || "")
        setAvatarUrl(currentUser?.avatar_url || null)
        setAvatarFile(null)
        navigate('/dashboard')
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
            setAvatarFile(file)
        }
    }

    const handleRemove = () => {
        setAvatarFile(null)
        setAvatarUrl(null)
    }

    const previewUrl = avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F0D] px-4">
            <div className="w-full max-w-2xl rounded-xl border border-[#252B27] bg-[#141818] p-6 shadow-xl sm:p-8">

                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white">
                        Profile Settings
                    </h2>

                    <p className="mt-1 text-sm text-[#8B938E]">
                        Update your profile information.
                    </p>
                </div>

                <div className="flex flex-col gap-8 sm:flex-row">

                    <div className="flex flex-col items-center sm:w-40 sm:shrink-0">
                        <label
                            htmlFor="avatar"
                            className="group relative cursor-pointer"
                        >
                            {previewUrl? (
                                <img
                                    src={previewUrl}
                                    alt="Profile"
                                    className="h-32 w-32 rounded-full border border-[#303732] object-cover"
                                />
                            ) : (
                                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-[#303732] bg-[#252A27]">
                                    <span className="text-4xl font-medium text-gray-300">
                                        {name.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="text-sm font-medium text-white">
                                    Change
                                </span>
                            </div>

                            {previewUrl && 
                            (<button type="button" 
                            onClick={handleRemove} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#303632] bg-[#171B19] text-sm text-gray-400 shadow-md transition-colors hover:bg-red-500/10 hover:text-red-400" aria-label="Remove photo" >
                                ×
                            </button>)
                            }
                        </label>

                        <input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleAvatarChange(e)}
                        />

                        <p className="mt-3 text-xs text-[#737B76]">
                            Click to change photo
                        </p>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-8">

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-medium text-[#D5D9D6]"
                                >
                                    Name
                                </Label>

                                <Input
                                    type="text"
                                    id="name"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="border-[#303632] bg-[#0F1211] text-white placeholder:text-[#666E69] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-medium text-[#D5D9D6]"
                                >
                                    Email
                                </Label>

                                <Input
                                    type="email"
                                    id="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border-[#303632] bg-[#0F1211] text-white placeholder:text-[#666E69] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                                />

                                <p className="text-xs text-[#737B76]">
                                    This email is associated with your account.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 border-t border-[#252B27] pt-5">
                            <Button
                                className="bg-emerald-600 px-6 text-white hover:bg-emerald-500 cursor-pointer"
                                onClick={handleGoBack}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-emerald-600 px-6 text-white hover:bg-emerald-500 cursor-pointer"
                                onClick={handleSaveChanges}
                                disabled={!name || !email}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
