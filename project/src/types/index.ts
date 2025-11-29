export interface FileNode {
  name: string;
  type: 'file' | 'directory'; 
  path: string;
  children?: FileNode[];
  content?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface AgentResult {
  type: 'bugFinder' | 'reviewer' | 'docgen';
  title: string;
  content: string;
  status: 'success' | 'error';
  timestamp: Date;
  filePath: string;
}

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

export interface RepositoryInfo extends RepoData {
  owner: string;
  description?: string;
  primaryLanguage?: string;
  starCount?: number;
  forkCount?: number;
  lastUpdated?: Date;
  chunksProcessed?: number;
}
