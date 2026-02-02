
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Search, Infinity, Globe, Paperclip, Mic, Image, Monitor, Cpu, Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';
import type { AmanMode } from '../types';

interface CommandInputProps {
    onSubmit: (command: string) => void;
    isLoading: boolean;
    centered?: boolean;
    currentMode?: AmanMode;
    onModeChange?: (mode: AmanMode) => void;
    onStop?: () => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onSubmit, isLoading, centered = false, currentMode, onModeChange, onStop }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isLoading) {
            onStop?.();
            return;
        }
        if (!input.trim()) return;
        onSubmit(input);
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    return (
        <div className={clsx(
            "transition-all duration-500 ease-in-out w-full mx-auto",
            centered ? "max-w-2xl" : "max-w-3xl"
        )}>
            <div className={clsx(
                "relative bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 focus-within:ring-1 focus-within:ring-white/20",
                centered ? "p-4" : "p-3"
            )}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {/* Input Area */}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isLoading ? "Generating response..." : "Ask anything..."}
                        disabled={false} // Keep enabled to allow typing next query, but maybe blocking submit is better? ChatGPT allows typing.
                        rows={1}
                        className="w-full bg-transparent text-gray-200 placeholder:text-gray-500 text-lg resize-none focus:outline-none min-h-[40px] max-h-[200px] leading-relaxed px-1"
                    />

                    {/* Bottom Controls */}
                    <div className="flex items-center justify-between pt-2">
                        {/* Left: Mode Toggles */}
                        <div className="flex items-center gap-1">
                            <button type="button" className={clsx("p-2 rounded-lg hover:bg-white/5 transition-colors group", currentMode === 'ALIGN' && "bg-white/10 text-cyan-400")} title="Focus Search">
                                <Search className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                            </button>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            <div className="w-px h-4 bg-white/10 mx-1"></div>

                            {/* SEND / STOP BUTTON */}
                            <button
                                type="submit"
                                className={clsx(
                                    "p-2 rounded-full transition-colors group flex items-center justify-center",
                                    isLoading ? "bg-white text-black hover:bg-gray-200" : "bg-white/10 hover:bg-white/20"
                                )}
                            >
                                {isLoading ? (
                                    <div className="w-3 h-3 bg-black rounded-sm" /> // Stop Icon
                                ) : (
                                    <ArrowRight className="w-4 h-4 text-gray-200" />
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
