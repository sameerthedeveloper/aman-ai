
import React from 'react';
import { Compass, Cpu, Play, Target, MessageSquare, Plus, Trash2, Settings } from 'lucide-react';
import type { AmanMode, Session } from '../types';
import { clsx } from 'clsx';

interface ModeSelectorProps {
    currentMode: AmanMode;
    sessions: Session[];
    currentSessionId: string | null;
    onSessionSelect: (id: string) => void;
    onNewSession: () => void;
    onDeleteSession: (id: string) => void;
    onSettingsClick: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
    currentMode,
    sessions,
    currentSessionId,
    onSessionSelect,
    onNewSession,
    onDeleteSession,
    onSettingsClick
}) => {
    const modes: { id: AmanMode; label: string; icon: React.FC<any> }[] = [
        { id: 'ALIGN', label: 'Align', icon: Target },
        { id: 'MODEL', label: 'Model', icon: Compass },
        { id: 'ACT', label: 'Act', icon: Cpu },
        { id: 'NAVIGATE', label: 'Navigate', icon: Play },
    ];

    // Sort sessions by timestamp desc (newest first)
    const sortedSessions = [...sessions].sort((a, b) => b.timestamp - a.timestamp);

    return (

        <div className="w-64 h-full border-r border-white/5 bg-[#0f1012] flex flex-col transition-all duration-300 relative group/sidebar font-sans">

            {/* Header / New Session */}
            <div className="p-3 mb-2 mt-24">
                <button
                    onClick={onNewSession}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-gray-200 border border-white/5 hover:border-white/10 group/btn"
                >
                    <div className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center group-hover/btn:bg-cyan-500/30 transition-colors">
                        <Plus className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span>New Session</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* Modes Section */}
                <div>
                    <div className="px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2 font-mono">Core Modes</div>
                    <div className="space-y-0.5">
                        {modes.map((mode) => {
                            const isActive = currentMode === mode.id;
                            const Icon = mode.icon;
                            return (
                                <div
                                    key={mode.id}
                                    className={clsx(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-default text-sm",
                                        isActive
                                            ? "bg-white/10 text-white font-medium"
                                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                                    )}
                                >
                                    <Icon className={clsx("w-4 h-4", isActive ? "text-cyan-400" : "text-gray-500")} />
                                    <span>{mode.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* History Section */}
                <div>
                    <div className="px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                        <span>Sessions</span>
                    </div>
                    <div className="space-y-0.5">
                        {sortedSessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSessionSelect(session.id)}
                                className={clsx(
                                    "group/item flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm overflow-hidden transition-all border border-transparent",
                                    currentSessionId === session.id
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "hover:bg-white/5 text-gray-400 hover:text-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <MessageSquare className={clsx("w-4 h-4 shrink-0 transition-colors", currentSessionId === session.id ? "text-cyan-400" : "text-gray-500")} />
                                    <span className="truncate max-w-[120px] text-[13px]">{session.title}</span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSession(session.id);
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-all text-gray-500"
                                    title="Delete Session"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {sortedSessions.length === 0 && (
                            <div className="px-3 py-8 text-xs text-gray-600 text-center italic border border-dashed border-white/5 rounded-lg">
                                No history yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-3 border-t border-white/5 bg-black/20">
                <div
                    onClick={onSettingsClick}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group/user"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-cyan-900/20">
                        OP
                    </div>
                    <div className="flex flex-col flex-1 gap-0.5">
                        <span className="text-sm font-medium text-gray-200 group-hover/user:text-white transition-colors">Operator</span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover/user:text-gray-400 transition-colors">
                            <Settings className="w-3 h-3" />
                            <span>Settings</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
