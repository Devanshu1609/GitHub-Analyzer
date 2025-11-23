import React, { useState } from 'react';
import {
  Bug,
  CheckCircle,
  FileText,
  Loader2,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import { AgentResult } from '../types';

interface AgentPanelProps {
  onRunAgent: (agentType: 'bugFinder' | 'reviewer' | 'docgen') => void;
  isLoading: boolean;
  results: AgentResult[];
  selectedFilePath: string | null;
}

// Helper to format individual result content
const formatReviewContent = (rawContent: string) => {
  const lines = rawContent.split('\n').filter((line) => line.trim() !== '');

  const content: JSX.Element[] = [];
  let pointCounter = 1;

  lines.forEach((line, i) => {
    const headingMatch = line.match(/^\*{2}(.*?)\*{2}$/);
    const bulletMatch = line.match(/^\*\s+(.*)/);
    const codeBlockStart = line.startsWith('```');

    // Section heading
    if (headingMatch) {
      content.push(
        <h2
          key={`heading-${i}`}
          className="text-md font-bold text-blue-800 mt-4 mb-2 border-b pb-1"
        >
          {headingMatch[1].replace(/\*\*/g, '')}
        </h2>
      );
      pointCounter = 1;
    }

    // Numbered bullet points
    else if (bulletMatch) {
      content.push(
        <div key={`point-${i}`} className="flex items-start gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {pointCounter++}.
          </span>
          <span className="text-gray-800">{formatInlineCode(bulletMatch[1])}</span>
        </div>
      );
    }

    // Code block
    else if (codeBlockStart) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      content.push(
        <pre
          key={`code-${i}`}
          className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-4 whitespace-pre-wrap"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    }

    // Paragraph (remove bold from inline phrases like **Good:**)
    else {
      const cleanLine = line.replace(/\*\*(.*?):\*\*/g, (_, p1) => `${p1}:`); // Remove ** from Good:, Note:, etc.
      content.push(
        <p key={`para-${i}`} className="text-gray-700 mb-2">
          {formatInlineCode(cleanLine)}
        </p>
      );
    }
  });

  return content;
};


// Helper for inline `code`
const formatInlineCode = (text: string) => {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code
        key={i}
        className="bg-gray-200 rounded px-1 text-sm font-mono text-indigo-600"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
};

export const AgentPanel: React.FC<AgentPanelProps> = ({
  onRunAgent,
  isLoading,
  results,
  selectedFilePath
}) => {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const agents = [
    {
      id: 'bugFinder',
      name: 'Bug Finder',
      icon: Bug,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      hoverColor: 'hover:bg-red-100',
      description: 'Scan for potential bugs and issues'
    },
    {
      id: 'reviewer',
      name: 'Code Reviewer',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      description: 'Get detailed code review and suggestions'
    },
    {
      id: 'docgen',
      name: 'Doc Generator',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      description: 'Generate comprehensive documentation'
    }
  ];

  const handleAgentClick = (agentType: 'bugFinder' | 'reviewer' | 'docgen') => {
    if (!isLoading) {
      setActiveAgent(agentType);
      onRunAgent(agentType);
    }
  };

  const renderResult = (result: AgentResult) => {
    const getResultIcon = () => {
      switch (result.type) {
        case 'bugFinder':
          return <Bug className="h-5 w-5 text-red-600" />;
        case 'reviewer':
          return <CheckSquare className="h-5 w-5 text-green-600" />;
        case 'docgen':
          return <FileText className="h-5 w-5 text-blue-600" />;
      }
    };

    const getResultColor = () => {
      switch (result.type) {
        case 'bugFinder':
          return 'border-red-200 bg-red-50';
        case 'reviewer':
          return 'border-green-200 bg-green-50';
        case 'docgen':
          return 'border-blue-200 bg-blue-50';
      }
    };

    return (
      <div
        key={`${result.type}-${result.timestamp.getTime()}`}
        className={`mt-4 p-4 rounded-lg border ${getResultColor()}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {getResultIcon()}
          <div className="flex justify-between w-full">
            <h4 className="font-semibold text-gray-900">{result.title}</h4>
            <p className="text-xs text-gray-600">
              FileName: <span className="font-mono">{result.filePath.split('/').pop()}</span>
            </p>
          </div>
        </div>
        <div className="prose prose-sm max-w-none">
          {formatReviewContent(result.content)}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {result.timestamp.toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">AI Agents</h3>
        <p className="text-xs text-gray-500 mt-1">Run specialized analysis on the selected file</p>
      </div>

      <div className="flex justify-between gap-20 p-4 space-y-3">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isActive = activeAgent === agent.id && isLoading;

          return (
            <button
              key={agent.id}
              onClick={() => handleAgentClick(agent.id as 'bugFinder' | 'reviewer' | 'docgen')}
              disabled={isLoading}
              className={`w-full p-3 rounded-lg border border-gray-200 ${agent.bgColor} ${agent.hoverColor} transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left`}
            >
              <div className="flex items-center gap-3" style={{ height: '70px' }}>
                {isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                ) : (
                  <Icon className={`h-5 w-5 ${agent.color}`} />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{agent.name}</div>
                  <div className="text-xs text-gray-600">{agent.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="font-medium text-gray-900 mb-2">Results</h4>
        {(() => {
          const filteredResults = results
            .filter((r) => r.filePath === selectedFilePath && r.type === activeAgent)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

          const latestResult = filteredResults[0];

          return latestResult ? (
            renderResult(latestResult)
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No result available for the selected file and agent</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
