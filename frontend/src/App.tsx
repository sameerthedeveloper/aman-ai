import { useState, useRef, useEffect } from 'react';
import type { AmanMode, Message, Session } from './types';
import { ModeSelector } from './components/ModeSelector';
import { CommandInput } from './components/CommandInput';
import { MessageRenderer } from './components/MessageRenderer';
import { SettingsModal } from './components/SettingsModal';
import { clsx } from 'clsx';
import { User, Sparkles, Sidebar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derived state for current session
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  const mode = currentSession?.mode || 'ALIGN';
  const [isLoading, setIsLoading] = useState(false);

  // Model State
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('llama3');

  // --- Persistence & Initialization ---
  useEffect(() => {
    // 1. Load Sessions
    const savedSessions = localStorage.getItem('aman_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (parsed.length > 0) {
          setSessions(parsed);
          const mostRecent = parsed.sort((a: Session, b: Session) => b.timestamp - a.timestamp)[0];
          setCurrentSessionId(mostRecent.id);
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }

    // 2. Load Default Model
    const savedModel = localStorage.getItem('aman_model');
    if (savedModel) setCurrentModel(savedModel);

    // 3. Fetch Available Models
    fetch('http://localhost:8000/api/models')
      .then(res => res.json())
      .then(data => {
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          // If saved model is not in list, fallback to first available
          if (savedModel && !data.models.includes(savedModel)) {
            setCurrentModel(data.models[0]);
          }
        }
      })
      .catch(err => console.error("Failed to fetch models:", err));

  }, []);

  useEffect(() => {
    localStorage.setItem('aman_model', currentModel);
  }, [currentModel]);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('aman_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const scrollToBottom = () => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(scrollToBottom, [messages]);

  // --- Session Management ---
  const createNewSession = () => {
    const newSession: Session = {
      id: uuidv4(),
      title: 'New Chat',
      mode: 'ALIGN',
      messages: [],
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setSidebarOpen(false); // Close sidebar on mobile
  };

  const switchSession = (id: string) => {
    setCurrentSessionId(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteSession = (id: string) => {
    // Confirm deletion (optional, but good UX)
    if (!confirm("Are you sure you want to delete this session?")) return;

    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);

    // If we deleted the active session, switch to another or create new
    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        createNewSession();
      }
    }

    // Update LocalStorage immediately
    localStorage.setItem('aman_sessions', JSON.stringify(newSessions));
  };

  const updateCurrentSession = (updater: (session: Session) => Session) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => s.id === currentSessionId ? updater(s) : s));
  };

  // Helper to generate a title from the first user message
  const updateSessionTitle = (session: Session, input: string) => {
    if (session.messages.length === 0) {
      // Truncate input for title
      const title = input.length > 30 ? input.substring(0, 30) + '...' : input;
      return { ...session, title };
    }
    return session;
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to delete ALL history? This cannot be undone.")) {
      setSessions([]);
      setCurrentSessionId(null);
      localStorage.removeItem('aman_sessions');
      createNewSession();
      setIsSettingsOpen(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleCommand = async (input: string) => {
    if (!currentSessionId) return;

    // --- Client-Side Slash Commands ---
    if (input.trim() === '/new-session') {
      createNewSession();
      return;
    }
    if (input.trim() === '/list-sessions') {
      // Just showing in UI via sidebar is enough
      const listMsg: Message = {
        role: 'assistant',
        content: "Check the sidebar for the list of active sessions.",
        timestamp: Date.now()
      };
      updateCurrentSession(s => ({ ...s, messages: [...s.messages, listMsg] }));
      return;
    }
    // ----------------------------------

    // Optimistic Update
    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };

    // Update Session: Add user msg, update timestamp, set title if new
    updateCurrentSession(session => {
      const withMsg = { ...session, messages: [...session.messages, userMsg], timestamp: Date.now() };
      return updateSessionTitle(withMsg, input);
    });

    setIsLoading(true);

    let command = "/align"; // default
    if (!input.startsWith("/")) {
      command = "/" + mode.toLowerCase();
    } else {
      const parts = input.split(" ");
      command = parts[0];
    }

    // Abort Logic
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('http://localhost:8000/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          user_input: input,
          session_id: currentSessionId,
          history: historyPayload,
          model: currentModel
        }),
        signal: controller.signal
      });

      if (!res.ok) throw new Error("Connection failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Initialize assistant message
      const botMsg: Message = {
        role: 'assistant',
        content: '',
        mode: mode,
        timestamp: Date.now()
      };

      // Add empty bot message
      updateCurrentSession(s => ({ ...s, messages: [...s.messages, botMsg] }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === 'meta') {
              if (data.mode) {
                // Update mode
                updateCurrentSession(s => {
                  const newMsgs = [...s.messages];
                  const lastIndex = newMsgs.length - 1;
                  newMsgs[lastIndex] = {
                    ...newMsgs[lastIndex],
                    mode: data.mode
                  };
                  return { ...s, mode: data.mode, messages: newMsgs };
                });
              }
            } else if (data.type === 'chunk') {
              // Append Content
              updateCurrentSession(s => {
                const newMsgs = [...s.messages];
                const lastIndex = newMsgs.length - 1;
                newMsgs[lastIndex] = {
                  ...newMsgs[lastIndex],
                  content: newMsgs[lastIndex].content + data.content
                };
                return { ...s, messages: newMsgs };
              });
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Generation stopped by user");
      } else {
        console.error(error);
        const errorMsg: Message = { role: 'assistant', content: "Error: " + error, timestamp: Date.now() };
        updateCurrentSession(s => ({ ...s, messages: [...s.messages, errorMsg] }));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const isInitialState = messages.length === 0;

  return (
    <div className="flex h-screen bg-transparent text-gray-200 font-sans overflow-hidden relative">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={clearHistory}
        availableModels={availableModels}
        currentModel={currentModel}
        onModelChange={setCurrentModel}
      />

      {/* Sidebar Toggle (Top Left) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-12 left-4 z-50 p-2 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <Sidebar className="w-5 h-5" />
      </button>

      {/* Sidebar: Only visible if toggled */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-transparent"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 bg-[#0f1012] border-r border-white/10 animate-fade-in shadow-2xl h-full">
            <ModeSelector
              currentMode={mode}
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSessionSelect={switchSession}
              onNewSession={createNewSession}
              onDeleteSession={deleteSession}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col h-full relative transition-all duration-500">

        {/* INITIAL CENTRED STATE */}
        {isInitialState && (
          <div className="flex flex-col items-center justify-center h-full w-full px-4 animate-fade-in relative">
            {/* Geometric Centerpiece */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[150%] pointer-events-none opacity-20">
              <svg width="200" height="200" viewBox="0 0 100 100" className="text-gray-500 fill-current">
                <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <path d="M50 0 L50 100 M0 25 L100 75 M100 25 L0 75" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>

            <CommandInput
              onSubmit={handleCommand}
              isLoading={isLoading}
              centered={true}
              currentMode={mode}
              onStop={handleStop}
            />
          </div>
        )}

        {/* ACTIVE CHAT STATE */}
        {!isInitialState && (
          <>
            <div className="flex-1 overflow-y-auto px-4 md:px-0">
              <div className="max-w-3xl mx-auto pt-20 pb-32 space-y-12">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={idx}
                      className={clsx(
                        "group flex w-full",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={clsx(
                        "flex flex-col max-w-[85%] animate-fade-in",
                        isUser ? "items-end" : "items-start"
                      )}>

                        {/* Header / Icon */}
                        <div className={clsx(
                          "flex items-center gap-2 mb-2 opacity-50 text-xs uppercase tracking-wider",
                          isUser ? "flex-row-reverse" : "flex-row"
                        )}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center border border-white/10 bg-white/5">
                            {isUser ? <User className="w-3 h-3 text-gray-400" /> : <Sparkles className="w-3 h-3 text-cyan-400" />}
                          </div>
                          <span>{isUser ? 'You' : 'AMAN-AI'}</span>
                        </div>

                        {/* Content Bubble */}
                        <div className={clsx(
                          "relative p-4 rounded-2xl shadow-sm border",
                          isUser
                            ? "bg-[#27272a] border-white/5 text-gray-100 rounded-br-none"
                            : "bg-transparent border-transparent pl-0 pt-0" // AI messages keep the 'document' look but left-aligned
                        )}>
                          {isUser ? (
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                          ) : (
                            <MessageRenderer content={msg.content} />
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f1012] via-[#0f1012] to-transparent pt-12 pb-8 px-4 z-10">
              <CommandInput onSubmit={handleCommand} isLoading={isLoading} centered={false} currentMode={mode} onStop={handleStop} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
