import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { authService } from './authService'
import type { User } from './authService'

interface LoginProps {
    onAuthSuccess: (user: User) => void
}

function Login({ onAuthSuccess }: LoginProps){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSignIn = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        console.log('Authenticating with:', { email, password })

        if (email == null){
            alert('Please enter your email or your phone number to receive notifications')
        }else if (password.length < 8){
            alert('Password must be at least 8 characters long')
        }else{
            console.log('Passed initial check.')
            setIsLoading(true)

            try {
                const response = await authService.login(email, password)

                if (response.success && response.user) {
                    onAuthSuccess(response.user)
                }else if (response.error) {
                    setError(response.error)
                }
            }catch {
                setError('An unexpected error occurred.')
            }finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
        {/* 1. Header Typography block */}
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-zinc-900">
            Sign In
            </h2>
            <p className="mt-3 text-md md:text-lg text-zinc-500 italic font-light tracking-wide">
            “A place for the things you cannot forget.”
            </p>
        </div>

        { error ? 
            ( 
                <div> Error: {error} </div>
            ) : (
                <div></div>
            )
        }

        {/* 2. Authentication Form */}
        <form onSubmit={handleSignIn} className="space-y-8">
            {/* Input Fields Row: stacks 1 col on mobile, switches to 3 side-by-side columns on medium screens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Email Input */}
            <div>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-4 py-3 bg-white border border-zinc-400 rounded-lg text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                />
            </div>

            {/* Password Input */}
            <div>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 bg-white border border-zinc-400 rounded-lg text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                />
            </div>

            </div>

            {/* 3. Actions Area */}
            <div className="flex justify-center mt-4">
            <button
                type="submit"
                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-700 text-white font-medium text-sm rounded-lg tracking-wider transition-colors duration-150 shadow-sm"
            >
                Log In
            </button>
            </div>
        </form>
        </div>
    )
}

export default Login