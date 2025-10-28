
import React, { useState, useCallback } from 'react';
import { analyzeImage } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import { UploadIcon } from './icons/Icons';

const ImageAnalysis: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Describe this image in detail. If there are people, describe their expressions. If there is text, transcribe it.');
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [objectsToDetect, setObjectsToDetect] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if(selectedFile.size > 4 * 1024 * 1024) { // 4MB limit
          setError("File size exceeds 4MB. Please choose a smaller image.");
          return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError('');
        setAnalysis('');
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!file || !prompt) {
      setError('Please upload an image and provide a prompt.');
      return;
    }
    setIsLoading(true);
    setAnalysis('');
    setError('');

    let finalPrompt = prompt;
    if (objectsToDetect.trim()) {
      finalPrompt += `\n\nIn addition to the above, please specifically look for and describe the following objects if they are present: ${objectsToDetect}.`;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        if (base64String) {
          const result = await analyzeImage(finalPrompt, base64String, file.type);
          setAnalysis(result);
        } else {
            setError("Could not read the image file.");
        }
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('An error occurred during analysis.');
      setIsLoading(false);
    }
  }, [file, prompt, objectsToDetect]);
  
  const renderHighlightedAnalysis = () => {
    if (!analysis) return null;

    const highlightTerms = objectsToDetect.split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);

    if (highlightTerms.length === 0) {
      return <p className="text-gray-300">{analysis}</p>;
    }

    const regex = new RegExp(`(${highlightTerms.map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'gi');
    const parts = analysis.split(regex);

    return (
      <p className="text-gray-300">
        {parts.map((part, index) => 
          highlightTerms.some(term => term.toLowerCase() === part.toLowerCase())
            ? <span key={index} className="font-bold text-red-400 bg-red-900/30 rounded px-1">{part}</span>
            : part
        )}
      </p>
    );
  };


  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader 
        title="Image Analysis & Object Detection"
        description="Upload an image, refine your query with contextual text, and specify objects to find. Ask Gemini to find a face, read text, or describe the scene."
      />
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {image ? (
                  <img src={image} alt="Preview" className="mx-auto h-48 w-auto rounded-md object-contain" />
                ) : (
                  <>
                    <UploadIcon />
                    <div className="flex text-sm text-gray-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 4MB</p>
                  </>
                )}
              </div>
            </div>
            {image && 
              <button onClick={() => {setImage(null); setFile(null); setAnalysis('')}} className="mt-2 text-sm text-red-400 hover:text-red-500">
                Remove Image
              </button>
            }
          </div>

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Contextual Prompt</label>
            <textarea
              id="prompt"
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What is the main subject of this image?"
            />
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !file}
              className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>
        </div>
        
        <div className="mt-6">
          <label htmlFor="objects-to-detect" className="block text-sm font-medium text-gray-300 mb-2">Object Detection (Optional)</label>
          <textarea
            id="objects-to-detect"
            rows={2}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            value={objectsToDetect}
            onChange={(e) => setObjectsToDetect(e.target.value)}
            placeholder="Enter objects to find, separated by commas (e.g., a blue shirt, a stop sign)"
            disabled={isLoading}
          />
        </div>

        {error && <p className="text-red-400 mt-4">{error}</p>}
        
        {(isLoading || analysis) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white">Analysis Result</h3>
            <div className="mt-2 bg-gray-700 p-4 rounded-md min-h-[100px] whitespace-pre-wrap">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner />
                </div>
              ) : (
                renderHighlightedAnalysis()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysis;
