/* The Dashboard Canvas */
import { authService } from './authService'
import type { User } from './authService'

interface DashboardProps {
    user: User;
    setUser: (user: User | null) => void;
  }

function Dashboard({ user, setUser }: DashboardProps) {
return (<div className="w-full max-w-4xl text-center space-y-6">
    <h1 className="text-3xl font-light text-zinc-900">
    Welcome, <span className="font-normal">{user.email}</span>
    </h1>
    <p className="text-zinc-400 text-sm italic">
    Dashboard view placeholder. Your reminder management canvas initializes here.
    </p>
    <button
    onClick={() => {
        authService.logout()
        setUser(null)
    }}
    className="text-xs tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors border-b border-zinc-200 hover:border-zinc-900 pb-0.5"
    >
    Sign Out
    </button>
    </div>
)}

export default Dashboard