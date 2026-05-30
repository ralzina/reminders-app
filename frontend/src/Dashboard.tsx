import { authService } from './authService'
import type { User } from './authService'
import CreateReminder from './modules/CreateReminder';
import Reminders from './modules/Reminders';
import { useState, useEffect } from 'react';
import { reminderService} from './reminderService'
import type { Reminder } from './modules/Reminders'

interface DashboardProps {
    user: User;
    setUser: (user: User | null) => void;
  }

function Dashboard({ user, setUser }: DashboardProps) {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

    useEffect(() => {
        const fetchReminders = async () => {
            setError(null);
            try {
                const response = await reminderService.get();

                if (response.success && response.reminders) {
                    setReminders(response.reminders);
                }else if (response.error) {
                    setError(response.error)
                }
            }catch {
                setError('An unexpected error occurred.')
            }
        }

        fetchReminders();
    }, []);

    const handleNewReminder = (newReminder: any) => {
        setReminders(prevReminders => {
            const exists = prevReminders.some(reminder => reminder.id === newReminder.id);
        
            if (exists) {
                return prevReminders;
            }

            return [newReminder, ...prevReminders]
        });
        
    };

    return (<div className="w-full max-w-4xl text-center space-y-6 mt-40 mb-30 md:mb-40">
        <h1 className="text-3xl font-light text-zinc-900">
        Using Phone: <span className="font-normal">{user.phone}</span>
        </h1>
        <hr className="border-zinc-100" />

        <div>
            <CreateReminder 
                onReminderCreated={handleNewReminder}
                editingReminder={editingReminder}
                clearEdit={() => setEditingReminder(null)}
                setReminders={setReminders}     
            />
            <Reminders 
                reminders={reminders} 
                setReminders={setReminders} 
                error={error} 
                setError={setError}
                onEditClick={setEditingReminder}
                setUser={setUser}
            />
        </div>

        <div className="flex flex-col items-center gap-3">
        <button
        onClick={() => {
            authService.logout()
            setUser(null)
        }}
        className="text-lg tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors border-b border-zinc-200 hover:border-zinc-900 pb-0.5 mt-15"
        >
        Sign Out
        </button>

        <button
        onClick={() => {
            authService.delete()
            setUser(null)
        }}
        className="text-lg tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors border-b border-zinc-200 hover:border-zinc-900 pb-0.5"
        >
        Delete Account
        </button>
        </div>
        </div>
    )}

export default Dashboard