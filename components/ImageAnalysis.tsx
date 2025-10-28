
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import { UploadIcon } from './icons/Icons';

const objectCategories = [
  'person', 'car', 'dog', 'tree', 'building', 'flower', 'cat', 'bicycle', 'chair', 'book'
];

const ImageAnalysis: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Describe this image in detail. If there are people, describe their expressions. If there is text, transcribe it.');
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleObjectSelection = (objectCategory: string) => {
    setSelectedObjects(prevSelected =>
      prevSelected.includes(objectCategory)
        ? prevSelected.filter(item => item !== objectCategory)
        : [...prevSelected, objectCategory]
    );
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
    if (selectedObjects.length > 0) {
      const objectList = selectedObjects.join(', ');
      finalPrompt += `\n\nIn addition to the above, please specifically identify and describe any of the following objects if they are present: ${objectList}.`;
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
  }, [file, prompt, selectedObjects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const availableCategories = objectCategories.filter(cat => !selectedObjects.includes(cat));

  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader 
        title="Image Analysis & Object Detection"
        description="Upload an image, refine your query with contextual text, and select objects to find. Ask Gemini to find a face, read text, or describe the scene."
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Object Detection (Optional)</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 flex flex-wrap items-center gap-2 text-left min-h-[42px]"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              {selectedObjects.length === 0 && <span className="text-gray-400">Select object categories...</span>}
              {selectedObjects.map(obj => (
                <span key={obj} className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center">
                  <span className="capitalize">{obj}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleObjectSelection(obj);
                    }}
                    className="ml-1.5 -mr-1 text-blue-200 hover:text-white focus:outline-none"
                    aria-label={`Remove ${obj}`}
                  >
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                </span>
              ))}
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-gray-600 border border-gray-500 rounded-md shadow-lg max-h-48 overflow-y-auto" role="listbox">
                <ul className="py-1">
                  {availableCategories.length > 0 ? (
                    availableCategories.map(category => (
                      <li
                        key={category}
                        onClick={() => handleObjectSelection(category)}
                        className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-500 cursor-pointer capitalize"
                        role="option"
                        aria-selected={false}
                      >
                        {category}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-sm text-gray-400 italic">All categories selected</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-400 mt-4">{error}</p>}
        
        {(isLoading || analysis) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white">Analysis Result</h3>
            <div className="mt-2 bg-gray-700 p-4 rounded-md min-h-[100px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner />
                </div>
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap">{analysis}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysis;
