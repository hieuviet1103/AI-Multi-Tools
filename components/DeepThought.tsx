
import React, { useState, useCallback } from 'react';
import { deepThought } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import CopyButton from './CopyButton';

const DeepThought: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setResponse('');
    const result = await deepThought(prompt);
    setResponse(result);
    setIsLoading(false);
  }, [prompt, isLoading]);

  return (
    <div className="max-w-3xl mx-auto">
      <ToolHeader 
        title="Deep Thought Mode"
        description="Ask complex questions that require deep reasoning. This uses gemini-2.5-pro with its maximum thinking budget, so responses may take longer."
      />

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <label htmlFor="deep-prompt" className="block text-sm font-medium text-gray-300 mb-2">Your Complex Query</label>
        <textarea
          id="deep-prompt"
          rows={6}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Explain the theory of relativity as if I were a high school student, including its real-world implications..."
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="mt-4 w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Thinking...' : 'Initiate Deep Thought'}
        </button>

        {(isLoading || response) && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Generated Response</h3>
              {response && !isLoading && <CopyButton textToCopy={response} />}
            </div>
            <div className="bg-gray-700 p-4 rounded-md min-h-[150px]">
              {isLoading ? (
                <div className="flex flex-col justify-center items-center h-full text-center">
                  <Spinner size="lg" />
                  <p className="mt-4 text-gray-400">Processing complex query... please wait.</p>
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

export default DeepThought;
