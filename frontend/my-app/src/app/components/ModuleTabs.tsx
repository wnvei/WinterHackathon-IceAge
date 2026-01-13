/// <reference types="vite/types/importMeta.d.ts" />

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, X, BookOpen, FileText, ChevronDown,
  AlertCircle, Star, MessageCircle, BookMarked, Layers,
  Lightbulb, CheckCircle2, Info, FilterX, Minus, Square, Maximize2,
  Sparkles, Timer, Play, Pause, RotateCcw, Coffee, Brain,
  StickyNote, CheckSquare, Plus, Trash2, Save, Type, Send, Bot, User, Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ModuleTabsProps {
  subject: { code: string; name: string };
  department: string;
  semester: number;
  onBack: () => void;
}

interface ModuleTab {
  id: number;
  name: string;
  color: string;
}

interface ImportanceTopic {
  topic: string;
  module: string;
  importance: string;
}

interface Question {
  id: number;
  module: string;
  topic: string;
  question: string;
  answer: string;
}

type WindowType = 'module' | 'pomodoro' | 'notes' | 'todo' | 'ai';

interface WindowState {
  id: number;
  type: WindowType;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

const POMODORO_ID = -100;
const NOTES_ID = -200;
const TODO_ID = -300;
const AI_ID = -400;

const ImportanceBadge: React.FC<{ level: string }> = ({ level }) => {
  const normalizedLevel = level.toLowerCase();
  const styles = {
    high: "bg-rose-50 text-rose-700 border-rose-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    default: "bg-slate-50 text-slate-700 border-slate-200"
  };

  const currentStyle = styles[normalizedLevel as keyof typeof styles] || styles.default;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentStyle} flex items-center gap-1.5 w-fit`}>
      {normalizedLevel === 'high' && <AlertCircle className="w-3 h-3" />}
      {normalizedLevel === 'medium' && <Star className="w-3 h-3" />}
      {level}
    </span>
  );
};

/* ---------------- AI TUTOR COMPONENT ---------------- */
const AIAssistant: React.FC<{
  subjectCode: string;
  topics: ImportanceTopic[];
  questions: Question[]
}> = ({ subjectCode, topics, questions }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: `Hello! I'm your SJEC Study Assistant for ${subjectCode}. I can help elaborate on topics or answer questions based strictly on your notes. What's on your mind?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      // Build context from subject data
      const context = `
        SUBJECT: ${subjectCode}
        TOPICS: ${topics.map(t => `${t.topic} (${t.importance})`).join(', ')}
        QUESTIONS & ANSWERS:
        ${questions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n')}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: `
            You are a helpful academic tutor for students studying ${subjectCode}. 
            Your knowledge is STRICTLY LIMITED to the provided context below.
            If the user asks something NOT in the context, politely explain that you can only answer questions related to the loaded subject notes.
            Be concise, clear, and professional. Use formatting (bullet points, bold text) where appropriate for readability.
            CONTEXT:
            ${context}
          `
        }
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't generate a response." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "I encountered an error connecting to my knowledge base. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm flex gap-3
              ${m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
              <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center 
                ${m.role === 'user' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consulting Notes...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a topic or question..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-400 transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

/* ---------------- POMODORO COMPONENT ---------------- */
const PomodoroTimer: React.FC = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const totalTime = isBreak ? 5 * 60 : 25 * 60;
  const currentTime = minutes * 60 + seconds;
  const progress = ((totalTime - currentTime) / totalTime) * 100;

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setIsActive(false);
          const nextMode = !isBreak;
          setIsBreak(nextMode);
          setMinutes(nextMode ? 5 : 25);
          setSeconds(0);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, isBreak]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 bg-gradient-to-b from-white to-slate-50">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute w-full h-full -rotate-90">
          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
          <circle
            cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
            strokeLinecap="round"
            className={`${isBreak ? 'text-emerald-500' : 'text-rose-500'} transition-all duration-500`}
          />
        </svg>
        <div className="relative flex flex-col items-center">
          <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isBreak ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {isBreak ? 'Take a Breath' : 'Deep Focus'}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95
            ${isActive ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
        >
          {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>
        <button
          onClick={() => { setIsActive(false); setMinutes(isBreak ? 5 : 25); setSeconds(0); }}
          className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* ---------------- ZEN NOTES COMPONENT ---------------- */
const ZenNotes: React.FC = () => {
  const [content, setContent] = useState('');
  return (
    <div className="flex flex-col h-full bg-[#fdfdfd]">
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white/50">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-200" />
          <div className="w-3 h-3 rounded-full bg-slate-200" />
        </div>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Autosaved to Local</span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Draft your thoughts, key formulas, or questions here..."
        className="flex-1 p-6 text-[14px] leading-relaxed text-slate-700 font-medium bg-transparent outline-none resize-none placeholder:text-slate-300 custom-scrollbar"
      />
    </div>
  );
};

/* ---------------- SESSION GOALS COMPONENT ---------------- */
const SessionGoals: React.FC = () => {
  const [goals, setGoals] = useState<{ id: number, text: string, done: boolean }[]>([]);
  const [input, setInput] = useState('');

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setGoals([...goals, { id: Date.now(), text: input, done: false }]);
    setInput('');
  };

  const toggleGoal = (id: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const removeGoal = (id: number) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="flex flex-col h-full p-6 bg-slate-50/30">
      <form onSubmit={addGoal} className="flex gap-2 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New milestone..."
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors shadow-sm"
        />
        <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="flex-1 space-y-2 overflow-auto custom-scrollbar">
        {goals.map(goal => (
          <div key={goal.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group animate-fade-in">
            <button
              onClick={() => toggleGoal(goal.id)}
              className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
                ${goal.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-indigo-400'}`}
            >
              {goal.done && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
            <span className={`flex-1 text-sm font-bold ${goal.done ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
              {goal.text}
            </span>
            <button onClick={() => removeGoal(goal.id)} className="p-1 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 opacity-20 text-center">
            <CheckSquare className="w-10 h-10 mb-2" />
            <p className="text-xs font-black uppercase tracking-widest">No goals set</p>
          </div>
        )}
      </div>
    </div>
  );
};

export function ModuleTabs({ subject, onBack }: ModuleTabsProps) {
  const [modules, setModules] = useState<ModuleTab[]>([]);
  const [importanceTopics, setImportanceTopics] = useState<ImportanceTopic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{ [key: number]: string | null }>({});
  const [maxZIndex, setMaxZIndex] = useState(10);
  const desktopRef = useRef<HTMLDivElement>(null);

  /* ---------------- FETCH BACKEND DATA ---------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectCode = subject.code;
        const impRes = await fetch(`http://localhost:8000/subjects/${subjectCode}/importance`);
        const qRes = await fetch(`http://localhost:8000/subjects/${subjectCode}/questions`);
        const impJson = await impRes.json();
        const qJson = await qRes.json();
        const topics: ImportanceTopic[] = impJson.topics || [];
        const qs: Question[] = qJson.questions || [];
        setImportanceTopics(topics);
        setQuestions(qs);
        const moduleSet = new Set<string>();
        const isValidModule = (m: string) => m && !['null', 'undefined', 'out of syllabus'].includes(m.toLowerCase());
        topics.forEach(t => { if (isValidModule(t.module)) moduleSet.add(t.module); });
        qs.forEach(q => { if (isValidModule(q.module)) moduleSet.add(q.module); });
        const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-sky-500'];
        const moduleList: ModuleTab[] = Array.from(moduleSet).map((m, i) => ({
          id: i + 1, name: m, color: colors[i % colors.length]
        }));
        setModules(moduleList);
      } catch (err) { console.error(err); }
    };
    loadData();
  }, [subject.code]);

  /* ---------------- WINDOWING CORE ---------------- */
  const focusWindow = (id: number) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        const newZ = maxZIndex + 1;
        setMaxZIndex(newZ);
        return { ...w, zIndex: newZ, isMinimized: false };
      }
      return w;
    }));
  };

  const handleLaunch = (id: number, type: WindowType) => {
    const existing = windows.find(w => w.id === id);
    if (existing) {
      focusWindow(id);
    } else {
      const newZ = maxZIndex + 1;
      setMaxZIndex(newZ);
      let defaults = { width: 800, height: 600, x: 100, y: 100 };
      if (type === 'pomodoro') defaults = { width: 320, height: 420, x: window.innerWidth - 360, y: 100 };
      if (type === 'notes') defaults = { width: 400, height: 500, x: 150, y: 150 };
      if (type === 'todo') defaults = { width: 300, height: 400, x: 200, y: 200 };
      if (type === 'ai') defaults = { width: 400, height: 600, x: window.innerWidth - 450, y: 150 };

      const newWindow: WindowState = {
        id, type, ...defaults,
        isMinimized: false, isMaximized: false, zIndex: newZ
      };
      setWindows([...windows, newWindow]);
    }
  };

  const updateWindow = (id: number, updates: Partial<WindowState>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  /* ---------------- DRAG & RESIZE ---------------- */
  const [dragState, setDragState] = useState<{ id: number, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const [resizeState, setResizeState] = useState<{ id: number, startX: number, startY: number, initialW: number, initialH: number } | null>(null);

  const startDrag = (id: number, e: React.MouseEvent) => {
    const win = windows.find(w => w.id === id);
    if (!win || win.isMaximized) return;
    focusWindow(id);
    setDragState({ id, startX: e.clientX, startY: e.clientY, initialX: win.x, initialY: win.y });
  };

  const startResize = (id: number, e: React.MouseEvent) => {
    const win = windows.find(w => w.id === id);
    if (!win || win.isMaximized) return;
    e.stopPropagation();
    setResizeState({ id, startX: e.clientX, startY: e.clientY, initialW: win.width, initialH: win.height });
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragState) {
        updateWindow(dragState.id, { x: dragState.initialX + (e.clientX - dragState.startX), y: dragState.initialY + (e.clientY - dragState.startY) });
      }
      if (resizeState) {
        updateWindow(resizeState.id, {
          width: Math.max(250, resizeState.initialW + (e.clientX - resizeState.startX)),
          height: Math.max(250, resizeState.initialH + (e.clientY - resizeState.startY))
        });
      }
    };
    const onMouseUp = () => { setDragState(null); setResizeState(null); };
    if (dragState || resizeState) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
  }, [dragState, resizeState]);

  return (
    <div className="flex flex-col w-full h-screen bg-slate-100 overflow-hidden font-sans select-none relative">
      {/* OS Taskbar */}
      <header className="z-[70] bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-all" />
          </button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="text-indigo-600 opacity-40">#</span>{subject.code}
          </h1>
        </div>

        <div className="flex-1 flex justify-center gap-2 overflow-x-auto no-scrollbar px-10">
          {modules.map(module => {
            const win = windows.find(w => w.id === module.id);
            const isOpen = !!win;
            return (
              <button key={module.id} onClick={() => handleLaunch(module.id, 'module')} className={`relative flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${isOpen ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-white animate-pulse' : module.color}`}></div>
                {module.name}
              </button>
            );
          })}
        </div>
      </header>

      {/* Desktop Workspace */}
      <main ref={desktopRef} className="flex-1 relative overflow-hidden bg-slate-50/50 p-4">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>

        {windows.map(win => {
          if (win.isMinimized) return null;

          const module = modules.find(m => m.id === win.id);
          const currentFilter = selectedTopic[win.id];
          const moduleTopics = module ? importanceTopics.filter(t => t.module === module.name) : [];
          const filteredQuestions = module ? (currentFilter ? questions.filter(q => q.module === module.name && q.topic === currentFilter) : questions.filter(q => q.module === module.name)) : [];

          const getTitle = () => {
            if (win.type === 'module') return module?.name || 'Loading...';
            if (win.type === 'pomodoro') return 'Focus Timer';
            if (win.type === 'notes') return 'Zen Notes';
            if (win.type === 'todo') return 'Session Goals';
            if (win.type === 'ai') return 'AI Study Tutor';
            return 'Widget';
          };

          const getIcon = () => {
            if (win.type === 'pomodoro') return <Timer className="w-3.5 h-3.5 text-rose-500" />;
            if (win.type === 'notes') return <StickyNote className="w-3.5 h-3.5 text-amber-500" />;
            if (win.type === 'todo') return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
            if (win.type === 'ai') return <Bot className="w-3.5 h-3.5 text-indigo-500" />;
            return <BookMarked className="w-3.5 h-3.5 text-white" />;
          };

          return (
            <div
              key={win.id}
              onMouseDown={() => focusWindow(win.id)}
              style={{
                position: 'absolute',
                left: win.isMaximized ? 0 : win.x,
                top: win.isMaximized ? 0 : win.y,
                width: win.isMaximized ? '100%' : win.width,
                height: win.isMaximized ? '100%' : win.height,
                zIndex: win.zIndex,
                transition: dragState || resizeState ? 'none' : 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
              className={`flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden ring-1 ring-slate-900/5 
                ${dragState?.id === win.id ? 'opacity-90 ring-indigo-500/20' : ''} ${win.isMaximized ? 'rounded-none border-none' : ''}`}
            >
              {/* Window Header */}
              <div onMouseDown={(e) => startDrag(win.id, e)} className="h-12 bg-white/50 border-b border-slate-200 px-5 flex items-center justify-between cursor-move shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg shadow-sm ${win.type === 'module' ? (module?.color || 'bg-indigo-600') : 'bg-slate-50'}`}>
                    {getIcon()}
                  </div>
                  <span className="text-xs font-black text-slate-800 tracking-tight uppercase tracking-widest">{getTitle()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); updateWindow(win.id, { isMinimized: true }); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"><Minus className="w-4 h-4" /></button>
                  {win.type === 'module' && <button onClick={(e) => { e.stopPropagation(); updateWindow(win.id, { isMaximized: !win.isMaximized }); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">{win.isMaximized ? <Square className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}</button>}
                  <button onClick={(e) => { e.stopPropagation(); setWindows(prev => prev.filter(w => w.id !== win.id)); }} className="p-2 hover:bg-rose-500 hover:text-white rounded-xl text-slate-400 transition-all"><X className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Window Content */}
              <div className="flex-1 overflow-auto custom-scrollbar select-text bg-white/30">
                {win.type === 'module' ? (
                  <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-12 animate-fade-in">
                    <header className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100"><Layers className="w-6 h-6 text-white" /></div>
                        <div><h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Module Overview</h2></div>
                      </div>
                      <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100 flex gap-5 items-start">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-50"><Info className="w-5 h-5 text-indigo-600" /></div>
                        <p className="text-[14px] text-slate-600 leading-relaxed font-medium">Explore core topics and curated examination questions. <span className="block mt-2 font-black text-indigo-600 uppercase text-[11px] tracking-wider">Tip: Select a topic to isolate relevant questions.</span></p>
                      </div>
                    </header>
                    <section className="space-y-8">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider"><Lightbulb className="w-5 h-5 text-amber-500" />Crucial Topics</h3>
                        {currentFilter && <button onClick={() => setSelectedTopic(prev => ({ ...prev, [win.id]: null }))} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors">Clear filter</button>}
                      </div>
                      <div className={`grid gap-5 ${win.width > 700 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {moduleTopics.map((t, i) => (
                          <button key={i} onClick={() => setSelectedTopic(prev => ({ ...prev, [win.id]: prev[win.id] === t.topic ? null : t.topic }))} className={`group text-left p-6 rounded-3xl border transition-all duration-300 transform active:scale-95 ${currentFilter === t.topic ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5'}`}>
                            <div className="flex justify-between items-start mb-6">
                              <div className={`p-2.5 rounded-xl transition-all ${currentFilter === t.topic ? 'bg-white/20 text-white' : 'bg-slate-50 text-indigo-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}><CheckCircle2 className="w-5 h-5" /></div>
                              <ImportanceBadge level={t.importance} />
                            </div>
                            <h4 className={`text-base font-bold leading-tight transition-colors ${currentFilter === t.topic ? 'text-white' : 'text-slate-800 group-hover:text-indigo-900'}`}>{t.topic}</h4>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-8 pb-10">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider"><MessageCircle className="w-5 h-5 text-emerald-500" />Archive</h3>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full border border-emerald-100">{filteredQuestions.length} Items</div>
                      </div>
                      <div className="space-y-4">
                        {filteredQuestions.map((q) => (
                          <div key={q.id} className={`overflow-hidden rounded-3xl border transition-all duration-500 ${activeQuestionId === q.id ? 'bg-white border-indigo-200 shadow-xl shadow-slate-200/50' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                            <button onClick={() => setActiveQuestionId(activeQuestionId === q.id ? null : q.id)} className="w-full flex items-start gap-5 p-6 text-left group">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 ${activeQuestionId === q.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>Q{q.id}</div>
                              <div className="flex-1 pt-2"><p className={`text-[15px] font-bold transition-colors leading-snug ${activeQuestionId === q.id ? 'text-indigo-950' : 'text-slate-700'}`}>{q.question}</p></div>
                              <div className={`mt-2 p-1 transition-all duration-300 ${activeQuestionId === q.id ? 'text-indigo-600 rotate-180' : 'text-slate-300'}`}><ChevronDown className="w-5 h-5" /></div>
                            </button>
                            {activeQuestionId === q.id && <div className="px-8 pb-8 pt-2 animate-fade-in"><div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative"><div className="absolute -left-3 top-6 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-indigo-100">ANS</div><p className="text-[14px] text-slate-600 leading-relaxed font-medium pl-6 whitespace-pre-line">{q.answer}</p></div></div>}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : win.type === 'pomodoro' ? (
                  <PomodoroTimer />
                ) : win.type === 'notes' ? (
                  <ZenNotes />
                ) : win.type === 'ai' ? (
                  <AIAssistant subjectCode={subject.code} topics={importanceTopics} questions={questions} />
                ) : (
                  <SessionGoals />
                )}
              </div>
              {!win.isMaximized && (
                <div onMouseDown={(e) => startResize(win.id, e)} className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center z-30"><div className="w-2.5 h-2.5 border-b-2 border-r-2 border-slate-300"></div></div>
              )}
            </div>
          );
        })}

        {windows.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-slate-50 animate-float"><Orbit className="w-16 h-16 text-indigo-200" /></div>
            <div className="max-w-sm space-y-3"><h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Knowledge Desk</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Select a module or launch study tools below</p></div>
          </div>
        )}
      </main>

      {/* OS Dock Area */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[80]">
        <div className="flex items-center gap-4 p-3 bg-white/80 backdrop-blur-2xl border-2 border-white/50 rounded-[2.5rem] shadow-2xl pointer-events-auto scale-110">
          <button onClick={() => handleLaunch(AI_ID, 'ai')} className="group p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-indigo-100 hover:-translate-y-1 active:scale-95" title="AI Tutor">
            <Bot className="w-5 h-5" />
          </button>
          <button onClick={() => handleLaunch(POMODORO_ID, 'pomodoro')} className="group p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:shadow-rose-100 hover:-translate-y-1 active:scale-95" title="Pomodoro Timer">
            <Timer className="w-5 h-5" />
          </button>
          <button onClick={() => handleLaunch(NOTES_ID, 'notes')} className="group p-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all shadow-sm hover:shadow-amber-100 hover:-translate-y-1 active:scale-95" title="Zen Notes">
            <StickyNote className="w-5 h-5" />
          </button>
          <button onClick={() => handleLaunch(TODO_ID, 'todo')} className="group p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-emerald-100 hover:-translate-y-1 active:scale-95" title="Session Goals">
            <CheckSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const Orbit = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" /><path d="M12 3a9 9 0 0 1 9 9" /><path d="M12 21a9 9 0 0 1-9-9" /><path d="M21 12a9 9 0 0 1-9 9" /><path d="M3 12a9 9 0 0 1 9-9" />
  </svg>
);