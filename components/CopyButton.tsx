
import React, { useState } from 'react';
import { CopyIcon } from './icons/Icons';

interface CopyButtonProps {
  textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center px-3 py-1 bg-gray-600 text-gray-200 text-xs font-medium rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-default"
      disabled={isCopied}
      aria-label="Copy response to clipboard"
    >
      {isCopied ? (
        'Copied!'
      ) : (
        <>
          <CopyIcon className="h-4 w-4 mr-1.5" />
          Copy
        </>
      )}
    </button>
  );
};

export default CopyButton;
