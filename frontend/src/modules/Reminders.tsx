import React, { useState, useEffect } from 'react';
import { reminderService } from '../reminderService';

export interface Reminder {
    id: string;
    user_id: string;
    reminder_text: string;
    start_date: string;
    is_periodic: boolean;
    weeks: number;
    days: number;
    hours: number;
    until: string
    created_at: string;
}

interface RemindersProps {
    reminders: Reminder[];
    setReminders: React.Dispatch<React.SetStateAction<any[]>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    onEditClick: (reminder: Reminder) => void;
}

export default function Reminders({ reminders, setReminders, error, setError, onEditClick }: RemindersProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(prevId => (prevId == id ? null: id ));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        });
    };

    return (
        <div className="w-full max-x-4xl mx-auto mt-8 px-4 text-left">
            <h2 className="text-lg font-medium text-zinc-900 mb-2">Reminders</h2>

            { error ? 
                ( 
                    <div> Error: {error} </div>
                ) : (
                    <div></div>
                )
            }

            {reminders.length === 0 ? (
                <div className="border border-dashed border-zinc-100  rounded-xl p-8 text-center">
                    No reminders scheduled yet. Fill out the form above to create your first one!
                </div>
            ) : (
                <div className="bg-white border  rounded-xl shadow-sm overflow-hidden divide-y divide-zinc-100 border border-zinc-300">
                    {reminders.map((reminder) => {
                        const isExpanded = expandedId === reminder.id;

                        return (
                            <div key={reminder.id} className="transition-colors duration-150 hover:/50">
                                <button
                                    onClick={() => toggleExpand(reminder.id)}
                                    className="w-full text-left p-4 flex items-center justify-between gap-4 focus:outline-none"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <span className={`text-zinc-900 font-mono text-sm transition-transform duration-200 block transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
                                            ▶
                                        </span>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-semibold text-zinc-900 bg-zinc-100 px-2 py-1 rounded-md">
                                            <span>{formatDate(reminder.start_date)}</span>
                                        </div>

                                        {reminder.is_periodic && (
                                            <div className="flex items-center text-xs font-medium text-zinc-600 bg-zinc-50 border-zinc-100 px-2 py-0.5 rounded-full shrink-0">
                                                Periodic 
                                            </div>
                                        )}

                                        <p className="text-sm font-medium text-zinc-700 min-w-0 flex-1 truncate">
                                            <span className="font-semibold text-zinc-400 mr-1">Text:</span>
                                            {reminder.reminder_text}
                                        </p>
                                    </div>
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 /70 ${
                                        isExpanded ? 'max-h-96 border-t border-zinc-100 p-5' : 'max-h-0'
                                    }`}
                                >
                                    <div className="pl-8 space-y-4">
                                        <div>
                                            <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900 mb-1">Full Description</h4>
                                            <p className="text-zinc-700 text-sm whitespace-pre-wrap leading-relaxed">
                                                {reminder.reminder_text}
                                            </p>
                                        </div>

                                        {reminder.is_periodic && (
                                        <div className="bg-white border border-zinc-300 rounded-lg p-3 max-w-sm">
                                            <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-2">Recurrence Window</h4>
                                            <div className="grid grid-cols-3 text-center gap-2 mb-3">
                                            <div className=" p-2 rounded border border-zinc-100">
                                                <span className="block text-lg font-bold text-zinc-700">{reminder.weeks}</span>
                                                <span className="text-[10px] text-zinc-400 uppercase font-medium">Weeks</span>
                                            </div>
                                            <div className=" p-2 rounded border border-zinc-100">
                                                <span className="block text-lg font-bold text-zinc-700">{reminder.days}</span>
                                                <span className="text-[10px] text-zinc-400 uppercase font-medium">Days</span>
                                            </div>
                                            <div className=" p-2 rounded border border-zinc-100">
                                                <span className="block text-lg font-bold text-zinc-700">{reminder.hours}</span>
                                                <span className="text-[10px] text-zinc-400 uppercase font-medium">Hours</span>
                                            </div>
                                            </div>
                                            <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Until</h4>
                                            <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-semibold text-zinc-900 px-2 py-1 rounded-md">
                                                <span>{formatDate(reminder.start_date)}</span>
                                            </div>
                                        </div>
                                        )}

                                        <div className="flex items-center gap-3 pt-2">
                                            <button 
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-600 bg-white border  hover:shadow-sm hover:bg-zinc-200 transition-colors"
                                                onClick = {() => onEditClick(reminder)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-600 bg-white border  hover:shadow-sm hover:bg-zinc-200 transition-colors"
                                                onClick={async () => {
                                                    try {
                                                        setError(null);

                                                        const response = await reminderService.delete(reminder.id)
                                            
                                                        if (response.success) {
                                                            const reminderIdToDelete = reminder.id;
                                                            setReminders((prevReminders) => {
                                                                return prevReminders.filter((reminder) => reminder.id != reminderIdToDelete);
                                                            })
                                                        }else if (response.error){
                                                            setError(response.error)
                                                        }
                                                    } catch {
                                                        setError('An unexpected error occurred')
                                                    }                                                  
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
        </div>
    );
}