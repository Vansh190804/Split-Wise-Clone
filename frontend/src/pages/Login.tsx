import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get("invite_token");
    const friendInvite = searchParams.get('friend_invite')

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        if (!email || !password) {
            alert("Please fill in both email and password fields.");
            return;
        }
        e.preventDefault()
        try {
            const res = await axios.post("http://127.0.0.1:8000/auth/login",
                { 'email': email, 'password': password })

            const { access_token } = res.data
            localStorage.setItem("access_token", access_token)

            if (inviteToken) {
                try {
                    const response = await api.post(`invites/join/${inviteToken}`)
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
                    switch (error.response?.status) {
                        case 404:
                            console.error(error.response.data.detail)
                            break

                        default:
                            console.error(error.response?.data?.detail || "An error occurred")
                            break
                    }
                }
            }
            else if (friendInvite) {
                try {
                    const response = await api.post(`/friends/accept-invite/${friendInvite}`)
                    if (response.status == 200) {
                        navigate('/dashbaord')
                    }
                } catch (error: any) {
                    console.log(error.response.data.detail)
                }
            }
            else {
                navigate("/dashboard")
            }
        } catch (error) {
            console.error("Login error:", error);
        }
    }

    const handleLoginWithGoogle = async () => {
        window.location.href = `http://localhost:8000/auth/google/login?group_invite=${inviteToken || null}&friend_invite=${friendInvite || null}`;
    }

    const onSwitch = () => {
        console.log("Switch to Register");
        if (inviteToken) {
            navigate(`/register?invite_token=${inviteToken}`)
        }
        else if (friendInvite) {
            navigate(`/register?friend_invite=${friendInvite}`)
        }
        else {
            navigate("/register");
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
                            Welcome back
                        </h1>

                        <p className="mt-2 text-sm text-white/40">
                            Log in to manage your expenses and balances.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#141816] p-6 shadow-2xl sm:p-8">

                        <form
                            onSubmit={(e) => handleLogin(e)}
                            className="space-y-4"
                        >
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
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-[#292F2B] bg-[#0F1211] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 active:scale-[0.99] cursor-pointer"
                            >
                                Log in
                            </button>
                        </form>


                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-xs text-white/30">
                                OR
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>


                        <button
                            onClick={handleLoginWithGoogle}
                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#303632] bg-[#0F1211] py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5 hover:text-white cursor-pointer"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fill="#4285F4"
                                    d="M21.35 12.27c0-.71-.06-1.4-.18-2.05H12v3.88h5.22a4.46 4.46 0 0 1-1.94 2.93v2.42h3.14c1.84-1.7 2.93-4.2 2.93-7.18z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.42c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.5A9.74 9.74 0 0 0 12 21.5z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M6.54 13.62A5.85 5.85 0 0 1 6.23 12c0-.56.1-1.1.31-1.62v-2.5H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.38l3.25-2.76z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 6.35c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.45 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.71 5.38l3.25 2.5C7.31 8.07 9.46 6.35 12 6.35z"
                                />
                            </svg>

                            Continue with Google
                        </button>


                        <p className="mt-7 text-center text-sm text-white/40">
                            Don't have an account?{" "}
                            <button
                                onClick={onSwitch}
                                className="font-medium text-emerald-400 transition hover:text-emerald-300 cursor-pointer"
                            >
                                Sign up
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