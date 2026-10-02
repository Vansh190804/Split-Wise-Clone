import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get("invite_token");
    const friendInvite = searchParams.get('friend_invite');

    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://127.0.0.1:8000/auth/register",
                { 'name': name, 'email': email, 'password': password })

            const { access_token } = res.data

            localStorage.setItem("access_token", access_token)

            if (inviteToken) {
                try {
                    const response = await api.post(`/invites/register/${inviteToken}`)
                    if (response.status == 200) {
                        navigate('/dashboard', {
                            state: {
                                autoJoin: true,
                                inviteToken: inviteToken,
                                group_id: response.data.group_id
                            }
                        })
                    }
                } catch (error: any) {
                    console.error(error.response.data.detail)
                }
            }
            else if (friendInvite) {
                try {
                    const response = await api.post(`/friends/accept-invite/${friendInvite}`)
                    if (response.status == 200) {
                        navigate('/dashboard')
                    }
                } catch (error: any) {
                    console.error(error.response.data.detail)
                }
            }
            else {
                navigate("/dashboard")
            }
        } catch (error) {
            console.error("Registration error:", error);
        }
    };

    const onSwitch = () => {
        console.log("Switch to Login");
        if (inviteToken) {
            navigate(`/login?invite_token=${inviteToken}`)

        }
        else if (friendInvite) {
            navigate(`/login?friend_invite=${friendInvite}`)
        }
        else {
            navigate("/login");
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0B0F0D] px-4 text-white">

            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="relative flex min-h-screen items-center justify-center">

                <div className="w-full max-w-md">

                    <div className="mb-8 text-center">
                        <button
                            onClick={() => navigate("/")}
                            className="text-xl font-bold tracking-tight text-white"
                        >
                            Splitwise
                        </button>

                        <h1 className="mt-6 text-3xl font-bold tracking-tight">
                            Create your account
                        </h1>

                        <p className="mt-2 text-sm text-white/40">
                            Start splitting expenses with friends and family.
                        </p>
                    </div>


                    <div className="rounded-2xl border border-white/10 bg-[#141816] p-6 shadow-2xl sm:p-8">

                        <form
                            onSubmit={(e) => handleRegister(e)}
                            className="space-y-4"
                        >

                            <div>
                                <label className="mb-2 block text-xs font-medium text-white/60">
                                    Full name
                                </label>

                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border border-[#292F2B] bg-[#0F1211] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-medium text-white/60">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-[#292F2B] bg-[#0F1211] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-medium text-white/60">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-[#292F2B] bg-[#0F1211] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                                />
                            </div>


                            <button
                                type="submit"
                                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 active:scale-[0.99] cursor-pointer"
                            >
                                Create account
                            </button>

                        </form>


                        <p className="mt-7 text-center text-sm text-white/40">
                            Already have an account?{" "}
                            <button
                                onClick={onSwitch}
                                className="font-medium text-emerald-400 transition hover:text-emerald-300 cursor-pointer"
                            >
                                Log in
                            </button>
                        </p>

                    </div>

                    <p className="mt-6 text-center text-xs text-white/20">
                        Split expenses. Stay even.
                    </p>

                </div>
            </div>
        </div>
    );
}