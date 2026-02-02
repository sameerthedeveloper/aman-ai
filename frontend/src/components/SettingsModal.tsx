import React, { useState } from 'react';
import { X, Settings, Database, Cpu, Globe, Trash2, Moon, Sun, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClearHistory: () => void;
    availableModels: string[];
    currentModel: string;
    onModelChange: (model: string) => void;
}

type Tab = 'general' | 'model' | 'data';

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    onClearHistory,
    availableModels = [],
    currentModel,
    onModelChange
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('general');

    if (!isOpen) return null;

    const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'model', label: 'Model Config', icon: Cpu },
        { id: 'data', label: 'Data Controls', icon: Database },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-[800px] h-[500px] bg-[#141416] border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden">

                {/* Sidebar */}
                <div className="w-56 bg-black/20 border-r border-white/5 p-4 flex flex-col gap-2">
                    <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2 font-mono">Settings</div>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            )}
                        >
                            <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-cyan-400" : "text-gray-500")} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 flex-1 overflow-y-auto">
                        <h2 className="text-2xl font-semibold text-white mb-1">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <div className="h-0.5 w-12 bg-cyan-500 mb-8 rounded-full"></div>

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between py-4 border-b border-white/5">
                                    <div>
                                        <div className="text-white font-medium">Appearance</div>
                                        <div className="text-sm text-gray-500">Choose your interface theme preference</div>
                                    </div>
                                    <div className="flex bg-black/30 p-1 rounded-lg border border-white/10">
                                        <button className="p-2 rounded-md bg-white/10 text-white shadow-sm transition-all">
                                            <Moon className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 rounded-md text-gray-500 hover:text-gray-300 transition-all">
                                            <Sun className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-4 border-b border-white/5">
                                    <div>
                                        <div className="text-white font-medium">Language</div>
                                        <div className="text-sm text-gray-500">Select interface language</div>
                                    </div>
                                    <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-cyan-500/50">
                                        <option>English (US)</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'model' && (
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">Default Model</label>
                                    <div className="relative">
                                        <select
                                            value={currentModel}
                                            onChange={(e) => onModelChange(e.target.value)}
                                            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-cyan-500/50 appearance-none"
                                        >
                                            {availableModels.length === 0 ? (
                                                <option disabled>Loading models...</option>
                                            ) : (
                                                availableModels.map(model => (
                                                    <option key={model} value={model}>{model}</option>
                                                ))
                                            )}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <Cpu className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Select the Ollama model to use for generation.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">Model Temperature</label>
                                    <input type="range" className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>Precise</span>
                                        <span>Creative</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">System Prompt Override</label>
                                    <textarea
                                        className="w-full h-32 bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-gray-300 focus:border-cyan-500/50 outline-none resize-none font-mono"
                                        placeholder="Enter custom instructions for AMAN-AI..."
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-start gap-4">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-yellow-200 font-medium mb-1">Local Storage Mode</div>
                                        <p className="text-sm text-yellow-500/80">All conversations are stored locally in your browser. Clearing your cache or history will lose your data.</p>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-white font-medium">Delete All Chats</div>
                                            <div className="text-sm text-gray-500">Permanently remove all session history</div>
                                        </div>
                                        <button
                                            onClick={onClearHistory}
                                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Empty Trash
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
