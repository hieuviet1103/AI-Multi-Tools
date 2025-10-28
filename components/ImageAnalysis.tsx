
import React, { useState, useCallback } from 'react';
import { analyzeImage } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import { UploadIcon } from './icons/Icons';
import Alert from './Alert';
import type { ImageAnalysisResponse, DetectedObject } from '../types';

const ImageAnalysis: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Describe this image in detail. If there are people, describe their expressions. If there is text, transcribe it.');
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResponse | null>(null);
  const [croppedObjectImages, setCroppedObjectImages] = useState<{name: string, dataUrl: string}[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [objectsToDetect, setObjectsToDetect] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState<{width: number; height: number} | null>(null);


  const resetState = () => {
    setImage(null);
    setFile(null);
    setAnalysis(null);
    setCroppedObjectImages([]);
    setError('');
    setImageDimensions(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if(selectedFile.size > 4 * 1024 * 1024) { // 4MB limit
          setError("File size exceeds 4MB. Please choose a smaller image.");
          return;
      }
      resetState();
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const cropAndSetObjects = useCallback((
    imageDataUrl: string,
    objects: DetectedObject[],
    mimeType: string
  ) => {
      const img = new Image();
      img.onload = () => {
          const croppedResults: {name: string, dataUrl: string}[] = [];
          objects.forEach(obj => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              const { x, y, width, height } = obj.boundingBox;
              const sx = x * img.naturalWidth;
              const sy = y * img.naturalHeight;
              const sWidth = width * img.naturalWidth;
              const sHeight = height * img.naturalHeight;

              if (sWidth < 1 || sHeight < 1) return; // Skip invalid boxes

              canvas.width = sWidth;
              canvas.height = sHeight;

              ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
              croppedResults.push({ name: obj.name, dataUrl: canvas.toDataURL(mimeType) });
          });
          setCroppedObjectImages(croppedResults);
      };
      img.onerror = () => {
          setError("Could not load the uploaded image for processing.");
      };
      img.src = imageDataUrl;
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file || !prompt) {
      setError('Please upload an image and provide a prompt.');
      return;
    }
    setIsLoading(true);
    setAnalysis(null);
    setCroppedObjectImages([]);
    setImageDimensions(null);
    setError('');

    let finalPrompt = prompt;
    if (objectsToDetect.trim()) {
      finalPrompt += `\n\nFor the objects listed here: "${objectsToDetect}", provide their name and a normalized bounding box (x, y, width, height) in the 'detectedObjects' array. The x and y coordinates should represent the top-left corner of the box. Only include objects that are clearly visible in the image.`;
    } else {
      finalPrompt += `\n\nPlease also return an empty 'detectedObjects' array.`;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        if (base64String) {
          const result = await analyzeImage(finalPrompt, base64String, file.type);
          setAnalysis(result);
          if (image && result.detectedObjects && result.detectedObjects.length > 0) {
            cropAndSetObjects(image, result.detectedObjects, file.type);
          }
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
  }, [file, prompt, objectsToDetect, image, cropAndSetObjects]);
  
  const renderHighlightedAnalysis = () => {
    if (!analysis?.description) return null;

    const highlightTerms = objectsToDetect.split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);

    if (highlightTerms.length === 0) {
      return <p className="text-gray-300">{analysis.description}</p>;
    }

    const regex = new RegExp(`(${highlightTerms.map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'gi');
    const parts = analysis.description.split(regex);

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
        description="Upload an image, ask a question, and specify objects to detect. Gemini will describe the scene and visually extract the objects for you."
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
              <button onClick={resetState} className="mt-2 text-sm text-red-400 hover:text-red-500">
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

        {error && <Alert message={error} onClose={() => setError('')} />}
        
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

        {analysis && analysis.detectedObjects.length > 0 && image && !isLoading && (
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-white">Object Locations</h3>
              <div className="relative mt-2 w-fit mx-auto bg-gray-700 p-2 rounded-lg">
                  <img 
                      src={image} 
                      alt="Analysis subject" 
                      className="max-w-full h-auto rounded-md block"
                      onLoad={(e) => {
                          // Deferring the dimension measurement slightly ensures the browser has
                          // completed its layout calculations, leading to more accurate box placement.
                          setTimeout(() => {
                            if (e.currentTarget) {
                              setImageDimensions({ 
                                  width: e.currentTarget.offsetWidth, 
                                  height: e.currentTarget.offsetHeight 
                              });
                            }
                          }, 0);
                      }} 
                  />
                  {imageDimensions && analysis.detectedObjects.map((obj, index) => {
                      const boxStyle: React.CSSProperties = {
                          position: 'absolute',
                          left: `${obj.boundingBox.x * imageDimensions.width}px`,
                          top: `${obj.boundingBox.y * imageDimensions.height}px`,
                          width: `${obj.boundingBox.width * imageDimensions.width}px`,
                          height: `${obj.boundingBox.height * imageDimensions.height}px`,
                          border: '2px solid #ef4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      };
                      
                      let topPos = obj.boundingBox.y * imageDimensions.height - 24;
                      if (topPos < 0) {
                          topPos = obj.boundingBox.y * imageDimensions.height + 2;
                      }

                      const labelStyle: React.CSSProperties = {
                          position: 'absolute',
                          left: `${obj.boundingBox.x * imageDimensions.width}px`,
                          top: `${topPos}px`,
                          backgroundColor: '#ef4444',
                          color: 'white',
                          padding: '2px 6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                      };
                      
                      return (
                          <div key={index}>
                              <div style={boxStyle} />
                              <div style={labelStyle}>{obj.name}</div>
                          </div>
                      );
                  })}
              </div>
          </div>
        )}

        {croppedObjectImages.length > 0 && !isLoading && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white">Detected Objects</h3>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {croppedObjectImages.map((cropped, index) => (
                <div key={index} className="bg-gray-700 p-2 rounded-lg text-center flex flex-col items-center">
                  <img src={cropped.dataUrl} alt={cropped.name} className="w-full h-auto object-contain rounded-md mb-2 flex-grow" />
                  <p className="text-sm text-gray-300 capitalize self-end w-full">{cropped.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysis;
