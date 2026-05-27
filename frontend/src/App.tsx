import { useState, useEffect } from 'react'
import Header from './Header'
import Login from './Login'
import { authService } from './authService'
import type { User } from './authService'
import Dashboard from './Dashboard'

function App() {
  // 1. We must declare these states so that 'setUser' actually exists 
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  // 2. Check localStorage on boot to see if a user session is active
  useEffect(() => {
    const activeUser = authService.checkSession()
    if (activeUser) {
      setUser(activeUser)
    }
    setIsCheckingSession(false)
  }, [])

  // Verifying the session status
  if (isCheckingSession) {
    return <div className="min-h-screen bg-white" />
  }

  return (
    <div className="min-h-screen w-full bg-white antialiased flex flex-col items-center justify-center relative font-light">
      <Header />
      
      <main className="w-full flex items-center justify-center px-4">
        {user ? (
          <Dashboard user={user} setUser={setUser} />
        ) : (
          <Login onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
        )}
      </main>
    </div>
  )
}

export default App