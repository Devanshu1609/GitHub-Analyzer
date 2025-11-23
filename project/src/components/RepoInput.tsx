import React, { useState } from 'react';

interface RepoInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const RepoInput: React.FC<RepoInputProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              GitHub Repository URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste GitHub repository URL"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1 pr-40">
              Example: https://github.com/facebook/react
            </p>
          </div>
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="w-full py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Repository'}
          </button>
        </form>
      </div>
    </div>
  );
};
