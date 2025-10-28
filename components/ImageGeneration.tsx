
import React, { useState, useCallback, useEffect } from 'react';
import { generateImage } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import type { AspectRatio } from '../types';
import Alert from './Alert';

const aspectRatios: { label: string; value: AspectRatio }[] = [
  { label: 'Square (1:1)', value: '1:1' },
  { label: 'Portrait (3:4)', value: '3:4' },
  { label: 'Landscape (4:3)', value: '4:3' },
  { label: 'Tall (9:16)', value: '9:16' },
  { label: 'Wide (16:9)', value: '16:9' },
];

const ImageGeneration: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
    } else {
        setApiKeySelected(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const imageUrl = await generateImage(prompt, aspectRatio);
      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        throw new Error('The model did not return an image. Please try a different prompt.');
      }
    } catch (err: any) {
        let errorMessage = 'Failed to generate image. Please try a different prompt.';
        if (err.message.includes('API is only accessible to billed users') || err.message.includes('Requested entity was not found')) {
            errorMessage = "API Key error. Please re-select your API key and try again.";
            setApiKeySelected(false);
        } else if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  }, [prompt, aspectRatio, isLoading]);

  if (!apiKeySelected) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <ToolHeader 
          title="Image Generation"
          description="Create high-quality images from text prompts using the imagen-4.0 model."
        />
        <div className="bg-gray-800 p-8 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">API Key Required</h3>
            <p className="text-gray-400 mb-6">
                Image generation with Imagen requires you to select your own API key. Please ensure you have a valid key associated with a billing-enabled project.
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">Learn about billing.</a>
            </p>
            <button onClick={handleSelectKey} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                Select API Key
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ToolHeader 
        title="Image Generation"
        description="Create high-quality images from text prompts using the imagen-4.0 model."
      />
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div>
          <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-300 mb-2">Image Prompt</label>
          <textarea
            id="image-prompt"
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A majestic lion wearing a crown, photorealistic style"
            disabled={isLoading}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => setAspectRatio(ratio.value)}
                disabled={isLoading}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  aspectRatio === ratio.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="mt-6 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Image'}
        </button>

        {error && <Alert message={error} onClose={() => setError('')} />}
        
        <div className="mt-6">
          {isLoading && (
            <div className="flex flex-col justify-center items-center h-64 bg-gray-700 rounded-md">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-400">Creating your masterpiece...</p>
            </div>
          )}
          {generatedImage && (
            <div className="bg-gray-700 p-2 rounded-md">
              <img 
                src={generatedImage} 
                alt="Generated by AI" 
                className="w-full h-auto rounded-md object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGeneration;