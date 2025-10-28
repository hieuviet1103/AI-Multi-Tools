
import React, { useState } from 'react';
import { ImageAnalysisIcon, QuickChatIcon, ChatBotIcon, DeepThoughtIcon, ImageGenIcon, GeminiLogoIcon, MenuIcon, MapsIcon, SearchIcon, VideoIcon } from './components/icons/Icons';
import ImageAnalysis from './components/ImageAnalysis';
import QuickChat from './components/QuickChat';
import ChatBot from './components/ChatBot';
import DeepThought from './components/DeepThought';
import ImageGeneration from './components/ImageGeneration';
import MapsSearch from './components/MapsSearch';
import GroundingSearch from './components/GroundingSearch';
import VideoGeneration from './components/VideoGeneration';

type Tool = 'analyze' | 'quick' | 'chat' | 'deep' | 'generate' | 'maps' | 'grounding' | 'video';

const toolDetails: Record<Tool, { icon: React.ReactElement; label: string }> = {
  analyze: { icon: <ImageAnalysisIcon />, label: 'Image Analysis' },
  quick: { icon: <QuickChatIcon />, label: 'Quick Chat' },
  chat: { icon: <ChatBotIcon />, label: 'Chat Bot' },
  deep: { icon: <DeepThoughtIcon />, label: 'Deep Thought' },
  generate: { icon: <ImageGenIcon />, label: 'Image Generation' },
  video: { icon: <VideoIcon />, label: 'Video Generation' },
  maps: { icon: <MapsIcon />, label: 'Maps Search' },
  grounding: { icon: <SearchIcon />, label: 'Grounded Search' },
};


const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>('analyze');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      case 'video':
        return <VideoGeneration />;
      case 'maps':
        return <MapsSearch />;
      case 'grounding':
        return <GroundingSearch />;
      default:
        return <ImageAnalysis />;
    }
  };

  // FIX: Refactored NavItem to be a React.FC to fix a TypeScript error with the 'key' prop.
  interface NavItemProps {
    tool: Tool;
    icon: React.ReactElement;
    label: string;
  }

  const NavItem: React.FC<NavItemProps> = ({ tool, icon, label }) => (
    <button
      onClick={() => {
        setActiveTool(tool);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
        activeTool === tool ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'
      }`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </button>
  );

  const SidebarContent = () => (
    <>
      <div className="flex items-center mb-8 px-2">
        <GeminiLogoIcon />
        <h1 className="text-xl font-bold ml-3">AI Multi-Tool</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {Object.entries(toolDetails).map(([key, { icon, label }]) => (
          <NavItem key={key} tool={key as Tool} icon={icon} label={label} />
        ))}
      </nav>
      <footer className="mt-auto text-center text-xs text-gray-500">
        <p>Powered by Google Gemini</p>
      </footer>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 p-4 border-r border-gray-700 flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full md:w-auto">
        <header className="md:hidden bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 hover:text-white" aria-label="Open sidebar">
              <MenuIcon />
            </button>
            <h2 className="text-lg font-semibold">{toolDetails[activeTool].label}</h2>
            <div className="w-6"></div> {/* Spacer to center the title */}
        </header>

        <main className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto">
          {renderTool()}
        </main>
      </div>
    </div>
  );
};

export default App;
