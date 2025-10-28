
import React from 'react';

interface ToolHeaderProps {
  title: string;
  description: string;
}

const ToolHeader: React.FC<ToolHeaderProps> = ({ title, description }) => (
  <div className="mb-6">
    <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
    <p className="text-gray-400">{description}</p>
  </div>
);

export default ToolHeader;
