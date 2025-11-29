import { FileNode, AgentResult, RepoData } from '../types/index';

const API_BASE_URL = 'https://github-analyzer-1lbe.onrender.com';

/**
 * Recursively converts backend file tree structure into FileNode[]
 */
const transformFileTree = (node: Record<string, any>, currentPath = ''): FileNode[] => {
  if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return [];

  return node.children.map((child: Record<string, any>) => {
    const childPath = `${currentPath}${child.name}`;
    return {
      name: child.name,
      path: childPath,
      type: child.type === 'folder' ? 'directory' : 'file',
      children: child.type === 'folder'
        ? transformFileTree(child, `${childPath}/`)
        : undefined,
      content: child.content || undefined
    };
  });
};

/**
 * Clone and analyze a GitHub repository via backend API
 */
export const cloneRepo = async (repoUrl: string): Promise<RepoData> => {
  try {
    // 1. Hit your backend to clone/analyze repo
    const response = await fetch(`${API_BASE_URL}/upload-repo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze repository');
    }

    const data = await response.json();
    console.log(`Repository analysis completed: ${repoUrl}`);

    // 2. Extract owner + repo name from URL
    const urlParts = new URL(repoUrl).pathname.split('/').filter(Boolean);
    const owner = urlParts[0];
    const repoName = urlParts[1];

    // 3. Fetch GitHub metadata directly
    const githubMeta = await fetch(`https://api.github.com/repos/${owner}/${repoName}`);
    const meta = await githubMeta.json();

    // 4. Fetch languages breakdown to determine primary language
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/languages`);
    const langData = await langRes.json();

    // Calculate primary language
    let primaryLanguage = '';
    if (langData && Object.keys(langData).length > 0) {
      const langEntries = Object.entries(langData) as [string, number][];
      primaryLanguage = langEntries
        .sort((a, b) => b[1] - a[1])[0][0]; // largest bytes = primary
    }

    // 5. Construct final repo info
    const repoInfo: RepoData = {
      name: repoName,
      owner,
      url: repoUrl,
      summary: data.summary || '',
      description: meta.description || data.description || '',
      primaryLanguage,
      fileTree: transformFileTree(data.file_tree),
      starCount: meta.stargazers_count || 0,
      forkCount: meta.forks_count || 0,
      openIssues: meta.open_issues_count || 0,
      lastUpdated: meta.updated_at ? new Date(meta.updated_at) : new Date()
    };

    console.log("Repo info:", repoInfo);

    // Save to session storage
    sessionStorage.setItem('repoInfo', JSON.stringify(repoInfo));
    return repoInfo;

  } catch (error) {
    console.error('Error in cloneRepo:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze repository');
  }
};


/**
 * Fetch content of a specific file
 */
export const getFileContent = async (filePath: string): Promise<string> => {
  try {
    const repoInfo = sessionStorage.getItem('repoInfo');
    const repoName = repoInfo ? JSON.parse(repoInfo).name : '';
    const fullPath = `temp/${repoName}/${filePath}`;
    const response = await fetch(
      `${API_BASE_URL}/view-file?file_path=${encodeURIComponent(fullPath)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch file content');
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching file content:', error);
    throw new Error('Failed to fetch file content');
  }
};

/**
 * Ask a natural language question about the repo
 */
export const explainCode = async (
  question: string,
): Promise<string> => {
  const repoInfo = sessionStorage.getItem('repoInfo');
  const repoName = repoInfo ? JSON.parse(repoInfo).name : '';
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question, repo_name: repoName })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get AI response');
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error in explainCode:', error);
    throw new Error('Failed to get explanation');
  }
};

/**
 * Run an AI agent like bugFinder, reviewer, or docgen
 * Placeholder: not implemented in backend yet
 */
export const runAgent = async (
  agentType: 'bugFinder' | 'reviewer' | 'docgen',
  filePath: string,
  fileContent: string
): Promise<AgentResult> => {
  try {
    let endpoint = '';
    let title = '';
    
    switch (agentType) {
      case 'bugFinder':
        endpoint = '/debug';
        title = 'Bug Finder Results';
        break;
      case 'reviewer':
        endpoint = '/review';
        title = 'Code Review Results';
        break;
      case 'docgen':
        endpoint = '/docgen';
        title = 'Documentation Suggestions';
        break;
      default:
        throw new Error(`Agent type "${agentType}" not supported`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_path: `./temp/cloned_repo/${filePath}`,
        content: fileContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to run ${agentType}`);
    }

    const data = await response.json();
    console.log(`${title} for ${filePath}:`, data);

    return {
      type: agentType,
      title,
      content: data.answer || 'No results returned.',
      status: 'success',
      timestamp: new Date(),
      filePath
    };
  } catch (error) {
    console.error(`Error in runAgent for ${agentType}:`, error);
    throw new Error(`Failed to run ${agentType} agent`);
  }
};
