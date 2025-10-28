import { GoogleGenAI, Chat } from '@google/genai';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, ChatSession, HistoryMessage } from '../types';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import { UserIcon, GeminiLogoIcon, PlusIcon, HistoryIcon } from './icons/Icons';
import CopyButton from './CopyButton';
import { getDeviceId, saveNewSession, saveMessage, getSessions, getMessages } from '../services/db';
import { generateChatTitle } from '../services/geminiService';


const ChatBot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(true);

  const deviceId = useRef<string>(getDeviceId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const loadSessions = useCallback(async () => {
    const savedSessions = await getSessions(deviceId.current);
    setSessions(savedSessions);
  }, []);

  useEffect(() => {
    loadSessions();
    handleNewChat(); // Start with a new chat session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSessions]);
  
  const handleNewChat = useCallback(() => {
    if (process.env.API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const newChatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a friendly and helpful chatbot. Keep your responses concise and informative.',
        },
      });
      setChat(newChatInstance);
      setMessages([]);
      setActiveSessionId(null); // This indicates a new, unsaved session
    }
  }, []);
  
  const handleSelectSession = useCallback(async (sessionId: string) => {
    const historicalMessages = await getMessages(sessionId);
    const historyForModel: { role: 'user' | 'model'; parts: { text: string }[] }[] = historicalMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: historyForModel,
            config: {
                systemInstruction: 'You are a friendly and helpful chatbot. Keep your responses concise and informative.',
            },
        });
        setChat(chatInstance);
        setMessages(historyForModel);
        setActiveSessionId(sessionId);
    }
  }, []);


  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading || !chat) return;

    const currentInput = userInput;
    const userMessage: ChatMessage = { role: 'user', parts: [{ text: currentInput }] };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setUserInput('');

    let currentSessionId = activeSessionId;

    try {
      // If this is the first message of a new chat, create a session
      if (!currentSessionId) {
        const title = await generateChatTitle(currentInput);
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          deviceId: deviceId.current,
          title,
          timestamp: Date.now(),
        };
        await saveNewSession(newSession);
        currentSessionId = newSession.id;
        setActiveSessionId(currentSessionId);
        setSessions(prev => [newSession, ...prev]); // Add to top of list
      }

      // Save user message to DB
      const userHistoryMessage: HistoryMessage = {
        sessionId: currentSessionId,
        role: 'user',
        content: currentInput,
        timestamp: Date.now(),
      };
      await saveMessage(userHistoryMessage);

      // Send to model and get response
      const response = await chat.sendMessage({ message: currentInput });
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
      setMessages(prev => [...prev, modelMessage]);
      
      // Save model message to DB
      const modelHistoryMessage: HistoryMessage = {
          sessionId: currentSessionId,
          role: 'model',
          content: response.text,
          timestamp: Date.now() + 1, // Ensure it's after user message
      };
      await saveMessage(modelHistoryMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: 'Sorry, something went wrong. Please try again.' }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      <ToolHeader 
        title="Conversational Chat Bot"
        description="Have a conversation with Gemini. Your chat history is saved automatically to your device."
      />
      <div className="flex-grow flex gap-4 overflow-hidden">
        {/* History Sidebar */}
        <div className={`
            bg-gray-800 rounded-lg shadow-lg p-3 flex flex-col transition-all duration-300
            ${historyPanelOpen ? 'w-64' : 'w-12'}
        `}>
          <div className="flex items-center justify-between mb-4">
              {historyPanelOpen && <h3 className="text-lg font-semibold">History</h3>}
              <button onClick={() => setHistoryPanelOpen(!historyPanelOpen)} className="p-1 hover:bg-gray-700 rounded-md">
                  <HistoryIcon />
              </button>
          </div>
          {historyPanelOpen && (
            <>
              <button
                onClick={handleNewChat}
                className="flex items-center justify-center w-full bg-blue-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-blue-700 transition-colors mb-4"
              >
                  <PlusIcon />
                  <span className="ml-2">New Chat</span>
              </button>
              <div className="flex-grow overflow-y-auto pr-1 space-y-2">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`w-full text-left px-3 py-2 rounded-md truncate text-sm transition-colors ${
                      activeSessionId === session.id ? 'bg-gray-600' : 'hover:bg-gray-700'
                    }`}
                  >
                    {session.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-grow bg-gray-800 rounded-lg shadow-lg flex flex-col p-4">
          <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`group flex items-start gap-3 ${msg.role === 'user' ? 'justify-end flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-600' : 'bg-blue-500'}`}>
                  {msg.role === 'user' ? <UserIcon /> : <GeminiLogoIcon size={20} />}
                </div>
                <div className={`px-4 py-2 rounded-lg max-w-md ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                  <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                </div>
                {msg.role === 'model' && (
                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton textToCopy={msg.parts[0].text} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"><GeminiLogoIcon size={20} /></div>
                <div className="px-4 py-2 rounded-lg bg-gray-700 flex items-center">
                  <Spinner size="sm" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              className="flex-grow bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !userInput.trim()}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;