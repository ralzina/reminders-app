const API_URL = import.meta.env.VITE_BACKEND_URL

export interface User {
    phone: string
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
    login: async (phone: string, password: string): Promise<AuthResponse> => {
      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ phone, password }),
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
  
    getReminders: async () => {
      const token = localStorage.getItem('souvenir_token');

      return fetch(`${API_URL}/api/reminders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
    },

    /**
     * Discard active session states
     */
    logout: async (): Promise<void> => {
      localStorage.removeItem('souvenir_user')
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
      } catch (error) {
        console.error('Failed to logout on server:', error);
      }
    },

    delete: async (): Promise<void> => {
        try {
            await fetch(`${API_URL}/api/auth/delete`, {
                method: 'DELETE',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    }
  };