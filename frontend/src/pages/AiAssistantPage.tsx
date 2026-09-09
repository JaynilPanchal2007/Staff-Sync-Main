import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistantPage: React.FC = () => {
  const { orgType } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I am your StaffSync Intelligent Workforce Assistant. I am directly connected to your active database and real-time schedules. Ask me about today's attendance, staff availability, lecture overlaps, workload balance, or replacement recommendations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    'Who is absent today?',
    'Who is available to cover a lecture right now?',
    'Which staff member has the heaviest workload?',
    'What is our current gap resolution status?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await api.askAiAssistant(textToSend);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer || 'I processed your query against the live database.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Sorry, I encountered an issue while querying the database: ${(err as Error).message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">StaffSync AI Workforce Assistant</h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Grounded in Database
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live queries powered by Gemini and verified against persistent organization state
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 font-medium text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div
                className={`mt-2 text-right text-[10px] ${
                  m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/70">
              <Bot className="h-4 w-4 animate-bounce text-indigo-600" />
              <span>Analyzing live database records & running inference...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Queries */}
      <div className="border-t border-slate-100 px-6 py-2.5 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-800"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about staff availability, conflicts, replacements, or workload..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={isTyping || !inputQuery.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 transition-all hover:bg-indigo-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
