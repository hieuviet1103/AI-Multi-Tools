
import { GoogleGenAI, Chat } from '@google/genai';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import { UserIcon, GeminiLogoIcon } from './icons/Icons';

const ChatBot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const initializeChat = useCallback(() => {
    if (process.env.API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a friendly and helpful chatbot. Keep your responses concise and informative.',
        },
      });
      setChat(newChat);
      setMessages([]);
    }
  }, []);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(initializeChat, []);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading || !chat) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: userInput }] };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setUserInput('');

    try {
      const response = await chat.sendMessage({ message: userInput });
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: 'Sorry, something went wrong. Please try again.' }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto">
      <ToolHeader 
        title="Conversational Chat Bot"
        description="Have a conversation with Gemini. The bot will remember the context of your chat."
      />
      <div className="flex-grow bg-gray-800 rounded-lg shadow-lg flex flex-col p-4">
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"><GeminiLogoIcon size={20} /></div>}
              <div className={`px-4 py-2 rounded-lg max-w-md ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
              </div>
              {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon /></div>}
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
          <button
            onClick={initializeChat}
            className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
