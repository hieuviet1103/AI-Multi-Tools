
import React, { useState, useCallback } from 'react';
import { generateSpeech } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import Alert from './Alert';

// Helper function to decode base64 string to Uint8Array
const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

// Helper function to write a string to a DataView
const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

// Helper function to convert raw PCM data to a WAV file Blob
const encodeWAV = (samples: Uint8Array, sampleRate: number, numChannels: number): Blob => {
    const bitsPerSample = 16;
    const buffer = new ArrayBuffer(44 + samples.length);
    const view = new DataView(buffer);
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, byteRate, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitsPerSample, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length, true);
    
    // Write PCM samples
    const pcm = new Uint8Array(samples.buffer);
    for (let i = 0; i < pcm.length; i++) {
        view.setUint8(44 + i, pcm[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
};


const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>('Hello! I am a friendly AI. Have a wonderful day!');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isLoading) return;
    
    setIsLoading(true);
    setAudioUrl(null);
    setError('');

    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audioBytes = decode(base64Audio);
        // The API returns 16-bit PCM at 24kHz with 1 channel
        const audioBlob = encodeWAV(audioBytes, 24000, 1);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      } else {
        throw new Error("The model did not return any audio data.");
      }
    } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [text, isLoading]);

  return (
    <div className="max-w-3xl mx-auto">
      <ToolHeader 
        title="Text-to-Speech"
        description="Convert text into natural-sounding speech using Gemini. Type your text below and listen to the result."
      />

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <label htmlFor="tts-text" className="block text-sm font-medium text-gray-300 mb-2">Text to Convert</label>
        <textarea
          id="tts-text"
          rows={6}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want to convert to speech..."
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !text.trim()}
          className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Speech'}
        </button>

        {error && <Alert message={error} onClose={() => setError('')} />}

        <div className="mt-6">
          {isLoading && (
            <div className="flex flex-col justify-center items-center h-24 bg-gray-700 rounded-md">
              <Spinner />
              <p className="mt-2 text-gray-400">Generating audio...</p>
            </div>
          )}
          {audioUrl && !isLoading && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Generated Audio</h3>
              <audio controls src={audioUrl} className="w-full">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;