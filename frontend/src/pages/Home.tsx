import { GiSplitCross } from "react-icons/gi"
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-[#0B0F0D] text-white">

            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-5 lg:px-16">

                <div className="flex gap-2 items-center text-xl font-bold tracking-tight">
                    <GiSplitCross className="text-2xl" />
                    Splitwise
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/login")}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white cursor-pointer"
                    >
                        Log in
                    </button>

                    <button
                        onClick={() => navigate("/register")}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 cursor-pointer"
                    >
                        Sign up
                    </button>
                </div>
            </nav>


            {/* Hero */}
            <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-8 py-16 lg:px-16">
                <div className="grid w-full items-center gap-16 lg:grid-cols-2">

                    {/* Left */}
                    <div>
                        <div className="mb-6 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                            Simplifying debts
                        </div>

                        <h1 className="max-w-xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
                            Split expenses.
                            <span className="block text-emerald-400">
                                Stay even.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-lg text-base leading-7 text-white/50">
                            Splitwise makes it easy to keep track of shared expenses
                            with friends, family, and groups. Add expenses, see who
                            owes whom, and settle up without doing the math yourself.
                        </p>

                        <div className="mt-8 flex items-center gap-4">
                            <button
                                onClick={() => navigate("/register")}
                                className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 cursor-pointer"
                            >
                                Get Started
                            </button>

                            <button
                                onClick={() => navigate("/login")}
                                className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer"
                            >
                                Log in
                            </button>
                        </div>
                    </div>


                    {/* Right - simple expense preview */}
                    <div className="hidden lg:block">
                        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#141816] p-5 shadow-2xl">

                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        Weekend Trip
                                    </p>
                                    <p className="mt-1 text-xs text-white/40">
                                        4 members
                                    </p>
                                </div>

                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                                    Settled
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 p-4">
                                    <div>
                                        <p className="text-sm text-white/80">
                                            Hotel
                                        </p>
                                        <p className="mt-1 text-xs text-white/30">
                                            You paid
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-white">
                                        ₹4,800
                                    </p>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 p-4">
                                    <div>
                                        <p className="text-sm text-white/80">
                                            Dinner
                                        </p>
                                        <p className="mt-1 text-xs text-white/30">
                                            Rahul paid
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-white">
                                        ₹2,400
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-white/10 pt-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/40">
                                        Your balance
                                    </span>
                                    <span className="text-lg font-semibold text-emerald-400">
                                        + ₹1,200
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>


            <section className="border-t border-white/5 bg-[#0F1311]">
                <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-white/5 px-8 py-8 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-16">

                    <div className="px-6 py-3 text-center sm:text-left">
                        <p className="text-sm font-semibold text-white">
                            Track expenses
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            Keep every shared expense in one place.
                        </p>
                    </div>

                    <div className="px-6 py-3 text-center sm:text-left">
                        <p className="text-sm font-semibold text-white">
                            See who owes
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            Know exactly where you stand.
                        </p>
                    </div>

                    <div className="px-6 py-3 text-center sm:text-left">
                        <p className="text-sm font-semibold text-white">
                            Settle up
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            Clear balances without the headache.
                        </p>
                    </div>

                </div>
            </section>

        </div>
    )
}

export default Home


