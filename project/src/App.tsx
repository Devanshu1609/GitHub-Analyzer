// App.tsx (updated for symmetric and wider UI)
import { useState } from 'react';
import { Github, MessageSquare, FileText, Zap } from 'lucide-react';
import { RepoInput } from './components/RepoInput';
import { FileExplorer } from './components/FileExplorer';
import { CodeViewer } from './components/CodeViewer';
import { ChatBox } from './components/ChatBox';
import { FileNode, ChatMessage, RepoData } from './types';
import { cloneRepo, getFileContent, explainCode} from './utils/api';

type TabType = 'chat' | 'file' | 'agents';

function App() {
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const handleRepoSubmit = async (url: string) => {
    setIsLoadingRepo(true);
    try {
      const data = await cloneRepo(url);
      setRepoData(data);
      setSelectedFile(null);
      setFileContent('');
      setChatMessages([]);
    } catch (error) {
      console.error('Error cloning repo:', error);
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      setIsLoadingFile(true);
      setActiveTab('file');

      try {
        const content = await getFileContent(file.path);
        setFileContent(content);
      } catch (error) {
        console.error('Error loading file:', error);
        setFileContent('Error loading file content');
      } finally {
        setIsLoadingFile(false);
      }
    }
  };

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsLoadingChat(true);

    try {
      const response = await explainCode(message);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting explanation:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };


  const tabs = [
    { id: 'chat', name: 'Chat', icon: MessageSquare },
    { id: 'file', name: 'File Viewer', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>
      {`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .min-h-screen::-webkit-scrollbar {
        width: 0 !important;
        background: transparent;
        }
      `}
      </style>
      {repoData ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
            <div className="w-full md:w-56 lg:w-80 flex-shrink-0 bg-white border-r border-gray-200">
            <FileExplorer
              fileTree={repoData.fileTree}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile?.path || null}
              repoData={repoData}
            />
            </div>

          {/* Main Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="fixed w-full bg-white border-b border-gray-200">
              <div className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-none mt-11">
              {activeTab === 'chat' && (
              <ChatBox
                onSendMessage={handleSendMessage}
                isLoading={isLoadingChat}
                messages={chatMessages}
              />
              )}
              {activeTab === 'file' && (
              <div className="h-full">
                {selectedFile ? (
                isLoadingFile ? (
                  <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading file content...</p>
                  </div>
                  </div>
                ) : (
                  <CodeViewer fileName={selectedFile.name} content={fileContent} />
                )
                ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a file from the explorer to view its content</p>
                  </div>
                </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center max-w-[70rem] mx-auto p-8">
            <Github className="h-16 w-16 mx-auto mb-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Welcome to AI GitHub Assistant
            </h2>
            <p className="text-gray-600 mb-4">
              Enter a GitHub repository URL below to start analyzing code with AI-powered tools.
            </p>
            {!repoData && <RepoInput onSubmit={handleRepoSubmit} isLoading={isLoadingRepo} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                {
                  icon: MessageSquare,
                  title: 'Intelligent Chat',
                  description: 'Have natural conversations with your codebase using advanced AI',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: FileText,
                  title: 'Code Exploration',
                  description: 'Browse and examine files with beautiful syntax highlighting',
                  gradient: 'from-purple-500 to-pink-500'
                },
                {
                  icon: Zap,
                  title: 'Smart Analysis',
                  description: 'Get instant insights on bugs, performance, and best practices',
                  gradient: 'from-orange-500 to-red-500'
                }
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300"
                         style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}></div>
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
