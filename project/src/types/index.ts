// Node in the file tree
export interface FileNode {
  name: string;
  type: 'file' | 'directory'; // Updated 'folder' to 'directory'
  path: string;
  children?: FileNode[];
  content?: string;
}

// AI chat message type
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// Agent-based tool output
export interface AgentResult {
  type: 'bugFinder' | 'reviewer' | 'docgen';
  title: string;
  content: string;
  status: 'success' | 'error';
  timestamp: Date;
  filePath: string; // ✅ Added to track which file the result is for
}


// export interface AgentResult {
//   agentType: 'bugFinder' | 'reviewer' | 'docgen';
//   result: string;
//   timestamp: Date;
//   title: string;
//   content: string;
//   type: 'bugFinder' | 'reviewer' | 'docgen';
// }


// Basic repository data
export interface RepoData {
  url: string;
  name: string;
  summary: string;
  fileTree: FileNode[];
  owner: string;
  description?: string;
  primaryLanguage?: string;
  starCount?: number;
  forkCount?: number;
  openIssues?: number;
  lastUpdated?: Date;
  chunksProcessed?: number;
}

// Extended metadata for repository info
export interface RepositoryInfo extends RepoData {
  owner: string;
  description?: string;
  primaryLanguage?: string;
  starCount?: number;
  forkCount?: number;
  lastUpdated?: Date;
  chunksProcessed?: number;
}
