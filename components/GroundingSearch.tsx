
import React, { useState, useCallback } from 'react';
import { groundingSearch } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import Alert from './Alert';
import CopyButton from './CopyButton';
import { GroundingChunk, GroundingSearchResponse, WebChunk } from '../types';
import { LinkIcon } from './icons/Icons';

const GroundingSearch: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<GroundingSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);
    setError('');

    try {
      const result = await groundingSearch(prompt);
      setResponse(result);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  const renderSource = (chunk: GroundingChunk, index: number) => {
    const webChunk = chunk as WebChunk; // We only expect web chunks
    const title = webChunk.web.title || new URL(webChunk.web.uri).hostname;
    return (
      <a 
        href={webChunk.web.uri} 
        target="_blank" 
        rel="noopener noreferrer" 
        key={index}
        title={webChunk.web.uri}
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md transition-colors max-w-full"
      >
        <span className="truncate">{title}</span>
        <LinkIcon />
      </a>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <ToolHeader 
        title="Grounded Search"
        description="Ask about current events or any topic requiring up-to-date information. Answers are grounded with Google Search for accuracy."
      />

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <label htmlFor="grounding-prompt" className="block text-sm font-medium text-gray-300 mb-2">Your Question</label>
        <textarea
          id="grounding-prompt"
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Who won the latest Formula 1 race and what were the key moments?"
          disabled={isLoading}
        />
        <div className="mt-4 flex">
            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Searching...' : 'Search'}
            </button>
        </div>

        {error && <Alert message={error} onClose={() => setError('')} />}

        {(isLoading || response) && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Response</h3>
              {response && !isLoading && <CopyButton textToCopy={response.text} />}
            </div>
            <div className="bg-gray-700 p-4 rounded-md min-h-[150px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner />
                </div>
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap">{response?.text}</p>
              )}
            </div>
          </div>
        )}
        
        {response?.sources && response.sources.length > 0 && !isLoading && (
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Sources</h3>
                <div className="flex flex-wrap gap-2">
                    {response.sources.map(renderSource)}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default GroundingSearch;
