import React from 'react';
import { Copy, Download } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  fileName: string;
  content: string;
}

const detectLanguage = (fileName: string): string => {
  const extension = fileName.split('.').pop();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'cpp':
      return 'cpp';
    default:
      return 'text';
  }
};

export const CodeViewer: React.FC<CodeViewerProps> = ({ fileName, content }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  const downloadFile = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{fileName}</h3>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={downloadFile}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={detectLanguage(fileName)}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e' }}
          wrapLines
          wrapLongLines
          showLineNumbers
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
