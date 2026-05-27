const API_URL = import.meta.env.VITE_API_URL

export interface ReminderFrequency {
    weeks: number;
    days: number;
    hours: number;
}

export interface ReminderPayload {
    text: string;
    startDate: string;
    isPeriodic: boolean;

    period: ReminderFrequency | null;
    until: string | null;
}

export const reminderService = {
    submit: async (payload: ReminderPayload) => {
        try {
            const { text, startDate, isPeriodic, period, until } = payload

            const response = await fetch(`${API_URL}/api/reminders`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ text, startDate, isPeriodic, period, until }),
            });
      
            const data = await response.json();
      
            if (response.ok && data.reminder) {
              return { success: true, reminder: data.reminder };
            }
            return { success: false, error: data.error || 'Invalid request.' };
        } catch {
            return { success: false, error: 'Cannot connect to server.' };
        }
    },

    get: async () => {
        try {
            const response = await fetch(`${API_URL}/api/reminders`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
            });
      
            const data = await response.json();
      
            if (response.ok && data.reminders) {
              return { success: true, reminders: data.reminders };
            }
            return { success: false, error: data.error || 'Invalid request.' };
        } catch {
            return { success: false, error: 'Cannot connect to server.' };
        }
    },

    delete: async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/reminders/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            })

            if (response.ok) {
                return { success: true };
            }
            return { success: false, error: "Couldn't delete request." };
        } catch {
            return { success: false, error: 'Cannot connect to server.' };
        }
    },

    put: async (payload: ReminderPayload, id: string) => {
        try {
            const { text, startDate, isPeriodic, period, until } = payload
            const response = await fetch(`${API_URL}/api/reminders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ text, startDate, isPeriodic, period, until }),
            })

            const data = await response.json()

            if (response.ok && data.reminder) {
                return { success: true, reminder: data.reminder };
              }
              return { success: false, error: data.error || 'Invalid request.' };
          } catch {
              return { success: false, error: 'Cannot connect to server.' };
          }
    }
}