import { useState, useEffect } from 'react';
import type { SubmitEvent } from 'react';
import { reminderService } from '../reminderService'
import type { ReminderPayload } from '../reminderService';
import type { Reminder } from './Reminders'

interface CreateReminderProps {
    onReminderCreated: (newReminder: any) => void; // refresh list
    editingReminder: Reminder | null;
    clearEdit: () => void;
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
}

interface SubmitResponse {
    success: boolean;
    reminder?: Reminder;
    error?: string;
}

function CreateReminder({ onReminderCreated, editingReminder, clearEdit, setReminders }: CreateReminderProps) {
    const [text, setText] = useState('');
    const [startDate, setStartDate] = useState('')
    const [isPeriodic, setIsPeriodic] = useState(false);
    const [error, setError] = useState<string | null>(null)

    // Recurrence states
    const [weeks, setWeeks] = useState(0);
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);
    const [until, setUntil] = useState('')

    const resetState = (response: SubmitResponse) => {
        setText('');
        setStartDate('');
        setIsPeriodic(false);
        setWeeks(0);
        setDays(0);
        setHours(0);
        setUntil('');
        onReminderCreated(response.reminder);
    };

    useEffect(() => {
        if (editingReminder) {
            setText(editingReminder.reminder_text);
            setStartDate(editingReminder.start_date ? String(editingReminder.start_date).substring(0, 16) : '');           
            setIsPeriodic(editingReminder.is_periodic);
            setWeeks(editingReminder.weeks || 0);
            setDays(editingReminder.days || 0);
            setHours(editingReminder.hours || 0);
            setUntil(editingReminder.until ? String(editingReminder.until).substring(0, 16) : '');
        } else {
            setText('');
            setStartDate('');
            setIsPeriodic(false);
            setWeeks(0);
            setDays(0);
            setHours(0);
            setUntil('');
        }
    }, [editingReminder]);

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null)

        if (!text || !startDate) return alert('Please provide a reminder and a date');

        if (isPeriodic && weeks === 0 && days === 0 && hours === 0) {
            alert("Please specify how often this reminder should repeat (weeks, days, or hours)!");
            return;
        }

        const now = new Date();
        const start = new Date(startDate);
        const end = (isPeriodic && until.trim() !== '') ? new Date(until) : null;

        if (isPeriodic && until) {    
            if (end <= start) {
                alert("Validation Error: The 'Until' expiration date must happen AFTER the start date and time!");
                return;
            }
        }

        now.setSeconds(0);
        now.setMilliseconds(0);

        if (start <= now) {
            alert("Validation Error: the reminder must be set in the futrue!");
            return;
        }

        const utc_start = start.toISOString();
        const utc_until = (isPeriodic && until.trim() !== '' && end) ? end.toISOString() : null;
        
        if (editingReminder) {
            const payload: ReminderPayload = {
                text,
                startDate: utc_start,
                isPeriodic,
                period: isPeriodic ? { weeks, days, hours } : null,
                until: isPeriodic ? utc_until : null,
            };
    
            console.log('Sending reminder package:', payload);
            try {
                const response = await reminderService.put(payload, editingReminder.id)

                if (response.success) {
                    clearEdit()
                    if (response.reminder){
                        setReminders((prev) => 
                            prev.map((item) => item.id === editingReminder.id ? (response.reminder || item) : item)                        
                    );
                    }else{
                        alert('Updated reminder but failed to load. Refresh page.')
                    }
                }else if (response.error){
                    setError(response.error)
                }
            } catch {
                setError('An unexpected error occurred')
            }
        } else {
            const payload: ReminderPayload = {
                text,
                startDate: utc_start,
                isPeriodic,
                period: isPeriodic ? { weeks, days, hours } : null,
                until: isPeriodic ? utc_until : null,
            };
    
            console.log('Sending reminder package:', payload);

            try {
                const response = await reminderService.submit(payload)

                if (response.success) {
                    resetState(response)
                    if (response.reminder){
                        onReminderCreated(response.reminder)
                    }else{
                        alert('Created reminder but failed to load. Refresh page.')
                    }
                }else if (response.error){
                    setError(response.error)
                }
            } catch {
                setError('An unexpected error occurred')
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto text-left bg-white p-6  space-y-4">
            <h2 className="text-lg font-medium text-zinc-900 mb-2">Create a New Reminder</h2>

            { error ? 
                ( 
                    <div> Error: {error} </div>
                ) : (
                    <div></div>
                )
            }

            {/* Reminder Text */}
            <div className="flex flex-col space-y-1">
                <label className="text-xs uppercase tracking-wider text-zinc-400">Reminder Text</label>
                <input 
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g., Email professor about homework"
                    className="border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
                />
            </div>

            {/* Start Time */}
            <div className="flex flex-col space-y-1">
                <label className="text-xs uppercase tracking-wider text-zinc-400">Set Date & Time</label>
                <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
                />
            </div>

            {/* Toggle Periodic Option */}
            <div className="flex items-center space-x-2 pt-2">
                <input
                    type="checkbox"
                    id="periodic"
                    checked={isPeriodic}
                    onChange={(e) => setIsPeriodic(e.target.checked)}
                    className="accent-zinc-900"
                />
                <label htmlFor="periodic" className="text-sm text-zinc-600 select-none cursor-pointer">
                    Periodic Reminder (Repeats continuously)    
                </label>
            </div>

            {/* Conditional Recurrence Intervals*/}
            {isPeriodic && (
                <div className="w-full max-w-4xl mx-auto text-left bg-white p-6  space-y-4">
                <div className="bg=zinc-60 p-4 rounded border border-zinc-100 grid grid-cols-3 gap-3 animate-fade-in">
                    <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400">Every X Weeks</label>
                        <input
                            type="number" min="0" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}
                            className="brder border-zinc-200 rounded px-2 py-1 text-sm bg-white"
                        />
                    </div>
                    <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400">Every X Days</label>
                        <input
                            type="number" min="0" value={days} onChange={(e) => setDays(Number(e.target.value))}
                            className="brder border-zinc-200 rounded px-2 py-1 text-sm bg-white"
                        />
                    </div>
                    <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400">Every X Hours</label>
                        <input
                            type="number" min="0" value={hours} onChange={(e) => setHours(Number(e.target.value))}
                            className="brder border-zinc-200 rounded px-2 py-1 text-sm bg-white"
                        />
                    </div>
                    
                </div>
                <div className="flex flex-col space-y-1">
                <label className="text-xs uppercase tracking-wider text-zinc-400">Until (optional)</label>
                <input
                    type="datetime-local"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                    className="border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-950"
                />
            </div>
                </div>
            )}

            <button
                type="submit"
                className="w-full mt-2 bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-medium tracking-wider uppercase py-2.5 rounded transition-colors"
            >
                Save Reminder
            </button>
        </form>
    );
}

export default CreateReminder