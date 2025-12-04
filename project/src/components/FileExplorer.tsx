import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Info } from 'lucide-react';
import { FileNode, RepoData } from '../types';

interface FileExplorerProps {
  fileTree: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile: string | null;
  repoData: RepoData;
}

interface FileTreeItemProps {
  node: FileNode;
  onFileSelect: (file: FileNode) => void;
  selectedFile: string | null;
  level: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, onFileSelect, selectedFile, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(prev => !prev);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded transition ${
          isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-800'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' && (
          <>
            {isExpanded ? (
             <ChevronDown size={16} className="shrink-0 mr-1 text-gray-500" />
            ) : (
              <ChevronRight size={16} className="shrink-0 mr-1 text-gray-500" />
            )}
          </>
        )}
        {node.type === 'directory' ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-600" />
          ) : (
             <Folder
                  size={16}
                  className="shrink-0 mr-2 text-blue-500"
                />
          )
        ) : (
          <File
                  size={16}
                  className="shrink-0 mr-2 text-gray-500"
                />
        )}
        <span className="truncate font-semibold">{node.name}</span>
      </div>

      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeItem
              key={`${child.path}-${index}`}
              node={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  fileTree,
  onFileSelect,
  selectedFile,
  repoData,
}) => {
  return (
    <div
      className="fixed top-0 left-0 h-full w-80 flex flex-col bg-white border border-gray-200 rounded shadow-sm overflow-y-auto z-30"
      style={{ maxHeight: '100vh' }}
    >
      {/* Repo Info Section */}
       <div className="px-10 py-2 border-b border-gray-300 bg-gray-50">
    <h1 className="text-lg font-bold text-gray-800">GitHub Repo Assistant</h1>
  </div>
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-800">Repository Info</h2>
        </div>
        <div className="text-gray-700 text-sm space-y-1 ml-6">
          <p><span className="font-medium">Repo-Name:</span> {repoData.name}</p>
          <p><span className="font-medium">Owner:</span> {repoData.owner}</p>
          <p>
            <span className="font-medium">Language:</span> {repoData.primaryLanguage || 'Unknown'}
          </p>
          <p><span className="font-medium">Forks:</span> {repoData.forkCount ?? 0}</p>
          <p><span className="font-medium">Open Issues:</span> {repoData.openIssues ?? 0}</p>
        </div>
      </div>

      {/* File Tree */}
      <div className="px-4 py-3">
        <h4 className="font-medium text-sm mb-2">File Structure</h4>
      </div>
      <div className=" ml-6 overflow-y-auto">
        {fileTree.map((node, index) => (
          <FileTreeItem
            key={`${node.path}-${index}`}
            node={node}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            level={0}
          />
        ))}
      </div>
    </div>
  );
};
