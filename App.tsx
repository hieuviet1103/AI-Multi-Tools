
import React, { useState } from 'react';
import { ImageAnalysisIcon, QuickChatIcon, ChatBotIcon, DeepThoughtIcon, ImageGenIcon, GeminiLogoIcon } from './components/icons/Icons';
import ImageAnalysis from './components/ImageAnalysis';
import QuickChat from './components/QuickChat';
import ChatBot from './components/ChatBot';
import DeepThought from './components/DeepThought';
import ImageGeneration from './components/ImageGeneration';

type Tool = 'analyze' | 'quick' | 'chat' | 'deep' | 'generate';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>('analyze');

  const renderTool = () => {
    switch (activeTool) {
      case 'analyze':
        return <ImageAnalysis />;
      case 'quick':
        return <QuickChat />;
      case 'chat':
        return <ChatBot />;
      case 'deep':
        return <DeepThought />;
      case 'generate':
        return <ImageGeneration />;
      default:
        return <ImageAnalysis />;
    }
  };

  // FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const NavItem = ({ tool, icon, label }: { tool: Tool; icon: React.ReactElement; label: string }) => (
    <button
      onClick={() => setActiveTool(tool)}
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
        activeTool === tool ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'
      }`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
        <div className="flex items-center mb-8 px-2">
          <GeminiLogoIcon />
          <h1 className="text-xl font-bold ml-3">AI Multi-Tool</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          <NavItem tool="analyze" icon={<ImageAnalysisIcon />} label="Image Analysis" />
          <NavItem tool="quick" icon={<QuickChatIcon />} label="Quick Chat" />
          <NavItem tool="chat" icon={<ChatBotIcon />} label="Chat Bot" />
          <NavItem tool="deep" icon={<DeepThoughtIcon />} label="Deep Thought" />
          <NavItem tool="generate" icon={<ImageGenIcon />} label="Image Generation" />
        </nav>
        <footer className="mt-auto text-center text-xs text-gray-500">
          <p>Powered by Google Gemini</p>
        </footer>
      </aside>
      <main className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto">
        {renderTool()}
      </main>
    </div>
  );
};

export default App;
