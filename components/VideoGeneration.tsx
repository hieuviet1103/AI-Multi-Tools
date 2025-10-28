
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateVideo, checkVideoOperationStatus } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import type { VideoAspectRatio } from '../types';
import { UploadIcon } from './icons/Icons';
import Alert from './Alert';

const aspectRatios: { label: string; value: VideoAspectRatio }[] = [
  { label: 'Wide (16:9)', value: '16:9' },
  { label: 'Tall (9:16)', value: '9:16' },
];

const loadingMessages = [
    "Warming up the rendering engines...",
    "Choreographing pixels into motion...",
    "Consulting with the digital muse...",
    "Stitching frames together...",
    "Performing final composition...",
    "Adding a touch of cinematic magic...",
];

const VideoGeneration: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
  
  const messageIntervalRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (isLoading) {
      let i = 0;
      messageIntervalRef.current = window.setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 3000);
    } else if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }
    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
    };
  }, [isLoading]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success to avoid race condition and update UI immediately
        setApiKeySelected(true);
    }
  };

  const fileToGenerativePart = async (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string)?.split(',')[1];
            if (base64String) {
                resolve({ base64: base64String, mimeType: file.type });
            } else {
                reject(new Error("Failed to read file."));
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("File size exceeds 4MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };


  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');
    setGeneratedVideoUrl(null);
    setLoadingMessage(loadingMessages[0]);

    try {
        let imagePart;
        if (imageFile) {
            imagePart = await fileToGenerativePart(imageFile);
        }

        let operation = await generateVideo(prompt, aspectRatio, imagePart?.base64, imagePart?.mimeType);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await checkVideoOperationStatus(operation);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink && process.env.API_KEY) {
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
            const videoBlob = await response.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            setGeneratedVideoUrl(videoUrl);
        } else {
            throw new Error('Video generation completed, but no download link was provided.');
        }

    } catch (err: any) {
        let errorMessage = 'Failed to generate video. Please try again.';
        if (err.message.includes('Requested entity was not found')) {
            errorMessage = "API Key error. Please re-select your API key and try again.";
            setApiKeySelected(false);
        } else if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  }, [prompt, aspectRatio, isLoading, imageFile]);

  if (!apiKeySelected) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <ToolHeader 
          title="Video Generation"
          description="Create stunning videos from text prompts using the Veo model."
        />
        <div className="bg-gray-800 p-8 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">API Key Required</h3>
            <p className="text-gray-400 mb-6">
                Video generation with Veo requires you to select your own API key. Please ensure you have a valid key associated with your project.
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
        title="Video Generation"
        description="Create stunning videos from text prompts and an optional starting image using the Veo model."
      />
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div>
          <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">Video Prompt</label>
          <textarea
            id="video-prompt"
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A majestic lion wearing a crown, cinematic style"
            disabled={isLoading}
          />
        </div>
        
        <div className="mt-4 grid md:grid-cols-2 gap-6 items-start">
            <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">Starting Image (Optional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="mx-auto h-24 w-auto rounded-md object-contain" />
                        ) : (
                        <>
                            <UploadIcon />
                            <div className="flex text-sm text-gray-400">
                            <label htmlFor="video-file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none">
                                <span>Upload a file</span>
                                <input id="video-file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                            </label>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG up to 4MB</p>
                        </>
                        )}
                    </div>
                </div>
                {imagePreview && 
                <button onClick={() => {setImagePreview(null); setImageFile(null);}} className="mt-2 text-sm text-red-400 hover:text-red-500">
                    Remove Image
                </button>
                }
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                <div className="flex flex-col space-y-2">
                    {aspectRatios.map((ratio) => (
                    <button
                        key={ratio.value}
                        onClick={() => setAspectRatio(ratio.value)}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm rounded-md transition-colors w-full ${
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
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="mt-6 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Video'}
        </button>

        {error && <Alert message={error} onClose={() => setError('')} />}
        
        <div className="mt-6">
          {isLoading && (
            <div className="flex flex-col justify-center items-center h-64 bg-gray-700 rounded-md">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-400">{loadingMessage}</p>
            </div>
          )}
          {generatedVideoUrl && (
            <div className="bg-gray-700 p-2 rounded-md">
              <video 
                src={generatedVideoUrl} 
                controls
                className="w-full h-auto rounded-md"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
