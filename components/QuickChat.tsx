
import React, { useState, useCallback } from 'react';
import { quickChat } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';

const QuickChat: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setResponse('');
    const result = await quickChat(prompt);
    setResponse(result);
    setIsLoading(false);
  }, [prompt, isLoading]);

  return (
    <div className="max-w-2xl mx-auto">
      <ToolHeader 
        title="Quick Chat"
        description="Get fast responses for simple questions using the gemini-2.5-flash-lite model."
      />

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit}>
          <label htmlFor="quick-prompt" className="block text-sm font-medium text-gray-300 mb-2">Your Question</label>
          <div className="flex gap-2">
            <input
              id="quick-prompt"
              type="text"
              className="flex-grow bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What's the capital of France?"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Spinner size="sm" /> : 'Ask'}
            </button>
          </div>
        </form>

        {(isLoading || response) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white">Response</h3>
            <div className="mt-2 bg-gray-700 p-4 rounded-md min-h-[80px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner />
                </div>
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap">{response}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickChat;
