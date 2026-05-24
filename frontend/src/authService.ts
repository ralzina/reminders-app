const API_URL = import.meta.env.VITE_API_URL

export interface User {
    email: string
  }
  
  export interface AuthResponse {
    success: boolean
    user?: User
    error?: string
  }
  
  export const authService = {
    /**
     * Real Network Login Handler
     * Fires an asynchronous payload to your local backend API engine
     */
    login: async (email: string, password: string): Promise<AuthResponse> => {
      try {
        console.log(`${API_URL}`)
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
  
        const data = await response.json();
  
        if (response.ok && data.user) {
          // Store the real server-issued assets in the local browser state

          localStorage.setItem('souvenir_user', JSON.stringify(data.user))
          return { success: true, user: data.user };
        }
    
        return { success: false, error: data.error || 'Invalid credentials.' };
      } catch {
        return { success: false, error: 'Cannot connect to server.' };
      }
    },
  
    /**
     * Initial Session Hook Check
     * Inspects local storage to see if a valid token exists from a previous session
     */
    checkSession: (): User | null => {
      const savedUser = localStorage.getItem('souvenir_user')
      
      if (savedUser) {
        try {
          return JSON.parse(savedUser) as User
        } catch {
          return null
        }
      }
      return null
    },
  
    getReminders() {
        return fetch('/api/reminders', {
          method: 'GET', // Just reading data
          credentials: 'include' // Browser automatically attaches the cookie here!
                                 // No body, no password, no username needed.
        });
    },

    /**
     * Discard active session states
     */
    logout: (): void => {
      localStorage.removeItem('souvenir_user')
    }
  };