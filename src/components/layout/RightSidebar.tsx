import React, { useState, useRef, useEffect } from 'react';
import { Bot, Zap, Code2, Database, Github, Send, Terminal, Cpu, Paperclip, Mic, StopCircle, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { useData } from '../../context/DataProvider';
import { useStore } from '../../store';

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
};

export function RightSidebar() {
  const { aiContextRules, setAiContextRules } = useData();
  const { isRightSidebarOpen, toggleRightSidebar } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: 'System online. I am actively monitoring your local changes and CI/CD pipelines. How can I assist you today?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
       interval = setInterval(() => {
          setRecordingTime(prev => prev + 1);
       }, 1000);
    } else {
       setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<{name: string, data: string, mime: string}[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
           setAttachedFiles(prev => [...prev, {
              name: file.name,
              data: (event.target?.result as string).split(',')[1] || '',
              mime: file.type
           }]);
        };
        reader.readAsDataURL(file);
     }
  };

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || inputValue;
    if (!textToSend.trim() && attachedFiles.length === 0) return;

    let displayContent = textToSend;
    if (attachedFiles.length > 0) {
       displayContent += `\n[Attached ${attachedFiles.length} files]`;
    }

    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: displayContent };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);

    const agentMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: agentMsgId,
      role: 'agent',
      content: ''
    }]);

    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMsg],
          files: filesToSend,
          context: `You are an AI assistant in DevSpace. Follow these persistent context rules: ${aiContextRules || 'No special rules.'}\nIf the user provides new memory or personal preferences, you MUST output a comprehensive summary of ALL current and new preferences wrapped EXACTLY in <UPDATE_PREFS>preferences summary here</UPDATE_PREFS>. This will update your memory for future conversations. Otherwise, respond concisely.`
        })
      });

      if (!response.ok) {
         throw new Error(`Server returned error: ${response.status}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let currentContent = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                currentContent += data.text;
                
                const prefsMatch = currentContent.match(/<UPDATE_PREFS>([\s\S]*?)<\/UPDATE_PREFS>/);
                if (prefsMatch && prefsMatch[1]) {
                    setAiContextRules(prefsMatch[1].trim());
                }

                setMessages(prev => prev.map(msg => 
                  msg.id === agentMsgId 
                    ? { ...msg, content: currentContent.replace(/<UPDATE_PREFS>[\s\S]*?<\/UPDATE_PREFS>/g, '').trim() || currentContent }
                    : msg
                ));
              } else if (data.error) {
                setMessages(prev => prev.map(msg => 
                  msg.id === agentMsgId 
                    ? { ...msg, content: currentContent + '\nError: ' + data.error }
                    : msg
                ));
              }
            } catch (e) {
              // Ignore parse errors from partial chunks
            }
          }
        }
      }
    } catch (e: any) {
       setMessages(prev => prev.map(msg => 
        msg.id === agentMsgId 
          ? { ...msg, content: 'Error: ' + e.message }
          : msg
      ));
    }
  };

  const toggleRecording = () => {
     if (isRecording) {
        setIsRecording(false);
        if ((window as any).speechRecognitionRef) {
           (window as any).speechRecognitionRef.stop();
        }
     } else {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
           const recognition = new SpeechRecognition();
           recognition.continuous = false;
           recognition.interimResults = false;
           
           recognition.onstart = () => {
              setIsRecording(true);
           };
           
           recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setInputValue(prev => prev ? prev + ' ' + transcript : transcript);
           };
           
           recognition.onerror = (event: any) => {
              console.error("Speech recognition error", event.error);
              setIsRecording(false);
              if (event.error === 'not-allowed') {
                handleSend("⚠️ [System]: Microphone access denied. Please grant microphone permissions to use voice input.");
              } else {
                handleSend(`⚠️ [System]: Speech recognition error: ${event.error}`);
              }
           };
           
           recognition.onend = () => {
              setIsRecording(false);
           };
           
           (window as any).speechRecognitionRef = recognition;
           recognition.start();
        } else {
           handleSend("🎙️ [Voice Memo Features Not Supported In Browser] Let's type instead.");
        }
     }
  };

  const formatTime = (seconds: number) => {
     const m = Math.floor(seconds / 60).toString().padStart(2, '0');
     const s = (seconds % 60).toString().padStart(2, '0');
     return `${m}:${s}`;
  };

  if (!isRightSidebarOpen) return null;

  return (
    <aside className="absolute md:relative right-0 z-40 h-full w-80 shrink-0 border-l border-zinc-800 bg-[#0c0c0e] flex flex-col overflow-hidden shadow-xl md:shadow-none">
      
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 bg-[#0c0c0e] shrink-0">
        <h2 className="text-xs font-semibold text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
          <Bot size={14} className="text-blue-400" /> AI Assistant Context
        </h2>
        <button 
          onClick={toggleRightSidebar}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Collapse Assistant"
        >
          <X size={14} />
        </button>
      </div>

      {/* Context Buffers */}
      <div className="p-4 border-b border-zinc-800 shrink-0">
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Context Buffers</div>
        <div className="space-y-2">
          
          <div className="flex items-start gap-2 group cursor-pointer">
            <div className="p-1 rounded bg-[#121214] border border-zinc-800 text-zinc-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
              <Code2 size={12} />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-300 truncate">components/layout</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
               </div>
               <div className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">/src/components/layout/Sidebar.tsx...</div>
             </div>
          </div>
          
          <div className="flex items-start gap-2 group cursor-pointer">
            <div className="p-1 rounded bg-[#121214] border border-zinc-800 text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
              <Database size={12} />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-300 truncate">Vector Memory</span>
                  <span className="text-[9px] bg-zinc-800 px-1 rounded text-zinc-400">98% Match</span>
               </div>
               <div className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">Schema defs & relational rules</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2 group cursor-pointer">
            <div className="p-1 rounded bg-[#121214] border border-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:border-zinc-500/50 transition-colors">
              <Github size={12} />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-300 truncate">PR #142 Draft</span>
                  <span className="text-[9px] text-zinc-500">2m ago</span>
               </div>
               <div className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">chore: refine AI interface</div>
            </div>
          </div>

        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#09090b]">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1 text-[11px] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.role === 'agent' && (
              <div className="flex items-center gap-1.5 mb-0.5 text-[9px] font-medium text-blue-400 uppercase tracking-widest pl-1">
                <Cpu size={10} /> DevSpace Engine
              </div>
            )}
            <div
              className={`px-3 py-2 rounded-lg max-w-full leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-blue-50 border border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-[#121214] text-zinc-300 border border-zinc-800/80 shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                 <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                 <div className="markdown-body prose prose-invert prose-p:leading-normal prose-pre:bg-[#09090b] prose-pre:border prose-pre:border-zinc-800 max-w-none text-[11px]">
                   <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content}</Markdown>
                 </div>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#0c0c0e] border-t border-zinc-800 shrink-0">
        <div className={`relative flex flex-col gap-2 bg-[#121214] border rounded-lg p-2 transition-colors ${isRecording ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-zinc-800 focus-within:border-blue-500/50'}`}>
           <div className="flex items-center">
             {isRecording ? (
                <div className="flex items-center gap-2 w-full px-2 py-1">
                   <div className="flex gap-0.5 items-end h-3">
                      <motion.div animate={{ height: ["4px", "12px", "4px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-amber-500 rounded-full" />
                      <motion.div animate={{ height: ["6px", "10px", "6px"] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1 bg-amber-500 rounded-full" />
                      <motion.div animate={{ height: ["3px", "12px", "3px"] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-1 bg-amber-500 rounded-full" />
                   </div>
                   <span className="text-amber-500 text-xs font-mono ml-2">Listening... {formatTime(recordingTime)}</span>
                </div>
             ) : (
                <>
                   <Terminal size={12} className="text-zinc-500 ml-1.5 shrink-0" />
                   <input 
                     type="text" 
                     value={inputValue}
                     onChange={e => setInputValue(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSend()}
                     placeholder="Prompt DevSpace..."
                     className="w-full bg-transparent border-none py-1 pl-2.5 pr-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
                   />
                </>
             )}
           </div>
           
           <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50 mt-1">
             <div className="flex items-center gap-1">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors relative" 
                  title="Attach file"
                  disabled={isRecording}
                >
                  <Paperclip size={12} />
                  {attachedFiles.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-[8px] flex items-center justify-center rounded-full text-white font-bold">{attachedFiles.length}</span>
                  )}
                </button>
                <button 
                  onClick={toggleRecording}
                  className={`p-1.5 rounded transition-colors ${
                     isRecording ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  }`} 
                  title="Voice command"
                >
                  {isRecording ? <StopCircle size={12} /> : <Mic size={12} />}
                </button>
             </div>
             <button 
               onClick={() => handleSend()}
               disabled={isRecording}
               className={`p-1.5 rounded transition-colors flex items-center gap-1.5 bg-[#09090b] border border-zinc-800 ${
                  isRecording ? 'text-zinc-600 cursor-not-allowed border-zinc-800/50' : 'text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10'
               }`}
             >
               <span className="text-[10px] font-medium hidden sm:inline-block">Send</span>
               <Send size={12} />
             </button>
           </div>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-[9px] text-zinc-500 flex items-center gap-1">
             <Zap size={10} className="text-blue-500/70"/> Gemini API
          </span>
          <span className="text-[9px] text-zinc-600">
             <kbd className="font-mono bg-[#121214] border border-zinc-800 px-1 rounded">↵</kbd> Send
          </span>
        </div>
      </div>

    </aside>
  );
}
